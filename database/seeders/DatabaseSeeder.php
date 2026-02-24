<?php

namespace Database\Seeders;

use App\Enums\AnswerDepthLevel;
use App\Enums\BillingPeriod;
use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\CourseScope;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\Semester;
use App\Enums\TopicDifficulty;
use App\Enums\UserRole;
use App\Models\CanonicalTopic;
use App\Models\ContentSubmission;
use App\Models\Country;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\ExamType;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\PlatformSetting;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionOption;
use App\Models\QuestionTopicLink;
use App\Models\StudentProfile;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $nigeria = Country::create([
            'name' => 'Nigeria',
            'code' => 'NG',
            'currency_code' => 'NGN',
        ]);

        $disciplines = collect([
            'Computer Science',
            'Mass Communication',
            'English',
            'Mechanical Engineering',
        ])->mapWithKeys(fn (string $name) => [
            Str::slug($name) => Discipline::create([
                'name' => $name,
                'slug' => Str::slug($name),
            ]),
        ]);

        $institutions = [
            [
                'name' => 'Michael Okpara University of Agriculture, Umudike',
                'abbreviation' => 'MOUAU',
                'institution_type' => InstitutionType::University,
                'ownership_type' => OwnershipType::Federal,
                'state' => 'Abia',
                'city' => 'Umudike',
                'faculties' => [
                    'COLPAS' => ['Computer Science', 'Statistics', 'Mathematics', 'Physics', 'Chemistry'],
                    'COLENG' => ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering'],
                    'COLNAS' => ['Mass Communication', 'English'],
                ],
            ],
            [
                'name' => 'Imo State University',
                'abbreviation' => 'IMSU',
                'institution_type' => InstitutionType::University,
                'ownership_type' => OwnershipType::State,
                'state' => 'Imo',
                'city' => 'Owerri',
                'faculties' => [
                    'Science' => ['Computer Science', 'Mathematics'],
                    'Arts' => ['English', 'Mass Communication'],
                ],
            ],
            [
                'name' => 'Lagos State University',
                'abbreviation' => 'LASU',
                'institution_type' => InstitutionType::University,
                'ownership_type' => OwnershipType::State,
                'state' => 'Lagos',
                'city' => 'Ojo',
                'faculties' => [
                    'Science' => ['Computer Science'],
                    'Arts' => ['English', 'Mass Communication'],
                    'Engineering' => ['Mechanical Engineering'],
                ],
            ],
            [
                'name' => 'University of Nigeria, Nsukka',
                'abbreviation' => 'UNN',
                'institution_type' => InstitutionType::University,
                'ownership_type' => OwnershipType::Federal,
                'state' => 'Enugu',
                'city' => 'Nsukka',
                'faculties' => [
                    'Physical Sciences' => ['Computer Science', 'Mathematics', 'Physics'],
                    'Arts' => ['English'],
                    'Engineering' => ['Mechanical Engineering'],
                ],
            ],
            [
                'name' => 'University of Lagos',
                'abbreviation' => 'UNILAG',
                'institution_type' => InstitutionType::University,
                'ownership_type' => OwnershipType::Federal,
                'state' => 'Lagos',
                'city' => 'Akoka',
                'faculties' => [
                    'Science' => ['Computer Science', 'Mathematics'],
                    'Arts' => ['English', 'Mass Communication'],
                    'Engineering' => ['Mechanical Engineering'],
                ],
            ],
        ];

        foreach ($institutions as $data) {
            $institution = Institution::create([
                'country_id' => $nigeria->id,
                'name' => $data['name'],
                'abbreviation' => $data['abbreviation'],
                'institution_type' => $data['institution_type'],
                'ownership_type' => $data['ownership_type'],
                'state' => $data['state'],
                'city' => $data['city'],
                'is_active' => true,
            ]);

            foreach ($data['faculties'] as $facultyName => $departments) {
                $faculty = Faculty::create([
                    'institution_id' => $institution->id,
                    'name' => $facultyName,
                    'abbreviation' => Str::upper(Str::substr($facultyName, 0, 6)),
                ]);

                foreach ($departments as $departmentName) {
                    Department::create([
                        'faculty_id' => $faculty->id,
                        'name' => $departmentName,
                        'abbreviation' => Str::upper(Str::substr($departmentName, 0, 6)),
                    ]);
                }
            }
        }

        ExamType::create([
            'country_id' => $nigeria->id,
            'name' => 'JAMB UTME',
            'slug' => 'jamb-utme',
            'description' => 'Joint Admissions and Matriculation Board Unified Tertiary Matriculation Examination',
            'duration_minutes' => 120,
            'questions_per_subject' => 60,
            'is_active' => false,
        ]);

        ExamType::create([
            'country_id' => $nigeria->id,
            'name' => 'WAEC SSCE',
            'slug' => 'waec-ssce',
            'description' => 'West African Examinations Council Senior School Certificate Examination',
            'is_active' => false,
        ]);

        ExamType::create([
            'country_id' => $nigeria->id,
            'name' => 'NECO SSCE',
            'slug' => 'neco-ssce',
            'description' => 'National Examinations Council Senior School Certificate Examination',
            'is_active' => false,
        ]);

        PlatformSetting::create([
            'key' => 'monetization_enabled',
            'value' => false,
        ]);

        PlatformSetting::create([
            'key' => 'registration_open',
            'value' => true,
        ]);

        SubscriptionPlan::create([
            'name' => 'free',
            'display_name' => 'Free',
            'plan_type' => 'student',
            'price_ngn' => 0,
            'billing_period' => BillingPeriod::Monthly,
            'features' => [
                'daily_ocr' => 5,
                'daily_ai_messages' => 10,
                'daily_gradings' => 3,
                'answer_depths' => ['quick'],
            ],
            'is_active' => true,
        ]);

        SubscriptionPlan::create([
            'name' => 'scholar',
            'display_name' => 'Scholar',
            'plan_type' => 'student',
            'price_ngn' => 200000,
            'billing_period' => BillingPeriod::Monthly,
            'features' => [
                'daily_ocr' => 30,
                'daily_ai_messages' => 100,
                'daily_gradings' => 20,
                'answer_depths' => ['quick', 'standard'],
            ],
            'is_active' => true,
        ]);

        SubscriptionPlan::create([
            'name' => 'scholar-pro',
            'display_name' => 'Scholar Pro',
            'plan_type' => 'student',
            'price_ngn' => 500000,
            'billing_period' => BillingPeriod::Monthly,
            'features' => [
                'daily_ocr' => -1,
                'daily_ai_messages' => -1,
                'daily_gradings' => -1,
                'answer_depths' => ['quick', 'standard', 'deep_dive'],
            ],
            'is_active' => true,
        ]);

        $topicsByDiscipline = [
            'computer-science' => [
                ['title' => 'Introduction to Algorithms', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 15],
                ['title' => 'Data Structures and Trees', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 20],
                ['title' => 'Database Normalization', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 18],
                ['title' => 'Object Oriented Programming', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 12],
                ['title' => 'Operating Systems Concepts', 'difficulty' => TopicDifficulty::Advanced, 'minutes' => 25],
            ],
            'english' => [
                ['title' => 'Parts of Speech', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 10],
                ['title' => 'Essay Writing Techniques', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 15],
                ['title' => 'Literary Criticism', 'difficulty' => TopicDifficulty::Advanced, 'minutes' => 22],
            ],
            'mass-communication' => [
                ['title' => 'Introduction to Mass Media', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 12],
                ['title' => 'Media Ethics and Law', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 18],
            ],
            'mechanical-engineering' => [
                ['title' => 'Thermodynamics', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 20],
                ['title' => 'Engineering Mechanics', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 16],
            ],
        ];

        foreach ($topicsByDiscipline as $disciplineSlug => $topics) {
            $discipline = $disciplines->get($disciplineSlug);
            foreach ($topics as $topicData) {
                CanonicalTopic::create([
                    'discipline_id' => $discipline->id,
                    'title' => $topicData['title'],
                    'slug' => Str::slug($topicData['title']),
                    'content' => [
                        'type' => 'doc',
                        'content' => [
                            [
                                'type' => 'paragraph',
                                'content' => [
                                    ['type' => 'text', 'text' => "This is the content for {$topicData['title']}. A comprehensive guide covering key concepts and practical applications."],
                                ],
                            ],
                        ],
                    ],
                    'content_plain' => "This is the content for {$topicData['title']}. A comprehensive guide covering key concepts and practical applications.",
                    'summary' => "An overview of {$topicData['title']} covering fundamental principles and applications.",
                    'difficulty_level' => $topicData['difficulty'],
                    'estimated_read_minutes' => $topicData['minutes'],
                    'language' => 'en',
                    'is_published' => true,
                    'published_at' => now(),
                ]);
            }
        }

        $mouau = Institution::where('abbreviation', 'MOUAU')->first();
        $unn = Institution::where('abbreviation', 'UNN')->first();

        $csDeptMouau = Department::where('name', 'Computer Science')
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $mouau->id))
            ->first();
        $engDeptMouau = Department::where('name', 'English')
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $mouau->id))
            ->first();
        $meeDeptMouau = Department::where('name', 'Mechanical Engineering')
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $mouau->id))
            ->first();
        $mcmDeptMouau = Department::where('name', 'Mass Communication')
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $mouau->id))
            ->first();
        $csDeptUnn = Department::where('name', 'Computer Science')
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $unn->id))
            ->first();
        $meeDeptUnn = Department::where('name', 'Mechanical Engineering')
            ->whereHas('faculty', fn ($q) => $q->where('institution_id', $unn->id))
            ->first();

        $csDisc = $disciplines->get('computer-science');
        $engDisc = $disciplines->get('english');
        $meeDisc = $disciplines->get('mechanical-engineering');
        $mcmDisc = $disciplines->get('mass-communication');

        $courses = [
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 101', 'course_title' => 'Introduction to Computer Science', 'level' => 100, 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 102', 'course_title' => 'Introduction to Programming', 'level' => 100, 'semester' => Semester::Second, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 201', 'course_title' => 'Data Structures and Algorithms', 'level' => 200, 'semester' => Semester::First, 'credit_units' => 4, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 301', 'course_title' => 'Operating Systems', 'level' => 300, 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 302', 'course_title' => 'Database Management Systems', 'level' => 300, 'semester' => Semester::Second, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 401', 'course_title' => 'Software Engineering', 'level' => 400, 'semester' => Semester::First, 'credit_units' => 4, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $engDeptMouau->id, 'discipline_id' => $engDisc->id, 'course_code' => 'ENG 101', 'course_title' => 'Communication Skills I', 'level' => 100, 'semester' => Semester::First, 'credit_units' => 2, 'course_scope' => CourseScope::Faculty, 'is_elective' => false],
            ['institution_id' => $mouau->id, 'owning_department_id' => $engDeptMouau->id, 'discipline_id' => $engDisc->id, 'course_code' => 'ENG 102', 'course_title' => 'Communication Skills II', 'level' => 100, 'semester' => Semester::Second, 'credit_units' => 2, 'course_scope' => CourseScope::InstitutionWide],
            ['institution_id' => $mouau->id, 'owning_department_id' => $meeDeptMouau->id, 'discipline_id' => $meeDisc->id, 'course_code' => 'MEE 201', 'course_title' => 'Engineering Mechanics', 'level' => 200, 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Faculty],
            ['institution_id' => $mouau->id, 'owning_department_id' => $meeDeptMouau->id, 'discipline_id' => $meeDisc->id, 'course_code' => 'MEE 301', 'course_title' => 'Thermodynamics I', 'level' => 300, 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $mcmDeptMouau->id, 'discipline_id' => $mcmDisc->id, 'course_code' => 'MCM 101', 'course_title' => 'Introduction to Mass Communication', 'level' => 100, 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $mcmDeptMouau->id, 'discipline_id' => $mcmDisc->id, 'course_code' => 'MCM 201', 'course_title' => 'Media Ethics and Law', 'level' => 200, 'semester' => Semester::Second, 'credit_units' => 2, 'course_scope' => CourseScope::Department, 'is_elective' => true],
            ['institution_id' => $unn->id, 'owning_department_id' => $csDeptUnn->id, 'discipline_id' => $csDisc->id, 'course_code' => 'COS 101', 'course_title' => 'Introduction to Computing', 'level' => 100, 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $unn->id, 'owning_department_id' => $csDeptUnn->id, 'discipline_id' => $csDisc->id, 'course_code' => 'COS 201', 'course_title' => 'Computer Programming I', 'level' => 200, 'semester' => Semester::First, 'credit_units' => 4, 'course_scope' => CourseScope::Department],
            ['institution_id' => $unn->id, 'owning_department_id' => $meeDeptUnn->id, 'discipline_id' => $meeDisc->id, 'course_code' => 'MEE 211', 'course_title' => 'Strength of Materials', 'level' => 200, 'semester' => Semester::Both, 'credit_units' => 3, 'course_scope' => CourseScope::Faculty],
        ];

        foreach ($courses as $courseData) {
            InstitutionCourse::create(array_merge(
                ['is_elective' => false],
                $courseData,
            ));
        }

        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@skoolpad.com',
            'role' => UserRole::SuperAdmin,
            'password' => 'password',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Content Manager',
            'email' => 'content@skoolpad.com',
            'role' => UserRole::ContentManager,
            'password' => 'password',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Content Reviewer',
            'email' => 'reviewer@skoolpad.com',
            'role' => UserRole::ContentReviewer,
            'password' => 'password',
            'is_active' => true,
        ]);

        $mouauColpasFaculty = Faculty::where('institution_id', $mouau->id)->where('name', 'COLPAS')->first();

        $studentUser = User::create([
            'name' => 'Demo Student',
            'email' => 'student@skoolpad.com',
            'role' => UserRole::Student,
            'password' => 'password',
            'is_active' => true,
        ]);

        StudentProfile::create([
            'user_id' => $studentUser->id,
            'institution_id' => $mouau->id,
            'faculty_id' => $mouauColpasFaculty->id,
            'department_id' => $csDeptMouau->id,
            'level' => 300,
            'matric_number' => 'MOUAU/CSC/19/1234',
        ]);

        User::create([
            'name' => 'Inactive User',
            'email' => 'inactive@skoolpad.com',
            'role' => UserRole::Student,
            'password' => 'password',
            'is_active' => false,
        ]);

        $this->seedQuestions($admin, $mouau, $unn);
        $this->seedContentSubmissions($admin, $studentUser, $mouau);
    }

    private function seedQuestions(User $admin, Institution $mouau, Institution $unn): void
    {
        $tiptap = fn (string $text): array => [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
            ],
        ];

        $csc201 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 201')->first();
        $csc301 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 301')->first();
        $csc302 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 302')->first();
        $csc101 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 101')->first();
        $mee201 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'MEE 201')->first();
        $mee301 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'MEE 301')->first();
        $eng101 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'ENG 101')->first();
        $mcm101 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'MCM 101')->first();
        $cos101 = InstitutionCourse::where('institution_id', $unn->id)->where('course_code', 'COS 101')->first();
        $cos201 = InstitutionCourse::where('institution_id', $unn->id)->where('course_code', 'COS 201')->first();

        $algoTopic = CanonicalTopic::where('slug', 'introduction-to-algorithms')->first();
        $dsTopic = CanonicalTopic::where('slug', 'data-structures-and-trees')->first();
        $dbTopic = CanonicalTopic::where('slug', 'database-normalization')->first();
        $oopTopic = CanonicalTopic::where('slug', 'object-oriented-programming')->first();
        $osTopic = CanonicalTopic::where('slug', 'operating-systems-concepts')->first();
        $thermoTopic = CanonicalTopic::where('slug', 'thermodynamics')->first();
        $mechTopic = CanonicalTopic::where('slug', 'engineering-mechanics')->first();
        $posTopic = CanonicalTopic::where('slug', 'parts-of-speech')->first();
        $massTopic = CanonicalTopic::where('slug', 'introduction-to-mass-media')->first();

        $questions = [
            [
                'course' => $csc201,
                'type' => QuestionType::Mcq,
                'content' => 'What is the time complexity of binary search on a sorted array of n elements?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Medium,
                'status' => QuestionStatus::Published,
                'topic' => $algoTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'O(n)', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'O(log n)', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'O(n log n)', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'O(1)', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'O(log n). Binary search halves the search space with each comparison.'],
                    ['depth' => AnswerDepthLevel::Standard, 'text' => 'Binary search works by repeatedly dividing the sorted array in half. At each step, we compare the target with the middle element and discard one half. Since the array size halves each iteration, the maximum number of comparisons is log₂(n), giving O(log n) time complexity.'],
                ],
            ],
            [
                'course' => $csc201,
                'type' => QuestionType::Mcq,
                'content' => 'Which data structure uses LIFO (Last In, First Out) principle?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Easy,
                'status' => QuestionStatus::Published,
                'topic' => $dsTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'Queue', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Stack', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'Linked List', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'Tree', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'Stack. Elements are added and removed from the same end (the top).'],
                ],
            ],
            [
                'course' => $csc201,
                'type' => QuestionType::Theory,
                'content' => 'Explain the difference between a stack and a queue. Give one real-world example of each.',
                'year' => 2022, 'semester' => 'first', 'marks' => 10,
                'difficulty' => QuestionDifficulty::Medium,
                'status' => QuestionStatus::Published,
                'topic' => $dsTopic,
                'options' => [],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'A stack follows LIFO (Last In, First Out) while a queue follows FIFO (First In, First Out). Example: stack of plates (stack), bank queue (queue).'],
                    ['depth' => AnswerDepthLevel::Standard, 'text' => "A stack is a linear data structure where insertion (push) and deletion (pop) happen at the same end called the 'top'. It follows LIFO — the last element added is the first removed. Real-world example: browser back button history.\n\nA queue is a linear data structure where insertion (enqueue) happens at the rear and deletion (dequeue) at the front. It follows FIFO — the first element added is the first removed. Real-world example: print job scheduling.\n\nKey operations differ: Stack has push/pop/peek, Queue has enqueue/dequeue/front."],
                    ['depth' => AnswerDepthLevel::DeepDive, 'text' => "Stacks and queues are both abstract data types (ADTs) that represent collections of elements with restricted access patterns.\n\nSTACK (LIFO):\n- Operations: push(item), pop(), peek(), isEmpty()\n- All operations are O(1)\n- Can be implemented using arrays or linked lists\n- Applications: function call stack, expression evaluation, undo operations, DFS traversal, parenthesis matching\n- Example: The 'undo' feature in text editors maintains a stack of operations\n\nQUEUE (FIFO):\n- Operations: enqueue(item), dequeue(), front(), isEmpty()\n- All operations are O(1) with proper implementation\n- Can be implemented using circular arrays or linked lists\n- Variants: Priority Queue, Double-Ended Queue (Deque), Circular Queue\n- Applications: BFS traversal, CPU scheduling, IO buffers, print spooling\n- Example: Operating system process scheduler uses a ready queue\n\nBoth can be implemented in O(1) time for their core operations but differ fundamentally in their access patterns, making them suitable for different algorithmic problems."],
                ],
            ],
            [
                'course' => $csc201,
                'type' => QuestionType::Mcq,
                'content' => 'What is the worst-case time complexity of inserting an element into a balanced binary search tree?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Hard,
                'status' => QuestionStatus::Published,
                'topic' => $dsTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'O(1)', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'O(n)', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'O(log n)', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'O(n²)', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'O(log n). A balanced BST maintains height of log n, so traversal from root to leaf is O(log n).'],
                ],
            ],
            [
                'course' => $csc302,
                'type' => QuestionType::Mcq,
                'content' => 'Which normal form eliminates transitive dependencies?',
                'year' => 2022, 'semester' => 'second', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Medium,
                'status' => QuestionStatus::Published,
                'topic' => $dbTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'First Normal Form (1NF)', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Second Normal Form (2NF)', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'Third Normal Form (3NF)', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'Boyce-Codd Normal Form (BCNF)', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => '3NF. Third Normal Form requires that no non-prime attribute is transitively dependent on the primary key.'],
                    ['depth' => AnswerDepthLevel::Standard, 'text' => 'Third Normal Form (3NF) eliminates transitive dependencies. A relation is in 3NF if it is in 2NF and every non-prime attribute is non-transitively dependent on every candidate key. A transitive dependency occurs when A → B → C, where C depends on A indirectly through B. For example, if Student_ID → Department → HOD_Name, the HOD_Name transitively depends on Student_ID. To achieve 3NF, decompose into separate tables.'],
                ],
            ],
            [
                'course' => $csc302,
                'type' => QuestionType::Theory,
                'content' => 'Define the following terms as used in relational database design: (a) Primary Key (b) Foreign Key (c) Normalization',
                'year' => 2023, 'semester' => 'second', 'marks' => 15,
                'difficulty' => QuestionDifficulty::Easy,
                'status' => QuestionStatus::Published,
                'topic' => $dbTopic,
                'options' => [],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => '(a) Primary Key: a column or set of columns that uniquely identifies each row. (b) Foreign Key: a column that references the primary key of another table. (c) Normalization: the process of organizing data to reduce redundancy and improve integrity.'],
                ],
            ],
            [
                'course' => $csc301,
                'type' => QuestionType::Mcq,
                'content' => 'Which scheduling algorithm gives the minimum average waiting time for a given set of processes?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Medium,
                'status' => QuestionStatus::Published,
                'topic' => $osTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'First Come First Serve (FCFS)', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Shortest Job First (SJF)', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'Round Robin', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'Priority Scheduling', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'Shortest Job First (SJF). It is provably optimal for minimizing average waiting time among non-preemptive algorithms.'],
                ],
            ],
            [
                'course' => $csc301,
                'type' => QuestionType::Theory,
                'content' => 'Explain the concept of virtual memory. How does it benefit a computer system?',
                'year' => 2022, 'semester' => 'first', 'marks' => 10,
                'difficulty' => QuestionDifficulty::Hard,
                'status' => QuestionStatus::Draft,
                'topic' => $osTopic,
                'options' => [],
                'answers' => [],
            ],
            [
                'course' => $csc101,
                'type' => QuestionType::Mcq,
                'content' => 'Which of the following is NOT a characteristic of Object-Oriented Programming?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Easy,
                'status' => QuestionStatus::Published,
                'topic' => $oopTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'Encapsulation', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'Inheritance', 'is_correct' => false],
                    ['label' => 'C', 'content' => 'Goto statements', 'is_correct' => true],
                    ['label' => 'D', 'content' => 'Polymorphism', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'Goto statements. The four pillars of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction.'],
                ],
            ],
            [
                'course' => $csc101,
                'type' => QuestionType::Theory,
                'content' => 'Explain the concept of polymorphism in object-oriented programming with a suitable example.',
                'year' => 2022, 'semester' => 'first', 'marks' => 10,
                'difficulty' => QuestionDifficulty::Medium,
                'status' => QuestionStatus::InReview,
                'topic' => $oopTopic,
                'options' => [],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'Polymorphism means "many forms" — it allows objects of different classes to be treated as objects of a common parent class while behaving differently.'],
                ],
            ],
            [
                'course' => $mee201,
                'type' => QuestionType::Mcq,
                'content' => 'A force of 10N acts on a body of mass 2kg. What is the acceleration?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Easy,
                'status' => QuestionStatus::Published,
                'topic' => $mechTopic,
                'options' => [
                    ['label' => 'A', 'content' => '2 m/s²', 'is_correct' => false],
                    ['label' => 'B', 'content' => '5 m/s²', 'is_correct' => true],
                    ['label' => 'C', 'content' => '10 m/s²', 'is_correct' => false],
                    ['label' => 'D', 'content' => '20 m/s²', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => '5 m/s². Using Newton\'s second law: F = ma, so a = F/m = 10/2 = 5 m/s².'],
                ],
            ],
            [
                'course' => $mee301,
                'type' => QuestionType::Theory,
                'content' => 'State the first and second laws of thermodynamics. Explain the significance of each in engineering applications.',
                'year' => 2022, 'semester' => 'first', 'marks' => 15,
                'difficulty' => QuestionDifficulty::Hard,
                'status' => QuestionStatus::Published,
                'topic' => $thermoTopic,
                'options' => [],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'First law: Energy cannot be created or destroyed, only transformed (conservation of energy). Second law: Heat flows spontaneously from hot to cold; entropy of an isolated system always increases.'],
                    ['depth' => AnswerDepthLevel::Standard, 'text' => "First Law of Thermodynamics (Conservation of Energy): Energy can be converted from one form to another but cannot be created or destroyed. For a closed system: ΔU = Q - W, where ΔU is internal energy change, Q is heat added, and W is work done by the system. Engineering significance: forms the basis for energy balance calculations in power plants, engines, and refrigeration systems.\n\nSecond Law of Thermodynamics: It is impossible for heat to flow spontaneously from a colder body to a hotter body without external work. Alternatively, no heat engine can convert all heat into work — some must be rejected. Engineering significance: defines the theoretical maximum efficiency of heat engines (Carnot efficiency), guides the design of power cycles, and explains why perpetual motion machines are impossible."],
                ],
            ],
            [
                'course' => $eng101,
                'type' => QuestionType::Mcq,
                'content' => 'Which of the following is an example of a pronoun?',
                'year' => 2023, 'semester' => 'first', 'marks' => 1,
                'difficulty' => QuestionDifficulty::Easy,
                'status' => QuestionStatus::Published,
                'topic' => $posTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'Beautiful', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'She', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'Quickly', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'Running', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => '"She" is a pronoun — a word used in place of a noun to avoid repetition.'],
                ],
            ],
            [
                'course' => $mcm101,
                'type' => QuestionType::Theory,
                'content' => 'Discuss the role of mass media in national development with specific reference to Nigeria.',
                'year' => 2023, 'semester' => 'first', 'marks' => 20,
                'difficulty' => QuestionDifficulty::Hard,
                'status' => QuestionStatus::Draft,
                'topic' => $massTopic,
                'options' => [],
                'answers' => [],
            ],
            [
                'course' => $cos101,
                'type' => QuestionType::Mcq,
                'content' => 'Which of the following is the correct way to declare a variable in Python?',
                'year' => 2023, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Easy,
                'status' => QuestionStatus::Published,
                'topic' => $oopTopic,
                'options' => [
                    ['label' => 'A', 'content' => 'int x = 5;', 'is_correct' => false],
                    ['label' => 'B', 'content' => 'x = 5', 'is_correct' => true],
                    ['label' => 'C', 'content' => 'var x = 5', 'is_correct' => false],
                    ['label' => 'D', 'content' => 'dim x as integer', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => 'x = 5. Python uses dynamic typing — variables do not require explicit type declarations.'],
                ],
            ],
            [
                'course' => $cos201,
                'type' => QuestionType::Mcq,
                'content' => 'What is the output of the following C code: printf("%d", 5 + 3 * 2);',
                'year' => 2022, 'semester' => 'first', 'marks' => 2,
                'difficulty' => QuestionDifficulty::Medium,
                'status' => QuestionStatus::Published,
                'topic' => $algoTopic,
                'options' => [
                    ['label' => 'A', 'content' => '16', 'is_correct' => false],
                    ['label' => 'B', 'content' => '11', 'is_correct' => true],
                    ['label' => 'C', 'content' => '13', 'is_correct' => false],
                    ['label' => 'D', 'content' => '10', 'is_correct' => false],
                ],
                'answers' => [
                    ['depth' => AnswerDepthLevel::Quick, 'text' => '11. Multiplication has higher precedence than addition: 3 * 2 = 6, then 5 + 6 = 11.'],
                ],
            ],
        ];

        foreach ($questions as $qData) {
            $question = Question::create([
                'institution_course_id' => $qData['course']->id,
                'question_type' => $qData['type'],
                'content' => $qData['content'],
                'year' => $qData['year'],
                'semester' => $qData['semester'],
                'marks' => $qData['marks'],
                'difficulty_level' => $qData['difficulty'],
                'source' => QuestionSource::Manual,
                'status' => $qData['status'],
                'created_by' => $admin->id,
                'reviewed_by' => $qData['status'] === QuestionStatus::Published ? $admin->id : null,
                'published_at' => $qData['status'] === QuestionStatus::Published ? now() : null,
            ]);

            foreach ($qData['options'] as $sortOrder => $option) {
                QuestionOption::create([
                    'question_id' => $question->id,
                    'label' => $option['label'],
                    'content' => $option['content'],
                    'is_correct' => $option['is_correct'],
                    'sort_order' => $sortOrder + 1,
                ]);
            }

            QuestionTopicLink::create([
                'question_id' => $question->id,
                'canonical_topic_id' => $qData['topic']->id,
                'is_primary' => true,
            ]);

            foreach ($qData['answers'] as $answerData) {
                QuestionAnswer::create([
                    'question_id' => $question->id,
                    'depth_level' => $answerData['depth'],
                    'content' => $tiptap($answerData['text']),
                    'content_plain' => $answerData['text'],
                    'is_published' => $qData['status'] === QuestionStatus::Published,
                    'created_by' => $admin->id,
                ]);
            }
        }
    }

    private function seedContentSubmissions(User $admin, User $student, Institution $mouau): void
    {
        $csc201 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 201')->first();
        $csc301 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 301')->first();
        $firstQuestion = Question::first();

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::Question,
            'content' => [
                'question_type' => 'mcq',
                'content' => 'What is the space complexity of merge sort?',
                'options' => [
                    ['content' => 'O(1)', 'is_correct' => false],
                    ['content' => 'O(n)', 'is_correct' => true],
                    ['content' => 'O(log n)', 'is_correct' => false],
                    ['content' => 'O(n²)', 'is_correct' => false],
                ],
            ],
            'institution_course_id' => $csc201->id,
            'exam_year' => 2024,
            'status' => ContentSubmissionStatus::Pending,
        ]);

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::Question,
            'content' => [
                'question_type' => 'theory',
                'content' => 'Explain the concept of deadlock in operating systems. What are the four necessary conditions?',
            ],
            'institution_course_id' => $csc301->id,
            'exam_year' => 2023,
            'status' => ContentSubmissionStatus::Pending,
        ]);

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::PastQuestionUpload,
            'content' => ['description' => 'CSC 201 past questions from 2023 first semester exam'],
            'images' => [
                'https://placehold.co/800x1200/e2e8f0/64748b?text=Page+1',
                'https://placehold.co/800x1200/e2e8f0/64748b?text=Page+2',
            ],
            'institution_course_id' => $csc201->id,
            'exam_year' => 2023,
            'exam_semester' => Semester::First,
            'status' => ContentSubmissionStatus::Pending,
        ]);

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::PastQuestionUpload,
            'content' => ['description' => 'CSC 301 OS questions, second semester 2022'],
            'images' => [
                'https://placehold.co/800x1200/e2e8f0/64748b?text=OS+Exam+Page+1',
            ],
            'institution_course_id' => $csc301->id,
            'exam_year' => 2022,
            'exam_semester' => Semester::Second,
            'status' => ContentSubmissionStatus::Pending,
        ]);

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::Correction,
            'content' => ['correction' => 'The correct answer should be O(n log n), not O(n²). Merge sort always runs in O(n log n) time.'],
            'related_question_id' => $firstQuestion?->id,
            'status' => ContentSubmissionStatus::Pending,
        ]);

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::Question,
            'content' => [
                'question_type' => 'mcq',
                'content' => 'Which protocol operates at the transport layer of the OSI model?',
                'options' => [
                    ['content' => 'HTTP', 'is_correct' => false],
                    ['content' => 'TCP', 'is_correct' => true],
                    ['content' => 'IP', 'is_correct' => false],
                    ['content' => 'ARP', 'is_correct' => false],
                ],
            ],
            'institution_course_id' => $csc301->id,
            'status' => ContentSubmissionStatus::Approved,
            'reviewer_id' => $admin->id,
            'reviewed_at' => now()->subDays(2),
        ]);

        ContentSubmission::create([
            'submitted_by' => $student->id,
            'submission_type' => ContentSubmissionType::TopicContent,
            'content' => ['suggestion' => 'The section on binary trees could include more examples of AVL tree rotations.'],
            'status' => ContentSubmissionStatus::Rejected,
            'reviewer_id' => $admin->id,
            'reviewer_notes' => 'This topic is already covered in the advanced data structures section.',
            'reviewed_at' => now()->subDay(),
        ]);
    }
}
