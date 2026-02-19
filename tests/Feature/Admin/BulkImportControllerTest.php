<?php

use App\Enums\CourseScope;
use App\Jobs\ProcessCsvImport;
use App\Models\CanonicalTopic;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\Faculty;
use App\Models\ImportLog;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\User;
use App\Services\ContentImportService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->actingAs($this->admin);
});

test('index displays import page', function () {
    $this->get(route('admin.import.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/import/index')
            ->has('import_types')
        );
});

test('history displays import logs with pagination', function () {
    ImportLog::factory()->count(3)->create();

    $this->get(route('admin.import.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/import/history')
            ->has('logs.data', 3)
            ->has('logs.meta.current_page')
            ->has('logs.meta.last_page')
            ->has('logs.meta.per_page')
            ->has('logs.meta.total')
            ->has('logs.links.prev')
            ->has('logs.links.next')
        );
});

test('topics import rejects CSV with invalid discipline_slug', function () {
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nnon-existent,Topic A,intermediate,Content here";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertStatus(422)
        ->assertJsonStructure(['errors']);

    $this->assertDatabaseHas('import_logs', ['status' => 'failed']);
});

test('topics import rejects CSV with invalid difficulty_level', function () {
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Topic A,super_hard,Content here";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertStatus(422)
        ->assertJsonStructure(['errors']);
});

test('topics import does not create any records when one row fails validation', function () {
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Valid Topic,intermediate,Content\nnon-existent,Bad Topic,intermediate,Content\nmathematics,Another Valid,foundational,Content";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertStatus(422);

    $this->assertDatabaseCount('canonical_topics', 0);
});

test('topics import dispatches job for valid CSV', function () {
    Queue::fake();
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Integration,intermediate,Content here";
    $file = UploadedFile::fake()->createWithContent('topics.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertOk()
        ->assertJson(['message' => 'Import queued successfully.']);

    Queue::assertPushed(ProcessCsvImport::class);
    $this->assertDatabaseHas('import_logs', ['status' => 'pending', 'import_type' => 'topics']);
});

test('topic import sets content_plain from markdown', function () {
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $rows = [['discipline_slug' => 'mathematics', 'title' => 'Integration Basics', 'difficulty_level' => 'intermediate', 'content_markdown' => 'Learn about integrals']];
    $log = ImportLog::factory()->pending()->create(['import_type' => 'topics']);

    $service = new ContentImportService;
    $service->importTopics($rows, $log);

    $topic = CanonicalTopic::where('slug', 'integration-basics')->first();
    expect($topic)->not->toBeNull();
    expect($topic->content_plain)->not->toBeNull();
    expect($topic->content_plain)->toContain('Learn about integrals');
});

test('topic import stores valid Tiptap JSON in content', function () {
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $rows = [['discipline_slug' => 'mathematics', 'title' => 'Calculus Review', 'difficulty_level' => 'foundational', 'content_markdown' => 'Derivatives and limits']];
    $log = ImportLog::factory()->pending()->create(['import_type' => 'topics']);

    $service = new ContentImportService;
    $service->importTopics($rows, $log);

    $topic = CanonicalTopic::where('slug', 'calculus-review')->first();
    expect($topic->content)->toBeArray();
    expect($topic->content['type'])->toBe('doc');
    expect($topic->content['content'])->toBeArray();
    expect($topic->content['content'][0]['type'])->toBe('paragraph');
});

test('course mappings import uses canonical_topic_id UUID', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'UNILAG']);
    $discipline = Discipline::factory()->create(['slug' => 'computer-science']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'CSC 201',
    ]);

    $topic = CanonicalTopic::factory()->create([
        'discipline_id' => $discipline->id,
        'slug' => 'data-structures',
        'is_published' => true,
    ]);

    $rows = [[
        'institution_abbreviation' => 'UNILAG',
        'course_code' => 'CSC 201',
        'discipline_slug' => 'computer-science',
        'topic_slug' => 'data-structures',
        'sequence_order' => '1',
        'weight' => 'core',
    ]];
    $log = ImportLog::factory()->pending()->create(['import_type' => 'course_mappings']);

    $service = new ContentImportService;
    $service->importCourseMappings($rows, $log);

    $this->assertDatabaseHas('course_topic_mappings', [
        'institution_course_id' => $course->id,
        'canonical_topic_id' => $topic->id,
    ]);
});

test('course offerings import uses institution_course_id UUID', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'UNILAG']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id, 'abbreviation' => 'CSC']);
    $owningDept = Department::factory()->create(['faculty_id' => $faculty->id]);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $owningDept->id,
        'course_code' => 'CSC 201',
        'course_scope' => CourseScope::Faculty,
    ]);

    $rows = [[
        'institution_abbreviation' => 'UNILAG',
        'course_code' => 'CSC 201',
        'department_abbreviation' => 'CSC',
        'is_compulsory' => 'true',
    ]];
    $log = ImportLog::factory()->pending()->create(['import_type' => 'course_offerings']);

    $service = new ContentImportService;
    $service->importCourseOfferings($rows, $log);

    $this->assertDatabaseHas('course_department_offerings', [
        'institution_course_id' => $course->id,
        'department_id' => $dept->id,
    ]);
});

test('course offerings import rejects non-faculty-scoped course', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'UNILAG']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id, 'abbreviation' => 'CSC']);

    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'course_code' => 'CSC 201',
        'course_scope' => CourseScope::Department,
    ]);

    $csv = "institution_abbreviation,course_code,department_abbreviation,is_compulsory\nUNILAG,CSC 201,CSC,true";
    $file = UploadedFile::fake()->createWithContent('offerings.csv', $csv);

    $this->post(route('admin.import.courseOfferings'), ['file' => $file])
        ->assertStatus(422)
        ->assertJsonStructure(['errors']);
});

test('import creates import log entry for history', function () {
    Queue::fake();
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Test Topic,foundational,Content";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file]);

    $this->assertDatabaseCount('import_logs', 1);
    $this->assertDatabaseHas('import_logs', [
        'original_filename' => 'test.csv',
        'import_type' => 'topics',
    ]);
});

test('import rejects missing file', function () {
    $this->post(route('admin.import.topics'), [])
        ->assertSessionHasErrors('file');
});

test('guests cannot access import routes', function () {
    auth()->logout();

    $this->get(route('admin.import.index'))->assertRedirect(route('login'));
    $this->get(route('admin.import.history'))->assertRedirect(route('login'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.import.index'))
        ->assertForbidden();
});
