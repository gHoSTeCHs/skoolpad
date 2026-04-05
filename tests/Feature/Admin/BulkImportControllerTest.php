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
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionTopicLink;
use App\Models\User;
use App\Services\Admin\ContentImportService;
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
        ->assertRedirect()
        ->assertSessionHas('importErrors');

    $this->assertDatabaseHas('import_logs', ['status' => 'failed']);
});

test('topics import rejects CSV with invalid difficulty_level', function () {
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Topic A,super_hard,Content here";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');
});

test('topics import does not create any records when one row fails validation', function () {
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Valid Topic,intermediate,Content\nnon-existent,Bad Topic,intermediate,Content\nmathematics,Another Valid,foundational,Content";
    $file = UploadedFile::fake()->createWithContent('test.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');

    $this->assertDatabaseCount('canonical_topics', 0);
});

test('topics import dispatches job for valid CSV', function () {
    Queue::fake();
    $discipline = Discipline::factory()->create(['slug' => 'mathematics']);
    $csv = "discipline_slug,title,difficulty_level,content_markdown\nmathematics,Integration,intermediate,Content here";
    $file = UploadedFile::fake()->createWithContent('topics.csv', $csv);

    $this->post(route('admin.import.topics'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('success', 'Import queued successfully.');

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
    $owningDept = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Software Engineering', 'abbreviation' => 'SWE']);

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
        ->assertRedirect()
        ->assertSessionHas('importErrors');
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

test('questions import dispatches job for valid CSV', function () {
    Queue::fake();
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    $topic = CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);

    $csv = "institution_abbreviation,course_code,question_type,content,year,semester,difficulty,option_a,option_b,option_c,option_d,option_e,correct_option,topic_slug,quick_answer,standard_answer\nMOUAU,CSC201,mcq,\"What is binary search complexity?\",2023,first,medium,O(1),O(log n),O(n),O(n log n),,B,binary-search,,";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('success', 'Import queued successfully.');

    Queue::assertPushed(ProcessCsvImport::class);
    $this->assertDatabaseHas('import_logs', ['status' => 'pending', 'import_type' => 'questions']);
});

test('questions import rejects CSV with missing required columns', function () {
    $csv = "institution_abbreviation,course_code,question_type\nMOUAU,CSC201,mcq";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');
});

test('questions import rejects invalid question_type', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);

    $csv = "institution_abbreviation,course_code,question_type,content,topic_slug\nMOUAU,CSC201,invalid_type,Some question,binary-search";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');
});

test('questions import rejects MCQ without required options', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);

    $csv = "institution_abbreviation,course_code,question_type,content,option_a,option_b,correct_option,topic_slug\nMOUAU,CSC201,mcq,Some question,,,A,binary-search";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');
});

test('questions import rejects invalid correct_option', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);

    $csv = "institution_abbreviation,course_code,question_type,content,option_a,option_b,correct_option,topic_slug\nMOUAU,CSC201,mcq,Some question,Option A,Option B,Z,binary-search";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');
});

test('questions import rejects non-existent topic_slug', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);

    $csv = "institution_abbreviation,course_code,question_type,content,option_a,option_b,correct_option,topic_slug\nMOUAU,CSC201,mcq,Some question,Option A,Option B,A,nonexistent-topic";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('importErrors');
});

test('questions import creates question with options and topic link', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    $topic = CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);
    $log = ImportLog::factory()->pending()->create([
        'import_type' => 'questions',
        'processed_by' => $this->admin->id,
    ]);

    $rows = [[
        'institution_abbreviation' => 'MOUAU',
        'course_code' => 'CSC201',
        'question_type' => 'mcq',
        'content' => 'What is the time complexity of binary search?',
        'year' => '2023',
        'semester' => 'first',
        'difficulty_level' => 'medium',
        'option_a' => 'O(1)',
        'option_b' => 'O(log n)',
        'option_c' => 'O(n)',
        'option_d' => 'O(n log n)',
        'option_e' => '',
        'correct_option' => 'B',
        'topic_slug' => 'binary-search',
        'quick_answer' => '',
        'standard_answer' => '',
    ]];

    $service = new ContentImportService;
    $result = $service->importQuestions($rows, $log);

    expect($result->success)->toBeTrue();
    expect($result->successCount)->toBe(1);

    $question = Question::where('institution_course_id', $course->id)->first();
    expect($question)->not->toBeNull();
    expect($question->question_type->value)->toBe('mcq');
    expect($question->source->value)->toBe('bulk_import');
    expect($question->created_by)->toBe($this->admin->id);

    expect($question->response_config)->toBeArray();
    expect($question->response_config['options'])->toHaveCount(4);
    $correctOptions = collect($question->response_config['options'])->where('is_correct', true);
    expect($correctOptions)->toHaveCount(1);
    expect($correctOptions->first()['label'])->toBe('B');

    expect(QuestionTopicLink::where('question_id', $question->id)->where('canonical_topic_id', $topic->id)->exists())->toBeTrue();
});

test('questions import creates answers when provided', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);
    $log = ImportLog::factory()->pending()->create([
        'import_type' => 'questions',
        'processed_by' => $this->admin->id,
    ]);

    $rows = [[
        'institution_abbreviation' => 'MOUAU',
        'course_code' => 'CSC201',
        'question_type' => 'mcq',
        'content' => 'What is binary search complexity?',
        'year' => '2023',
        'semester' => 'first',
        'difficulty_level' => 'medium',
        'option_a' => 'O(1)',
        'option_b' => 'O(log n)',
        'option_c' => 'O(n)',
        'option_d' => '',
        'option_e' => '',
        'correct_option' => 'B',
        'topic_slug' => 'binary-search',
        'quick_answer' => 'O(log n)',
        'standard_answer' => 'Binary search divides the array in half each step.',
    ]];

    $service = new ContentImportService;
    $service->importQuestions($rows, $log);

    $question = Question::first();
    expect(QuestionAnswer::where('question_id', $question->id)->count())->toBe(2);
    expect(QuestionAnswer::where('question_id', $question->id)->where('depth_level', 'quick')->exists())->toBeTrue();
    expect(QuestionAnswer::where('question_id', $question->id)->where('depth_level', 'standard')->exists())->toBeTrue();

    $quickAnswer = QuestionAnswer::where('question_id', $question->id)->where('depth_level', 'quick')->first();
    expect($quickAnswer->created_by)->toBe($this->admin->id);
    expect($quickAnswer->content_plain)->toContain('O(log n)');
});

test('questions import with default_status published sets published_at', function () {
    $institution = Institution::factory()->create(['abbreviation' => 'MOUAU']);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'course_code' => 'CSC201',
    ]);
    CanonicalTopic::factory()->create(['slug' => 'binary-search', 'is_published' => true]);
    $log = ImportLog::factory()->pending()->create([
        'import_type' => 'questions',
        'processed_by' => $this->admin->id,
    ]);

    $rows = [[
        'institution_abbreviation' => 'MOUAU',
        'course_code' => 'CSC201',
        'question_type' => 'theory',
        'content' => 'Explain binary search.',
        'year' => '',
        'semester' => '',
        'difficulty_level' => '',
        'option_a' => '',
        'option_b' => '',
        'option_c' => '',
        'option_d' => '',
        'option_e' => '',
        'correct_option' => '',
        'topic_slug' => 'binary-search',
        'quick_answer' => '',
        'standard_answer' => '',
    ]];

    $service = new ContentImportService;
    $service->importQuestions($rows, $log, 'published');

    $question = Question::first();
    expect($question->status->value)->toBe('published');
    expect($question->published_at)->not->toBeNull();
});

test('questions import with default_status published rejected for non-publisher', function () {
    $moderator = User::factory()->institutionModerator()->create();
    $this->actingAs($moderator);

    $csv = "institution_abbreviation,course_code,question_type,content,topic_slug\nMOUAU,CSC201,mcq,Question,binary-search";
    $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

    $this->post(route('admin.import.questions'), ['file' => $file, 'default_status' => 'published'])
        ->assertForbidden();
});
