<?php

namespace Database\Seeders;

use App\Enums\AnswerDepthLevel;
use App\Enums\BillingPeriod;
use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\ContextType;
use App\Enums\CourseScope;
use App\Enums\EducationSystemType;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\ScaleType;
use App\Enums\Semester;
use App\Enums\TeachingDepth;
use App\Enums\TopicDifficulty;
use App\Enums\UserRole;
use App\Models\AssessmentSubject;
use App\Models\AssessmentType;
use App\Models\CalendarTerm;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentSubmission;
use App\Models\Country;
use App\Models\CourseBlockMapping;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\ExamType;
use App\Models\Faculty;
use App\Models\GradingScale;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\InstitutionType as InstitutionTypeModel;
use App\Models\LevelSubject;
use App\Models\PlatformSetting;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionContext;
use App\Models\QuestionContextLink;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use App\Models\QuestionTopicLink;
use App\Models\SchemeOfWorkItem;
use App\Models\Stream;
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

        $nerdc = EducationSystem::create([
            'name' => 'Nigerian Educational Research and Development Council',
            'slug' => 'nerdc',
            'country_id' => $nigeria->id,
            'system_type' => EducationSystemType::National,
        ]);

        $waecBoard = EducationSystem::create([
            'name' => 'West African Examinations Council',
            'slug' => 'waec',
            'country_id' => null,
            'system_type' => EducationSystemType::ExamBoard,
        ]);

        $primary = CurriculumTier::create([
            'education_system_id' => $nerdc->id,
            'name' => 'Primary',
            'slug' => 'primary',
            'sort_order' => 1,
            'is_tertiary' => false,
        ]);

        $juniorSecondary = CurriculumTier::create([
            'education_system_id' => $nerdc->id,
            'name' => 'Junior Secondary School',
            'slug' => 'junior-secondary',
            'sort_order' => 2,
            'is_tertiary' => false,
        ]);

        $seniorSecondary = CurriculumTier::create([
            'education_system_id' => $nerdc->id,
            'name' => 'Senior Secondary School',
            'slug' => 'senior-secondary',
            'sort_order' => 3,
            'is_tertiary' => false,
        ]);

        $tertiaryTier = CurriculumTier::create([
            'education_system_id' => $nerdc->id,
            'name' => 'Tertiary',
            'slug' => 'tertiary',
            'sort_order' => 4,
            'is_tertiary' => true,
        ]);

        foreach (range(1, 6) as $i) {
            EducationLevel::create(['curriculum_tier_id' => $primary->id, 'name' => "Primary $i", 'display_name' => "Primary $i", 'sort_order' => $i, 'typical_age_min' => 5 + $i, 'typical_age_max' => 6 + $i]);
        }

        $jss1 = EducationLevel::create(['curriculum_tier_id' => $juniorSecondary->id, 'name' => 'JSS 1', 'display_name' => 'JSS 1', 'sort_order' => 1, 'typical_age_min' => 10, 'typical_age_max' => 12]);
        $jss2 = EducationLevel::create(['curriculum_tier_id' => $juniorSecondary->id, 'name' => 'JSS 2', 'display_name' => 'JSS 2', 'sort_order' => 2, 'typical_age_min' => 11, 'typical_age_max' => 13]);
        $jss3 = EducationLevel::create(['curriculum_tier_id' => $juniorSecondary->id, 'name' => 'JSS 3', 'display_name' => 'JSS 3', 'sort_order' => 3, 'typical_age_min' => 12, 'typical_age_max' => 14]);

        $ss1 = EducationLevel::create(['curriculum_tier_id' => $seniorSecondary->id, 'name' => 'SS 1', 'display_name' => 'SS 1', 'sort_order' => 1, 'typical_age_min' => 13, 'typical_age_max' => 16]);
        $ss2 = EducationLevel::create(['curriculum_tier_id' => $seniorSecondary->id, 'name' => 'SS 2', 'display_name' => 'SS 2', 'sort_order' => 2, 'typical_age_min' => 14, 'typical_age_max' => 17]);
        $ss3 = EducationLevel::create(['curriculum_tier_id' => $seniorSecondary->id, 'name' => 'SS 3', 'display_name' => 'SS 3', 'sort_order' => 3, 'typical_age_min' => 15, 'typical_age_max' => 18]);

        $level100 = EducationLevel::create(['curriculum_tier_id' => $tertiaryTier->id, 'name' => '100 Level', 'display_name' => '100L', 'sort_order' => 1, 'typical_age_min' => 16, 'typical_age_max' => 20]);
        $level200 = EducationLevel::create(['curriculum_tier_id' => $tertiaryTier->id, 'name' => '200 Level', 'display_name' => '200L', 'sort_order' => 2, 'typical_age_min' => 17, 'typical_age_max' => 21]);
        $level300 = EducationLevel::create(['curriculum_tier_id' => $tertiaryTier->id, 'name' => '300 Level', 'display_name' => '300L', 'sort_order' => 3, 'typical_age_min' => 18, 'typical_age_max' => 22]);
        $level400 = EducationLevel::create(['curriculum_tier_id' => $tertiaryTier->id, 'name' => '400 Level', 'display_name' => '400L', 'sort_order' => 4, 'typical_age_min' => 19, 'typical_age_max' => 23]);
        $level500 = EducationLevel::create(['curriculum_tier_id' => $tertiaryTier->id, 'name' => '500 Level', 'display_name' => '500L', 'sort_order' => 5, 'typical_age_min' => 20, 'typical_age_max' => 24]);

        $scienceStream = Stream::create(['education_system_id' => $nerdc->id, 'name' => 'Science', 'applies_from_tier_id' => $seniorSecondary->id]);
        $artsStream = Stream::create(['education_system_id' => $nerdc->id, 'name' => 'Arts', 'applies_from_tier_id' => $seniorSecondary->id]);
        $commercialStream = Stream::create(['education_system_id' => $nerdc->id, 'name' => 'Commercial', 'applies_from_tier_id' => $seniorSecondary->id]);

        $waecGrading = GradingScale::create([
            'name' => 'WAEC A1-F9',
            'scale_type' => ScaleType::Points,
            'scale_min' => 1,
            'scale_max' => 9,
            'pass_threshold' => 6,
            'grade_boundaries' => [
                ['label' => 'A1', 'min' => 75, 'max' => 100, 'points' => 1, 'is_pass' => true],
                ['label' => 'B2', 'min' => 70, 'max' => 74, 'points' => 2, 'is_pass' => true],
                ['label' => 'B3', 'min' => 65, 'max' => 69, 'points' => 3, 'is_pass' => true],
                ['label' => 'C4', 'min' => 60, 'max' => 64, 'points' => 4, 'is_pass' => true],
                ['label' => 'C5', 'min' => 55, 'max' => 59, 'points' => 5, 'is_pass' => true],
                ['label' => 'C6', 'min' => 50, 'max' => 54, 'points' => 6, 'is_pass' => true],
                ['label' => 'D7', 'min' => 45, 'max' => 49, 'points' => 7, 'is_pass' => false],
                ['label' => 'E8', 'min' => 40, 'max' => 44, 'points' => 8, 'is_pass' => false],
                ['label' => 'F9', 'min' => 0, 'max' => 39, 'points' => 9, 'is_pass' => false],
            ],
        ]);

        $universityCgpa = GradingScale::create([
            'name' => 'Nigerian University CGPA (5-point)',
            'scale_type' => ScaleType::Cgpa,
            'scale_min' => 0,
            'scale_max' => 5,
            'pass_threshold' => 1,
            'grade_boundaries' => [
                ['label' => 'A', 'min' => 70, 'max' => 100, 'gp' => 5, 'is_pass' => true],
                ['label' => 'B', 'min' => 60, 'max' => 69, 'gp' => 4, 'is_pass' => true],
                ['label' => 'C', 'min' => 50, 'max' => 59, 'gp' => 3, 'is_pass' => true],
                ['label' => 'D', 'min' => 45, 'max' => 49, 'gp' => 2, 'is_pass' => true],
                ['label' => 'E', 'min' => 40, 'max' => 44, 'gp' => 1, 'is_pass' => true],
                ['label' => 'F', 'min' => 0, 'max' => 39, 'gp' => 0, 'is_pass' => false],
            ],
            'classification_labels' => [
                ['label' => 'First Class', 'min_cgpa' => 4.5],
                ['label' => 'Second Class Upper', 'min_cgpa' => 3.5],
                ['label' => 'Second Class Lower', 'min_cgpa' => 2.4],
                ['label' => 'Third Class', 'min_cgpa' => 1.5],
                ['label' => 'Pass', 'min_cgpa' => 1.0],
            ],
        ]);

        $polytechnicCgpa = GradingScale::create([
            'name' => 'Nigerian Polytechnic CGPA (4-point)',
            'scale_type' => ScaleType::Cgpa,
            'scale_min' => 0,
            'scale_max' => 4,
            'pass_threshold' => 1,
            'grade_boundaries' => [
                ['label' => 'A', 'min' => 70, 'max' => 100, 'gp' => 4, 'is_pass' => true],
                ['label' => 'AB', 'min' => 60, 'max' => 69, 'gp' => 3.5, 'is_pass' => true],
                ['label' => 'B', 'min' => 50, 'max' => 59, 'gp' => 3, 'is_pass' => true],
                ['label' => 'BC', 'min' => 45, 'max' => 49, 'gp' => 2.5, 'is_pass' => true],
                ['label' => 'C', 'min' => 40, 'max' => 44, 'gp' => 2, 'is_pass' => true],
                ['label' => 'CD', 'min' => 35, 'max' => 39, 'gp' => 1.5, 'is_pass' => true],
                ['label' => 'D', 'min' => 30, 'max' => 34, 'gp' => 1, 'is_pass' => true],
                ['label' => 'F', 'min' => 0, 'max' => 29, 'gp' => 0, 'is_pass' => false],
            ],
            'classification_labels' => [
                ['label' => 'Distinction', 'min_cgpa' => 3.5],
                ['label' => 'Upper Credit', 'min_cgpa' => 3.0],
                ['label' => 'Lower Credit', 'min_cgpa' => 2.5],
                ['label' => 'Pass', 'min_cgpa' => 1.0],
            ],
        ]);

        $disciplines = collect([
            'Computer Science',
            'Mass Communication',
            'English',
            'Mechanical Engineering',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Economics',
            'Political Science',
            'Literature',
            'Civic Education',
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

        $mathSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Mathematics', 'slug' => 'mathematics', 'discipline_id' => $disciplines->get('mathematics')->id]);
        $englishSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'English Language', 'slug' => 'english-language', 'discipline_id' => $disciplines->get('english')->id]);
        $physicsSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Physics', 'slug' => 'physics', 'discipline_id' => $disciplines->get('physics')->id]);
        $chemistrySubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Chemistry', 'slug' => 'chemistry', 'discipline_id' => $disciplines->get('chemistry')->id]);
        $biologySubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Biology', 'slug' => 'biology', 'discipline_id' => $disciplines->get('biology')->id]);
        $csSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Computer Studies', 'slug' => 'computer-studies', 'discipline_id' => $disciplines->get('computer-science')->id]);
        $furtherMathSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Further Mathematics', 'slug' => 'further-mathematics', 'discipline_id' => $disciplines->get('mathematics')->id]);
        $economicsSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Economics', 'slug' => 'economics', 'discipline_id' => $disciplines->get('economics')->id]);
        $governmentSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Government', 'slug' => 'government', 'discipline_id' => $disciplines->get('political-science')->id]);
        $literatureSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Literature in English', 'slug' => 'literature-in-english', 'discipline_id' => $disciplines->get('literature')->id]);
        $civicSubject = CurriculumSubject::create(['education_system_id' => $nerdc->id, 'name' => 'Civic Education', 'slug' => 'civic-education', 'discipline_id' => $disciplines->get('civic-education')->id]);

        $coreJssSubjects = [$mathSubject, $englishSubject, $csSubject, $civicSubject];
        foreach ([$jss1, $jss2, $jss3] as $level) {
            foreach ($coreJssSubjects as $subject) {
                LevelSubject::create(['education_level_id' => $level->id, 'curriculum_subject_id' => $subject->id, 'is_compulsory' => true]);
            }
        }

        $coreSsSubjects = [$mathSubject, $englishSubject, $civicSubject];
        foreach ([$ss1, $ss2, $ss3] as $level) {
            foreach ($coreSsSubjects as $subject) {
                LevelSubject::create(['education_level_id' => $level->id, 'curriculum_subject_id' => $subject->id, 'is_compulsory' => true]);
            }
            foreach ([$physicsSubject, $chemistrySubject, $biologySubject, $furtherMathSubject] as $scienceSubject) {
                LevelSubject::create(['education_level_id' => $level->id, 'curriculum_subject_id' => $scienceSubject->id, 'is_compulsory' => false, 'stream_id' => $scienceStream->id]);
            }
            foreach ([$governmentSubject, $literatureSubject, $economicsSubject] as $artsSubject) {
                LevelSubject::create(['education_level_id' => $level->id, 'curriculum_subject_id' => $artsSubject->id, 'is_compulsory' => false, 'stream_id' => $artsStream->id]);
            }
            foreach ([$economicsSubject] as $commercialSubject) {
                if (! LevelSubject::where('education_level_id', $level->id)->where('curriculum_subject_id', $commercialSubject->id)->exists()) {
                    LevelSubject::create(['education_level_id' => $level->id, 'curriculum_subject_id' => $commercialSubject->id, 'is_compulsory' => false, 'stream_id' => $commercialStream->id]);
                }
            }
        }

        AssessmentType::create([
            'education_system_id' => $waecBoard->id,
            'name' => 'WASSCE',
            'slug' => 'wassce',
            'tier_id' => $seniorSecondary->id,
            'is_exit_exam' => true,
            'is_entrance_exam' => false,
            'grading_scale_id' => $waecGrading->id,
        ]);

        AssessmentType::create([
            'education_system_id' => $nerdc->id,
            'name' => 'BECE',
            'slug' => 'bece',
            'tier_id' => $juniorSecondary->id,
            'is_exit_exam' => true,
            'is_entrance_exam' => false,
            'grading_scale_id' => $waecGrading->id,
        ]);

        AssessmentType::create([
            'education_system_id' => $nerdc->id,
            'name' => 'NECO SSCE',
            'slug' => 'neco-ssce',
            'tier_id' => $seniorSecondary->id,
            'is_exit_exam' => true,
            'is_entrance_exam' => false,
            'grading_scale_id' => $waecGrading->id,
        ]);

        AssessmentType::create([
            'education_system_id' => $nerdc->id,
            'name' => 'JAMB UTME',
            'slug' => 'jamb-utme',
            'tier_id' => null,
            'is_exit_exam' => false,
            'is_entrance_exam' => true,
            'grading_scale_id' => $waecGrading->id,
        ]);

        $wassce = AssessmentType::where('slug', 'wassce')->first();

        $wascSubjects = [
            ['name' => 'Mathematics', 'slug' => 'mathematics', 'is_compulsory' => true],
            ['name' => 'English Language', 'slug' => 'english-language', 'is_compulsory' => true],
            ['name' => 'Physics', 'slug' => 'physics', 'is_compulsory' => false],
            ['name' => 'Chemistry', 'slug' => 'chemistry', 'is_compulsory' => false],
            ['name' => 'Biology', 'slug' => 'biology', 'is_compulsory' => false],
            ['name' => 'Economics', 'slug' => 'economics', 'is_compulsory' => false],
            ['name' => 'Government', 'slug' => 'government', 'is_compulsory' => false],
            ['name' => 'Literature in English', 'slug' => 'literature-in-english', 'is_compulsory' => false],
            ['name' => 'Civic Education', 'slug' => 'civic-education', 'is_compulsory' => false],
        ];

        foreach ($wascSubjects as $subject) {
            AssessmentSubject::create(array_merge($subject, ['assessment_type_id' => $wassce->id]));
        }

        $universityType = InstitutionTypeModel::create([
            'country_id' => $nigeria->id,
            'name' => 'University',
            'slug' => 'university',
            'level_progression' => ['100L', '200L', '300L', '400L', '500L'],
            'credit_system' => 'Credit Units',
            'grading_scale_id' => $universityCgpa->id,
            'qualification_names' => ['B.Sc.', 'B.A.', 'B.Eng.', 'B.Tech.'],
        ]);

        InstitutionTypeModel::create([
            'country_id' => $nigeria->id,
            'name' => 'Polytechnic',
            'slug' => 'polytechnic',
            'level_progression' => ['ND I', 'ND II', 'HND I', 'HND II'],
            'credit_system' => 'Credit Units',
            'grading_scale_id' => $polytechnicCgpa->id,
            'qualification_names' => ['ND', 'HND'],
        ]);

        InstitutionTypeModel::create([
            'country_id' => $nigeria->id,
            'name' => 'College of Education',
            'slug' => 'college-of-education',
            'level_progression' => ['NCE I', 'NCE II', 'NCE III'],
            'credit_system' => 'Credit Units',
            'grading_scale_id' => $polytechnicCgpa->id,
            'qualification_names' => ['NCE'],
        ]);

        InstitutionTypeModel::create([
            'country_id' => $nigeria->id,
            'name' => 'Monotechnic',
            'slug' => 'monotechnic',
            'level_progression' => ['ND I', 'ND II'],
            'credit_system' => 'Credit Units',
            'grading_scale_id' => $polytechnicCgpa->id,
            'qualification_names' => ['ND'],
        ]);

        foreach (Institution::all() as $inst) {
            $inst->educationSystems()->attach($nerdc->id);
        }

        foreach (Institution::all() as $inst) {
            CalendarTerm::create([
                'institution_id' => $inst->id,
                'academic_year' => '2025/2026',
                'name' => 'First Semester',
                'start_date' => '2025-09-15',
                'end_date' => '2026-01-31',
                'sort_order' => 1,
            ]);
            CalendarTerm::create([
                'institution_id' => $inst->id,
                'academic_year' => '2025/2026',
                'name' => 'Second Semester',
                'start_date' => '2026-02-10',
                'end_date' => '2026-07-15',
                'sort_order' => 2,
            ]);
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

        PlatformSetting::create([
            'key' => 'default_education_system_id',
            'value' => $nerdc->id,
        ]);

        $universityTypeRecord = InstitutionTypeModel::where('slug', 'university')->first();
        $polytechnicTypeRecord = InstitutionTypeModel::where('slug', 'polytechnic')->first();
        $coeTypeRecord = InstitutionTypeModel::where('slug', 'college-of-education')->first();

        Institution::where('institution_type', 'university')->update(['institution_type_id' => $universityTypeRecord?->id]);
        Institution::where('institution_type', 'polytechnic')->update(['institution_type_id' => $polytechnicTypeRecord?->id]);
        Institution::where('institution_type', 'college_of_education')->update(['institution_type_id' => $coeTypeRecord?->id]);

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
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 101', 'course_title' => 'Introduction to Computer Science', 'level' => '100L', 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 102', 'course_title' => 'Introduction to Programming', 'level' => '100L', 'semester' => Semester::Second, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 201', 'course_title' => 'Data Structures and Algorithms', 'level' => '200L', 'semester' => Semester::First, 'credit_units' => 4, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 301', 'course_title' => 'Operating Systems', 'level' => '300L', 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 302', 'course_title' => 'Database Management Systems', 'level' => '300L', 'semester' => Semester::Second, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $csDeptMouau->id, 'discipline_id' => $csDisc->id, 'course_code' => 'CSC 401', 'course_title' => 'Software Engineering', 'level' => '400L', 'semester' => Semester::First, 'credit_units' => 4, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $engDeptMouau->id, 'discipline_id' => $engDisc->id, 'course_code' => 'ENG 101', 'course_title' => 'Communication Skills I', 'level' => '100L', 'semester' => Semester::First, 'credit_units' => 2, 'course_scope' => CourseScope::Faculty, 'is_elective' => false],
            ['institution_id' => $mouau->id, 'owning_department_id' => $engDeptMouau->id, 'discipline_id' => $engDisc->id, 'course_code' => 'ENG 102', 'course_title' => 'Communication Skills II', 'level' => '100L', 'semester' => Semester::Second, 'credit_units' => 2, 'course_scope' => CourseScope::InstitutionWide],
            ['institution_id' => $mouau->id, 'owning_department_id' => $meeDeptMouau->id, 'discipline_id' => $meeDisc->id, 'course_code' => 'MEE 201', 'course_title' => 'Engineering Mechanics', 'level' => '200L', 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Faculty],
            ['institution_id' => $mouau->id, 'owning_department_id' => $meeDeptMouau->id, 'discipline_id' => $meeDisc->id, 'course_code' => 'MEE 301', 'course_title' => 'Thermodynamics I', 'level' => '300L', 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $mcmDeptMouau->id, 'discipline_id' => $mcmDisc->id, 'course_code' => 'MCM 101', 'course_title' => 'Introduction to Mass Communication', 'level' => '100L', 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $mouau->id, 'owning_department_id' => $mcmDeptMouau->id, 'discipline_id' => $mcmDisc->id, 'course_code' => 'MCM 201', 'course_title' => 'Media Ethics and Law', 'level' => '200L', 'semester' => Semester::Second, 'credit_units' => 2, 'course_scope' => CourseScope::Department, 'is_elective' => true],
            ['institution_id' => $unn->id, 'owning_department_id' => $csDeptUnn->id, 'discipline_id' => $csDisc->id, 'course_code' => 'COS 101', 'course_title' => 'Introduction to Computing', 'level' => '100L', 'semester' => Semester::First, 'credit_units' => 3, 'course_scope' => CourseScope::Department],
            ['institution_id' => $unn->id, 'owning_department_id' => $csDeptUnn->id, 'discipline_id' => $csDisc->id, 'course_code' => 'COS 201', 'course_title' => 'Computer Programming I', 'level' => '200L', 'semester' => Semester::First, 'credit_units' => 4, 'course_scope' => CourseScope::Department],
            ['institution_id' => $unn->id, 'owning_department_id' => $meeDeptUnn->id, 'discipline_id' => $meeDisc->id, 'course_code' => 'MEE 211', 'course_title' => 'Strength of Materials', 'level' => '200L', 'semester' => Semester::Both, 'credit_units' => 3, 'course_scope' => CourseScope::Faculty],
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
            'level' => '300L',
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
        $this->seedQuestionPapers($admin, $mouau);
        $this->seedContentSubmissions($admin, $studentUser, $mouau);
        $this->seedContentBlocks();
        $this->seedCourseBlockMappings($mouau, $unn);
        $this->seedSchemeOfWork($nerdc);
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
            $responseConfig = ! empty($qData['options'])
                ? ['options' => array_map(fn ($opt) => [
                    'label' => $opt['label'],
                    'text' => $opt['content'],
                    'is_correct' => $opt['is_correct'],
                ], $qData['options'])]
                : null;

            $question = Question::create([
                'institution_course_id' => $qData['course']->id,
                'question_type' => $qData['type'],
                'content' => $qData['content'],
                'year' => $qData['year'],
                'semester' => $qData['semester'],
                'marks' => $qData['marks'],
                'difficulty_level' => $qData['difficulty'],
                'response_config' => $responseConfig,
                'source' => QuestionSource::Manual,
                'status' => $qData['status'],
                'created_by' => $admin->id,
                'reviewed_by' => $qData['status'] === QuestionStatus::Published ? $admin->id : null,
                'published_at' => $qData['status'] === QuestionStatus::Published ? now() : null,
            ]);

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

    private function seedQuestionPapers(User $admin, Institution $mouau): void
    {
        $csc201 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 201')->first();
        $wassce = AssessmentType::where('slug', 'wassce')->first();
        $algoTopic = CanonicalTopic::where('slug', 'introduction-to-algorithms')->first();
        $dsTopic = CanonicalTopic::where('slug', 'data-structures-and-trees')->first();

        $paper1 = QuestionPaper::create([
            'institution_course_id' => $csc201->id,
            'title' => 'CSC 201 First Semester Examination 2023/2024',
            'academic_session' => '2023/2024',
            'semester' => 'First Semester',
            'year' => 2024,
            'total_marks' => 60,
            'duration_minutes' => 120,
            'instructions' => 'Answer ALL questions in Section A. Answer any TWO questions from Section B.',
            'is_published' => true,
        ]);

        $sectionA = QuestionSection::create([
            'question_paper_id' => $paper1->id,
            'label' => 'Section A',
            'instruction' => 'Answer ALL questions. Each question carries 2 marks.',
            'marks' => 30,
            'sort_order' => 0,
        ]);

        $sectionB = QuestionSection::create([
            'question_paper_id' => $paper1->id,
            'label' => 'Section B',
            'instruction' => 'Answer any TWO questions. Each question carries 15 marks.',
            'marks' => 30,
            'required_count' => 2,
            'sort_order' => 1,
        ]);

        $passage = QuestionContext::create([
            'question_paper_id' => $paper1->id,
            'context_type' => ContextType::Passage,
            'title' => 'Algorithm Analysis',
            'content' => "Consider the following pseudocode:\n\nfunction search(arr, target):\n  for i = 0 to length(arr) - 1:\n    if arr[i] == target:\n      return i\n  return -1",
        ]);

        $sectionAQuestions = [
            [
                'type' => QuestionType::Mcq, 'number' => '1', 'sort' => 0,
                'content' => 'What is the time complexity of the search function shown above?',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Easy,
                'config' => ['options' => [
                    ['label' => 'A', 'text' => 'O(1)', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'O(log n)', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'O(n)', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'O(n²)', 'is_correct' => false],
                ]],
                'topic' => $algoTopic, 'context' => $passage,
            ],
            [
                'type' => QuestionType::TrueFalse, 'number' => '2', 'sort' => 1,
                'content' => 'A binary search tree always guarantees O(log n) search time.',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Medium,
                'config' => ['correct_answer' => false, 'requires_justification' => true],
                'topic' => $dsTopic,
            ],
            [
                'type' => QuestionType::Mcq, 'number' => '3', 'sort' => 2,
                'content' => 'Which traversal visits the root node first?',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Easy,
                'config' => ['options' => [
                    ['label' => 'A', 'text' => 'Inorder', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Preorder', 'is_correct' => true],
                    ['label' => 'C', 'text' => 'Postorder', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Level-order', 'is_correct' => false],
                ]],
                'topic' => $dsTopic,
            ],
            [
                'type' => QuestionType::FillBlank, 'number' => '4', 'sort' => 3,
                'content' => 'A stack follows the _____ principle while a queue follows the _____ principle.',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Easy,
                'config' => ['blanks' => [
                    ['position' => 1, 'correct_answers' => ['LIFO', 'Last In First Out']],
                    ['position' => 2, 'correct_answers' => ['FIFO', 'First In First Out']],
                ], 'case_sensitive' => false],
                'topic' => $dsTopic,
            ],
            [
                'type' => QuestionType::Matching, 'number' => '5', 'sort' => 4,
                'content' => 'Match each data structure with its primary use case.',
                'marks' => 4, 'difficulty' => QuestionDifficulty::Medium,
                'config' => ['pairs' => [
                    ['left' => 'Stack', 'right' => 'Function call management'],
                    ['left' => 'Queue', 'right' => 'Print job scheduling'],
                    ['left' => 'Hash Table', 'right' => 'Fast key-value lookup'],
                    ['left' => 'Heap', 'right' => 'Priority queue implementation'],
                ], 'distractors' => ['Sorting large datasets']],
                'topic' => $dsTopic,
            ],
        ];

        foreach ($sectionAQuestions as $qData) {
            $q = Question::create([
                'question_paper_id' => $paper1->id,
                'question_section_id' => $sectionA->id,
                'question_type' => $qData['type'],
                'question_number' => $qData['number'],
                'display_label' => 'Question '.$qData['number'],
                'content' => $qData['content'],
                'marks' => $qData['marks'],
                'difficulty_level' => $qData['difficulty'],
                'response_config' => $qData['config'],
                'sort_order' => $qData['sort'],
                'source' => QuestionSource::Manual,
                'status' => QuestionStatus::Published,
                'created_by' => $admin->id,
                'reviewed_by' => $admin->id,
                'published_at' => now(),
            ]);

            if (isset($qData['topic'])) {
                QuestionTopicLink::create([
                    'question_id' => $q->id,
                    'canonical_topic_id' => $qData['topic']->id,
                    'is_primary' => true,
                ]);
            }

            if (isset($qData['context'])) {
                QuestionContextLink::create([
                    'question_id' => $q->id,
                    'question_context_id' => $qData['context']->id,
                    'sort_order' => 0,
                ]);
            }
        }

        $groupQ = Question::create([
            'question_paper_id' => $paper1->id,
            'question_section_id' => $sectionB->id,
            'question_type' => QuestionType::Group,
            'question_number' => '6',
            'display_label' => 'Question 6',
            'content' => 'Consider the following array: [38, 27, 43, 3, 9, 82, 10]',
            'marks' => null,
            'sort_order' => 0,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'published_at' => now(),
        ]);

        Question::create([
            'question_paper_id' => $paper1->id,
            'question_section_id' => $sectionB->id,
            'parent_question_id' => $groupQ->id,
            'question_type' => QuestionType::Theory,
            'question_number' => '6a',
            'display_label' => '(a)',
            'content' => 'Show the steps of merge sort applied to the array above.',
            'marks' => 8,
            'difficulty_level' => QuestionDifficulty::Hard,
            'sort_order' => 0,
            'depth_level' => 1,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'published_at' => now(),
        ]);

        Question::create([
            'question_paper_id' => $paper1->id,
            'question_section_id' => $sectionB->id,
            'parent_question_id' => $groupQ->id,
            'question_type' => QuestionType::Calculation,
            'question_number' => '6b',
            'display_label' => '(b)',
            'content' => 'What is the total number of comparisons made during the merge sort process?',
            'marks' => 7,
            'difficulty_level' => QuestionDifficulty::Hard,
            'response_config' => ['answer' => '12', 'tolerance' => 2, 'requires_working' => true],
            'sort_order' => 1,
            'depth_level' => 1,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'published_at' => now(),
        ]);

        $paper2 = QuestionPaper::create([
            'assessment_type_id' => $wassce->id,
            'title' => 'WASSCE Mathematics Paper 1 — 2023',
            'year' => 2023,
            'total_marks' => 50,
            'duration_minutes' => 90,
            'instructions' => 'Answer ALL questions. Each question carries 2 marks.',
            'is_published' => true,
        ]);

        $objSection = QuestionSection::create([
            'question_paper_id' => $paper2->id,
            'label' => 'Objectives',
            'instruction' => 'Select the correct option for each question.',
            'marks' => 50,
            'sort_order' => 0,
        ]);

        $paper2Questions = [
            [
                'type' => QuestionType::Mcq, 'number' => '1', 'sort' => 0,
                'content' => 'Simplify: 2³ × 2⁴',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Easy,
                'config' => ['options' => [
                    ['label' => 'A', 'text' => '2⁷', 'is_correct' => true],
                    ['label' => 'B', 'text' => '2¹²', 'is_correct' => false],
                    ['label' => 'C', 'text' => '4⁷', 'is_correct' => false],
                    ['label' => 'D', 'text' => '4¹²', 'is_correct' => false],
                ]],
            ],
            [
                'type' => QuestionType::NumericEntry, 'number' => '2', 'sort' => 1,
                'content' => 'If x + 5 = 12, find the value of x.',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Easy,
                'config' => ['answer' => 7, 'tolerance' => 0],
            ],
            [
                'type' => QuestionType::Mcq, 'number' => '3', 'sort' => 2,
                'content' => 'The sum of angles in a triangle is:',
                'marks' => 2, 'difficulty' => QuestionDifficulty::Easy,
                'config' => ['options' => [
                    ['label' => 'A', 'text' => '90°', 'is_correct' => false],
                    ['label' => 'B', 'text' => '180°', 'is_correct' => true],
                    ['label' => 'C', 'text' => '270°', 'is_correct' => false],
                    ['label' => 'D', 'text' => '360°', 'is_correct' => false],
                ]],
            ],
        ];

        foreach ($paper2Questions as $qData) {
            Question::create([
                'question_paper_id' => $paper2->id,
                'question_section_id' => $objSection->id,
                'question_type' => $qData['type'],
                'question_number' => $qData['number'],
                'display_label' => 'Question '.$qData['number'],
                'content' => $qData['content'],
                'marks' => $qData['marks'],
                'difficulty_level' => $qData['difficulty'],
                'response_config' => $qData['config'],
                'sort_order' => $qData['sort'],
                'source' => QuestionSource::Manual,
                'status' => QuestionStatus::Published,
                'created_by' => $admin->id,
                'reviewed_by' => $admin->id,
                'published_at' => now(),
            ]);
        }

        $tiptap = fn (string $text): array => [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
            ],
        ];

        $csc302 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 302')->first();
        $dbTopic = CanonicalTopic::where('slug', 'database-normalization')->first();

        $paper3 = QuestionPaper::create([
            'institution_course_id' => $csc302->id,
            'title' => 'CSC 302 Second Semester Examination 2022/2023',
            'academic_session' => '2022/2023',
            'semester' => 'Second Semester',
            'year' => 2023,
            'total_marks' => 60,
            'duration_minutes' => 120,
            'instructions' => 'Answer ALL questions in Section A. Answer any TWO questions from Section B.',
            'is_published' => true,
        ]);

        $csc302SectionA = QuestionSection::create([
            'question_paper_id' => $paper3->id,
            'label' => 'Section A',
            'instruction' => 'Answer ALL questions. Each question carries 2 marks.',
            'marks' => 20,
            'sort_order' => 0,
        ]);

        $csc302SectionB = QuestionSection::create([
            'question_paper_id' => $paper3->id,
            'label' => 'Section B',
            'instruction' => 'Answer any TWO questions. Each question carries 20 marks.',
            'marks' => 40,
            'required_count' => 2,
            'sort_order' => 1,
        ]);

        $q302_1 = Question::create([
            'institution_course_id' => $csc302->id,
            'question_paper_id' => $paper3->id,
            'question_section_id' => $csc302SectionA->id,
            'question_type' => QuestionType::Mcq,
            'question_number' => '1',
            'display_label' => 'Question 1',
            'content' => 'Which normal form eliminates transitive dependencies?',
            'marks' => 2,
            'difficulty_level' => QuestionDifficulty::Medium,
            'response_config' => ['options' => [
                ['label' => 'A', 'text' => 'First Normal Form (1NF)', 'is_correct' => false],
                ['label' => 'B', 'text' => 'Second Normal Form (2NF)', 'is_correct' => false],
                ['label' => 'C', 'text' => 'Third Normal Form (3NF)', 'is_correct' => true],
                ['label' => 'D', 'text' => 'Boyce-Codd Normal Form (BCNF)', 'is_correct' => false],
            ]],
            'sort_order' => 0,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'published_at' => now(),
        ]);

        QuestionTopicLink::create([
            'question_id' => $q302_1->id,
            'canonical_topic_id' => $dbTopic->id,
            'is_primary' => true,
        ]);

        QuestionAnswer::create([
            'question_id' => $q302_1->id,
            'depth_level' => AnswerDepthLevel::Quick,
            'content' => $tiptap('3NF. Third Normal Form requires that no non-prime attribute is transitively dependent on the primary key.'),
            'content_plain' => '3NF. Third Normal Form requires that no non-prime attribute is transitively dependent on the primary key.',
            'is_published' => true,
            'created_by' => $admin->id,
        ]);

        QuestionAnswer::create([
            'question_id' => $q302_1->id,
            'depth_level' => AnswerDepthLevel::Standard,
            'content' => $tiptap('Third Normal Form (3NF) eliminates transitive dependencies. A relation is in 3NF if it is in 2NF and every non-prime attribute is non-transitively dependent on every candidate key. A transitive dependency occurs when A → B → C, where C depends on A indirectly through B. For example, if Student_ID → Department → HOD_Name, the HOD_Name transitively depends on Student_ID. To achieve 3NF, decompose into separate tables.'),
            'content_plain' => 'Third Normal Form (3NF) eliminates transitive dependencies. A relation is in 3NF if it is in 2NF and every non-prime attribute is non-transitively dependent on every candidate key. A transitive dependency occurs when A → B → C, where C depends on A indirectly through B. For example, if Student_ID → Department → HOD_Name, the HOD_Name transitively depends on Student_ID. To achieve 3NF, decompose into separate tables.',
            'is_published' => true,
            'created_by' => $admin->id,
        ]);

        $q302_2 = Question::create([
            'institution_course_id' => $csc302->id,
            'question_paper_id' => $paper3->id,
            'question_section_id' => $csc302SectionA->id,
            'question_type' => QuestionType::Mcq,
            'question_number' => '2',
            'display_label' => 'Question 2',
            'content' => 'Which of the following is NOT a type of database key?',
            'marks' => 2,
            'difficulty_level' => QuestionDifficulty::Easy,
            'response_config' => ['options' => [
                ['label' => 'A', 'text' => 'Primary Key', 'is_correct' => false],
                ['label' => 'B', 'text' => 'Foreign Key', 'is_correct' => false],
                ['label' => 'C', 'text' => 'Candidate Key', 'is_correct' => false],
                ['label' => 'D', 'text' => 'Loop Key', 'is_correct' => true],
            ]],
            'sort_order' => 1,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'published_at' => now(),
        ]);

        QuestionTopicLink::create([
            'question_id' => $q302_2->id,
            'canonical_topic_id' => $dbTopic->id,
            'is_primary' => true,
        ]);

        QuestionAnswer::create([
            'question_id' => $q302_2->id,
            'depth_level' => AnswerDepthLevel::Quick,
            'content' => $tiptap('Loop Key. There is no such thing as a "Loop Key" in relational database theory. The standard key types are Primary, Foreign, Candidate, Super, and Alternate keys.'),
            'content_plain' => 'Loop Key. There is no such thing as a "Loop Key" in relational database theory. The standard key types are Primary, Foreign, Candidate, Super, and Alternate keys.',
            'is_published' => true,
            'created_by' => $admin->id,
        ]);

        $q302_3 = Question::create([
            'institution_course_id' => $csc302->id,
            'question_paper_id' => $paper3->id,
            'question_section_id' => $csc302SectionA->id,
            'question_type' => QuestionType::TrueFalse,
            'question_number' => '3',
            'display_label' => 'Question 3',
            'content' => 'A foreign key in one table must reference the primary key of another table.',
            'marks' => 2,
            'difficulty_level' => QuestionDifficulty::Easy,
            'response_config' => ['correct_answer' => true, 'requires_justification' => false],
            'sort_order' => 2,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'published_at' => now(),
        ]);

        QuestionTopicLink::create([
            'question_id' => $q302_3->id,
            'canonical_topic_id' => $dbTopic->id,
            'is_primary' => true,
        ]);

        $q302_4 = Question::create([
            'institution_course_id' => $csc302->id,
            'question_paper_id' => $paper3->id,
            'question_section_id' => $csc302SectionB->id,
            'question_type' => QuestionType::Theory,
            'question_number' => '4',
            'display_label' => 'Question 4',
            'content' => 'Define the following terms as used in relational database design: (a) Primary Key (b) Foreign Key (c) Normalization',
            'marks' => 15,
            'difficulty_level' => QuestionDifficulty::Easy,
            'sort_order' => 0,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'published_at' => now(),
        ]);

        QuestionTopicLink::create([
            'question_id' => $q302_4->id,
            'canonical_topic_id' => $dbTopic->id,
            'is_primary' => true,
        ]);

        QuestionAnswer::create([
            'question_id' => $q302_4->id,
            'depth_level' => AnswerDepthLevel::Quick,
            'content' => $tiptap('(a) Primary Key: a column or set of columns that uniquely identifies each row. (b) Foreign Key: a column that references the primary key of another table. (c) Normalization: the process of organizing data to reduce redundancy and improve integrity.'),
            'content_plain' => '(a) Primary Key: a column or set of columns that uniquely identifies each row. (b) Foreign Key: a column that references the primary key of another table. (c) Normalization: the process of organizing data to reduce redundancy and improve integrity.',
            'is_published' => true,
            'created_by' => $admin->id,
        ]);

        $q302_5 = Question::create([
            'institution_course_id' => $csc302->id,
            'question_paper_id' => $paper3->id,
            'question_section_id' => $csc302SectionB->id,
            'question_type' => QuestionType::Theory,
            'question_number' => '5',
            'display_label' => 'Question 5',
            'content' => 'Explain the process of normalization up to Third Normal Form (3NF). Use a practical example to illustrate each step.',
            'marks' => 20,
            'difficulty_level' => QuestionDifficulty::Hard,
            'sort_order' => 1,
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'created_by' => $admin->id,
            'reviewed_by' => $admin->id,
            'published_at' => now(),
        ]);

        QuestionTopicLink::create([
            'question_id' => $q302_5->id,
            'canonical_topic_id' => $dbTopic->id,
            'is_primary' => true,
        ]);

        QuestionAnswer::create([
            'question_id' => $q302_5->id,
            'depth_level' => AnswerDepthLevel::Standard,
            'content' => $tiptap("Normalization is the systematic process of decomposing tables to eliminate data redundancy and undesirable anomalies.\n\n1NF (First Normal Form): Eliminate repeating groups. Each column must contain atomic (indivisible) values. Example: A student table with multiple phone numbers in one cell violates 1NF. Fix: create a separate phone numbers table.\n\n2NF (Second Normal Form): Must be in 1NF and eliminate partial dependencies. Every non-key attribute must depend on the entire primary key. Example: In a table (StudentID, CourseID, StudentName, Grade), StudentName depends only on StudentID, not the full key. Fix: separate into Students and Enrollments tables.\n\n3NF (Third Normal Form): Must be in 2NF and eliminate transitive dependencies. No non-key attribute should depend on another non-key attribute. Example: In (StudentID, Department, HOD), HOD depends on Department, not directly on StudentID. Fix: create a separate Departments table."),
            'content_plain' => 'Normalization is the systematic process of decomposing tables to eliminate data redundancy and undesirable anomalies. 1NF: Eliminate repeating groups, ensure atomic values. 2NF: Eliminate partial dependencies on composite keys. 3NF: Eliminate transitive dependencies between non-key attributes.',
            'is_published' => true,
            'created_by' => $admin->id,
        ]);
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

    private function seedContentBlocks(): void
    {
        $tiptap = fn (string $text): array => [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
            ],
        ];

        $algoTopic = CanonicalTopic::where('slug', 'introduction-to-algorithms')->first();
        $dsTopic = CanonicalTopic::where('slug', 'data-structures-and-trees')->first();
        $oopTopic = CanonicalTopic::where('slug', 'object-oriented-programming')->first();
        $dbTopic = CanonicalTopic::where('slug', 'database-normalization')->first();

        $createBlock = function (array $data) use ($tiptap): ContentBlock {
            $isContainer = ($data['block_type'] ?? BlockType::Text) === BlockType::Container;

            return ContentBlock::create([
                'canonical_topic_id' => $data['topic_id'],
                'parent_block_id' => $data['parent_id'] ?? null,
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'block_type' => $data['block_type'] ?? BlockType::Text,
                'path' => $data['path'],
                'depth_level' => $data['depth'],
                'sort_order' => $data['sort'],
                'content' => $isContainer ? null : ($data['content'] ?? $tiptap($data['text'] ?? "Content for {$data['title']}.")),
                'estimated_read_time' => $isContainer ? null : ($data['read_time'] ?? 5),
                'difficulty_level' => $isContainer ? null : ($data['difficulty'] ?? BlockDifficultyLevel::Beginner),
                'bloom_level' => $isContainer ? null : ($data['bloom'] ?? BloomLevel::Understand),
                'is_container' => $isContainer,
                'is_published' => $data['published'] ?? true,
            ]);
        };

        $ch1 = $createBlock(['topic_id' => $algoTopic->id, 'title' => 'Introduction', 'block_type' => BlockType::Container, 'path' => '1', 'depth' => 0, 'sort' => 1]);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch1->id, 'title' => 'What Are Algorithms?', 'path' => '1.1', 'depth' => 1, 'sort' => 1, 'read_time' => 4, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Remember, 'text' => 'An algorithm is a step-by-step procedure for solving a problem or accomplishing a task. Algorithms are the foundation of all computer programs. They take input, process it through a series of well-defined steps, and produce output.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch1->id, 'title' => 'Why Study Algorithms?', 'path' => '1.2', 'depth' => 1, 'sort' => 2, 'read_time' => 3, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Understand, 'text' => 'Understanding algorithms helps you write efficient programs, solve complex problems systematically, and think computationally. Algorithm analysis lets you predict performance before implementation.']);

        $ch2 = $createBlock(['topic_id' => $algoTopic->id, 'title' => 'Searching Algorithms', 'block_type' => BlockType::Container, 'path' => '2', 'depth' => 0, 'sort' => 2]);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch2->id, 'title' => 'Linear Search', 'path' => '2.1', 'depth' => 1, 'sort' => 1, 'read_time' => 5, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Apply, 'text' => 'Linear search examines each element sequentially from the beginning of a list until the target is found or the list is exhausted. Time complexity: O(n). Best for small or unsorted datasets.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch2->id, 'title' => 'Binary Search', 'path' => '2.2', 'depth' => 1, 'sort' => 2, 'read_time' => 8, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'Binary search works by repeatedly dividing a sorted array in half. Compare the target with the middle element — if they are unequal, the half in which the target cannot lie is eliminated. Time complexity: O(log n).']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch2->id, 'title' => 'Linear vs Binary Search', 'block_type' => BlockType::Comparison, 'path' => '2.3', 'depth' => 1, 'sort' => 3, 'read_time' => 4, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Analyze, 'text' => 'Linear search is simpler and works on unsorted data (O(n)), while binary search is faster but requires sorted data (O(log n)). For 1 million elements, linear search may need 1M comparisons; binary search needs at most 20.']);

        $ch3 = $createBlock(['topic_id' => $algoTopic->id, 'title' => 'Sorting Algorithms', 'block_type' => BlockType::Container, 'path' => '3', 'depth' => 0, 'sort' => 3]);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch3->id, 'title' => 'Bubble Sort', 'path' => '3.1', 'depth' => 1, 'sort' => 1, 'read_time' => 5, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Apply, 'text' => 'Bubble sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. Simple but inefficient — O(n²) in worst and average cases.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch3->id, 'title' => 'Merge Sort', 'block_type' => BlockType::Code, 'path' => '3.2', 'depth' => 1, 'sort' => 2, 'read_time' => 10, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'Merge sort uses divide-and-conquer: split the array in half, recursively sort each half, then merge the sorted halves. Guaranteed O(n log n) time complexity. Requires O(n) extra space.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch3->id, 'title' => 'Quick Sort', 'block_type' => BlockType::Code, 'path' => '3.3', 'depth' => 1, 'sort' => 3, 'read_time' => 12, 'difficulty' => BlockDifficultyLevel::Advanced, 'bloom' => BloomLevel::Analyze, 'text' => 'Quick sort picks a pivot, partitions elements into those less than and greater than the pivot, then recursively sorts each partition. Average O(n log n), worst O(n²). In-place but not stable.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch3->id, 'title' => 'Sorting Practice', 'block_type' => BlockType::Exercise, 'path' => '3.4', 'depth' => 1, 'sort' => 4, 'read_time' => 15, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'Trace through bubble sort and merge sort on the array [38, 27, 43, 3, 9, 82, 10]. Show each step. Then compare: which algorithm performed fewer comparisons?']);

        $ch4 = $createBlock(['topic_id' => $algoTopic->id, 'title' => 'Complexity Analysis', 'block_type' => BlockType::Container, 'path' => '4', 'depth' => 0, 'sort' => 4]);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch4->id, 'title' => 'Big-O Notation', 'path' => '4.1', 'depth' => 1, 'sort' => 1, 'read_time' => 8, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Understand, 'text' => 'Big-O notation describes the upper bound of an algorithm\'s growth rate. Common complexities: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, O(n²) quadratic, O(2ⁿ) exponential.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch4->id, 'title' => 'Time vs Space Tradeoffs', 'block_type' => BlockType::Comparison, 'path' => '4.2', 'depth' => 1, 'sort' => 2, 'read_time' => 6, 'difficulty' => BlockDifficultyLevel::Advanced, 'bloom' => BloomLevel::Evaluate, 'text' => 'Often you can trade memory for speed. Hash tables use O(n) space for O(1) lookups. Merge sort uses O(n) extra space for guaranteed O(n log n) time. In-place algorithms save space but may be slower.']);
        $createBlock(['topic_id' => $algoTopic->id, 'parent_id' => $ch4->id, 'title' => 'Complexity Quiz', 'block_type' => BlockType::Quiz, 'path' => '4.3', 'depth' => 1, 'sort' => 3, 'read_time' => 10, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Evaluate, 'text' => 'Test your understanding: What is the time complexity of finding an element in a sorted array? What about inserting into a hash table? What is the space complexity of recursive fibonacci?']);

        $ds1 = $createBlock(['topic_id' => $dsTopic->id, 'title' => 'Introduction to Data Structures', 'block_type' => BlockType::Container, 'path' => '1', 'depth' => 0, 'sort' => 1]);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds1->id, 'title' => 'What is a Data Structure?', 'path' => '1.1', 'depth' => 1, 'sort' => 1, 'read_time' => 4, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Remember, 'text' => 'A data structure is a way of organizing, managing, and storing data so that it can be accessed and modified efficiently. The choice of data structure affects the performance of algorithms.']);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds1->id, 'title' => 'Abstract Data Types', 'path' => '1.2', 'depth' => 1, 'sort' => 2, 'read_time' => 5, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Understand, 'text' => 'An ADT defines a data type by its behavior (operations) rather than its implementation. Examples: Stack (push, pop, peek), Queue (enqueue, dequeue), List (insert, delete, access).']);

        $ds2 = $createBlock(['topic_id' => $dsTopic->id, 'title' => 'Linear Structures', 'block_type' => BlockType::Container, 'path' => '2', 'depth' => 0, 'sort' => 2]);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds2->id, 'title' => 'Arrays', 'path' => '2.1', 'depth' => 1, 'sort' => 1, 'read_time' => 6, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Apply, 'text' => 'Arrays store elements in contiguous memory locations, allowing O(1) random access by index. Fixed size in most languages. Insertion and deletion at arbitrary positions cost O(n).']);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds2->id, 'title' => 'Linked Lists', 'path' => '2.2', 'depth' => 1, 'sort' => 2, 'read_time' => 8, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'A linked list is a sequence of nodes where each node contains data and a pointer to the next node. Supports efficient insertion/deletion at O(1) if you have the reference, but random access requires O(n) traversal.']);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds2->id, 'title' => 'Stacks and Queues', 'path' => '2.3', 'depth' => 1, 'sort' => 3, 'read_time' => 7, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Understand, 'text' => 'Stacks follow LIFO (Last In, First Out) — think of a stack of plates. Queues follow FIFO (First In, First Out) — think of a line at a bank. Both support O(1) insertion and removal from their respective ends.']);

        $ds3 = $createBlock(['topic_id' => $dsTopic->id, 'title' => 'Trees', 'block_type' => BlockType::Container, 'path' => '3', 'depth' => 0, 'sort' => 3]);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds3->id, 'title' => 'Binary Trees', 'path' => '3.1', 'depth' => 1, 'sort' => 1, 'read_time' => 7, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Understand, 'text' => 'A binary tree is a hierarchical data structure where each node has at most two children (left and right). Used in expression parsing, Huffman coding, and as the basis for more advanced tree structures.']);
        $bst = $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds3->id, 'title' => 'Binary Search Trees', 'path' => '3.2', 'depth' => 1, 'sort' => 2, 'read_time' => 10, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'A BST maintains the invariant: left child < parent < right child. This enables O(log n) search, insert, and delete on average. Degenerates to O(n) if the tree becomes unbalanced (e.g., sorted insertion).']);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds3->id, 'title' => 'AVL Trees', 'path' => '3.3', 'depth' => 1, 'sort' => 3, 'read_time' => 12, 'difficulty' => BlockDifficultyLevel::Advanced, 'bloom' => BloomLevel::Analyze, 'text' => 'AVL trees are self-balancing BSTs where the height difference between left and right subtrees is at most 1. Rotations (single and double) restore balance after insertions/deletions. Guarantees O(log n) for all operations.']);
        $createBlock(['topic_id' => $dsTopic->id, 'parent_id' => $ds3->id, 'title' => 'Tree Traversal Algorithms', 'block_type' => BlockType::Code, 'path' => '3.4', 'depth' => 1, 'sort' => 4, 'read_time' => 8, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'Three main traversal orders: In-order (Left, Root, Right) — gives sorted output for BSTs. Pre-order (Root, Left, Right) — useful for copying trees. Post-order (Left, Right, Root) — useful for deletion.']);

        $oop1 = $createBlock(['topic_id' => $oopTopic->id, 'title' => 'OOP Fundamentals', 'block_type' => BlockType::Container, 'path' => '1', 'depth' => 0, 'sort' => 1]);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop1->id, 'title' => 'Classes and Objects', 'path' => '1.1', 'depth' => 1, 'sort' => 1, 'read_time' => 6, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Remember, 'text' => 'A class is a blueprint that defines properties (attributes) and behaviors (methods). An object is an instance of a class — a concrete entity created from the blueprint with specific attribute values.']);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop1->id, 'title' => 'Encapsulation', 'path' => '1.2', 'depth' => 1, 'sort' => 2, 'read_time' => 5, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Understand, 'text' => 'Encapsulation bundles data and methods that operate on it into a single unit (class), restricting direct access to internal state. Access modifiers (public, private, protected) control visibility.']);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop1->id, 'title' => 'Encapsulation Example', 'block_type' => BlockType::Example, 'path' => '1.3', 'depth' => 1, 'sort' => 3, 'read_time' => 4, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Apply, 'text' => 'A BankAccount class with a private balance field and public deposit()/withdraw() methods. External code cannot directly modify the balance — it must go through the methods which enforce validation rules.']);

        $oop2 = $createBlock(['topic_id' => $oopTopic->id, 'title' => 'Inheritance and Polymorphism', 'block_type' => BlockType::Container, 'path' => '2', 'depth' => 0, 'sort' => 2]);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop2->id, 'title' => 'Single Inheritance', 'path' => '2.1', 'depth' => 1, 'sort' => 1, 'read_time' => 6, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Understand, 'text' => 'Inheritance allows a child class to inherit properties and methods from a parent class. This promotes code reuse — define common behavior once in the parent, specialize in the child.']);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop2->id, 'title' => 'Polymorphism', 'path' => '2.2', 'depth' => 1, 'sort' => 2, 'read_time' => 8, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'Polymorphism means "many forms." A parent class reference can point to child class objects. Method overriding lets each child provide its own implementation. This enables writing flexible, extensible code.']);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop2->id, 'title' => 'OOP vs Procedural', 'block_type' => BlockType::Comparison, 'path' => '2.3', 'depth' => 1, 'sort' => 3, 'read_time' => 5, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Analyze, 'text' => 'Procedural programming organizes code into functions that operate on data. OOP organizes code into objects that bundle data and behavior. OOP excels at modeling real-world entities and managing complexity in large systems.']);

        $oop3 = $createBlock(['topic_id' => $oopTopic->id, 'title' => 'Design Patterns', 'block_type' => BlockType::Container, 'path' => '3', 'depth' => 0, 'sort' => 3, 'published' => false]);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop3->id, 'title' => 'Factory Pattern', 'path' => '3.1', 'depth' => 1, 'sort' => 1, 'read_time' => 7, 'difficulty' => BlockDifficultyLevel::Advanced, 'bloom' => BloomLevel::Apply, 'text' => 'The Factory pattern delegates object creation to a factory method, decoupling the client from concrete classes. Useful when the exact class to instantiate depends on runtime conditions.', 'published' => false]);
        $createBlock(['topic_id' => $oopTopic->id, 'parent_id' => $oop3->id, 'title' => 'Observer Pattern', 'path' => '3.2', 'depth' => 1, 'sort' => 2, 'read_time' => 8, 'difficulty' => BlockDifficultyLevel::Advanced, 'bloom' => BloomLevel::Analyze, 'text' => 'The Observer pattern defines a one-to-many dependency — when the subject changes state, all registered observers are notified automatically. Used in event systems, pub/sub, and reactive programming.', 'published' => false]);

        $db1 = $createBlock(['topic_id' => $dbTopic->id, 'title' => 'Normalization Fundamentals', 'block_type' => BlockType::Container, 'path' => '1', 'depth' => 0, 'sort' => 1]);
        $createBlock(['topic_id' => $dbTopic->id, 'parent_id' => $db1->id, 'title' => 'Why Normalize?', 'path' => '1.1', 'depth' => 1, 'sort' => 1, 'read_time' => 4, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Remember, 'text' => 'Normalization reduces data redundancy and improves data integrity. Without it, update anomalies, insertion anomalies, and deletion anomalies can corrupt your data.']);
        $createBlock(['topic_id' => $dbTopic->id, 'parent_id' => $db1->id, 'title' => 'First Normal Form (1NF)', 'path' => '1.2', 'depth' => 1, 'sort' => 2, 'read_time' => 5, 'difficulty' => BlockDifficultyLevel::Beginner, 'bloom' => BloomLevel::Understand, 'text' => 'A table is in 1NF if all columns contain only atomic (indivisible) values and each row is uniquely identifiable. No repeating groups or arrays in cells.']);

        $db2 = $createBlock(['topic_id' => $dbTopic->id, 'title' => 'Higher Normal Forms', 'block_type' => BlockType::Container, 'path' => '2', 'depth' => 0, 'sort' => 2]);
        $createBlock(['topic_id' => $dbTopic->id, 'parent_id' => $db2->id, 'title' => 'Second Normal Form (2NF)', 'path' => '2.1', 'depth' => 1, 'sort' => 1, 'read_time' => 6, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Understand, 'text' => 'A table is in 2NF if it is in 1NF and all non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies). Relevant for composite primary keys.']);
        $createBlock(['topic_id' => $dbTopic->id, 'parent_id' => $db2->id, 'title' => 'Third Normal Form (3NF)', 'path' => '2.2', 'depth' => 1, 'sort' => 2, 'read_time' => 7, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Apply, 'text' => 'A table is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key. Example: Student → Department → HOD creates a transitive dependency that should be decomposed.']);
        $createBlock(['topic_id' => $dbTopic->id, 'parent_id' => $db2->id, 'title' => 'Normalization Reference', 'block_type' => BlockType::Reference, 'path' => '2.3', 'depth' => 1, 'sort' => 3, 'read_time' => 3, 'difficulty' => BlockDifficultyLevel::Intermediate, 'bloom' => BloomLevel::Remember, 'text' => 'Quick reference: 1NF = atomic values. 2NF = no partial dependencies. 3NF = no transitive dependencies. BCNF = every determinant is a candidate key. 4NF = no multi-valued dependencies.']);
    }

    private function seedCourseBlockMappings(Institution $mouau, Institution $unn): void
    {
        $csc201 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 201')->first();
        $csc302 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 302')->first();
        $csc101 = InstitutionCourse::where('institution_id', $mouau->id)->where('course_code', 'CSC 101')->first();
        $cos101 = InstitutionCourse::where('institution_id', $unn->id)->where('course_code', 'COS 101')->first();

        $algoTopic = CanonicalTopic::where('slug', 'introduction-to-algorithms')->first();
        $dsTopic = CanonicalTopic::where('slug', 'data-structures-and-trees')->first();
        $oopTopic = CanonicalTopic::where('slug', 'object-oriented-programming')->first();
        $dbTopic = CanonicalTopic::where('slug', 'database-normalization')->first();

        $algoBlocks = ContentBlock::where('canonical_topic_id', $algoTopic->id)
            ->where('is_container', false)
            ->get();

        $dsBlocks = ContentBlock::where('canonical_topic_id', $dsTopic->id)
            ->where('is_container', false)
            ->get();

        $oopBlocks = ContentBlock::where('canonical_topic_id', $oopTopic->id)
            ->where('is_container', false)
            ->where('is_published', true)
            ->get();

        $dbBlocks = ContentBlock::where('canonical_topic_id', $dbTopic->id)
            ->where('is_container', false)
            ->get();

        $depthMap = [
            BlockDifficultyLevel::Beginner->value => TeachingDepth::Introductory,
            BlockDifficultyLevel::Intermediate->value => TeachingDepth::Intermediate,
            BlockDifficultyLevel::Advanced->value => TeachingDepth::Advanced,
        ];

        foreach ($algoBlocks as $i => $block) {
            CourseBlockMapping::create([
                'institution_course_id' => $csc201->id,
                'content_block_id' => $block->id,
                'teaching_depth' => $depthMap[$block->difficulty_level->value] ?? TeachingDepth::Introductory,
                'is_core_block' => $block->difficulty_level !== BlockDifficultyLevel::Advanced,
                'week_start' => intdiv($i, 2) + 1,
                'week_end' => intdiv($i, 2) + 2,
            ]);
        }

        foreach ($dsBlocks as $i => $block) {
            CourseBlockMapping::create([
                'institution_course_id' => $csc201->id,
                'content_block_id' => $block->id,
                'teaching_depth' => $depthMap[$block->difficulty_level->value] ?? TeachingDepth::Introductory,
                'is_core_block' => true,
                'week_start' => intdiv($i, 2) + 7,
                'week_end' => intdiv($i, 2) + 8,
            ]);
        }

        foreach ($oopBlocks as $i => $block) {
            CourseBlockMapping::create([
                'institution_course_id' => $csc101->id,
                'content_block_id' => $block->id,
                'teaching_depth' => $depthMap[$block->difficulty_level->value] ?? TeachingDepth::Introductory,
                'is_core_block' => $block->difficulty_level === BlockDifficultyLevel::Beginner,
                'week_start' => $i + 1,
                'week_end' => $i + 2,
                'lecture_hours' => 2,
            ]);
        }

        foreach ($oopBlocks->take(4) as $i => $block) {
            CourseBlockMapping::create([
                'institution_course_id' => $cos101->id,
                'content_block_id' => $block->id,
                'teaching_depth' => TeachingDepth::SurfaceMention,
                'is_core_block' => false,
                'week_start' => $i + 8,
                'week_end' => $i + 9,
            ]);
        }

        foreach ($dbBlocks as $i => $block) {
            CourseBlockMapping::create([
                'institution_course_id' => $csc302->id,
                'content_block_id' => $block->id,
                'teaching_depth' => $depthMap[$block->difficulty_level->value] ?? TeachingDepth::Introductory,
                'is_core_block' => true,
                'week_start' => $i * 2 + 1,
                'week_end' => $i * 2 + 2,
                'lecture_hours' => 3,
                'lab_hours' => 1,
            ]);
        }
    }

    private function seedSchemeOfWork(EducationSystem $nerdc): void
    {
        $mathSubject = CurriculumSubject::where('education_system_id', $nerdc->id)->where('slug', 'mathematics')->first();
        $physicsSubject = CurriculumSubject::where('education_system_id', $nerdc->id)->where('slug', 'physics')->first();
        $csSubject = CurriculumSubject::where('education_system_id', $nerdc->id)->where('slug', 'computer-studies')->first();

        $ss1 = EducationLevel::where('name', 'SS 1')->first();
        $jss1 = EducationLevel::where('name', 'JSS 1')->first();

        $ss1Math = LevelSubject::where('education_level_id', $ss1->id)->where('curriculum_subject_id', $mathSubject->id)->first();
        $ss1Physics = LevelSubject::where('education_level_id', $ss1->id)->where('curriculum_subject_id', $physicsSubject->id)->first();
        $jss1CS = LevelSubject::where('education_level_id', $jss1->id)->where('curriculum_subject_id', $csSubject->id)->first();

        $algoTopic = CanonicalTopic::where('slug', 'introduction-to-algorithms')->first();
        $dsTopic = CanonicalTopic::where('slug', 'data-structures-and-trees')->first();

        $ss1MathScheme = [
            ['term' => 1, 'week_number' => 1, 'topic_label' => 'Number Bases: Binary and Denary'],
            ['term' => 1, 'week_number' => 2, 'topic_label' => 'Number Bases: Octal and Hexadecimal'],
            ['term' => 1, 'week_number' => 3, 'topic_label' => 'Modular Arithmetic'],
            ['term' => 1, 'week_number' => 4, 'topic_label' => 'Indices and Standard Form'],
            ['term' => 1, 'week_number' => 5, 'topic_label' => 'Logarithms: Laws and Applications'],
            ['term' => 1, 'week_number' => 6, 'topic_label' => 'Sets: Types and Notation'],
            ['term' => 1, 'week_number' => 7, 'topic_label' => 'Sets: Union, Intersection, and Complement'],
            ['term' => 1, 'week_number' => 8, 'topic_label' => 'Venn Diagrams: Two and Three Sets'],
            ['term' => 1, 'week_number' => 9, 'topic_label' => 'Simple Equations and Inequalities'],
            ['term' => 1, 'week_number' => 10, 'topic_label' => 'Linear Equations in Two Variables'],
            ['term' => 1, 'week_number' => 11, 'topic_label' => 'Revision and Term Exam'],
            ['term' => 2, 'week_number' => 1, 'topic_label' => 'Quadratic Expressions: Factorization'],
            ['term' => 2, 'week_number' => 2, 'topic_label' => 'Quadratic Equations: Solving Methods'],
            ['term' => 2, 'week_number' => 3, 'topic_label' => 'Quadratic Equations: Word Problems'],
            ['term' => 2, 'week_number' => 4, 'topic_label' => 'Logical Reasoning and Proof'],
            ['term' => 2, 'week_number' => 5, 'topic_label' => 'Algebraic Fractions'],
            ['term' => 2, 'week_number' => 6, 'topic_label' => 'Surds: Simplification'],
            ['term' => 2, 'week_number' => 7, 'topic_label' => 'Surds: Rationalization'],
            ['term' => 2, 'week_number' => 8, 'topic_label' => 'Matrices: Addition and Subtraction'],
            ['term' => 2, 'week_number' => 9, 'topic_label' => 'Matrices: Multiplication'],
            ['term' => 2, 'week_number' => 10, 'topic_label' => 'Revision and Term Exam'],
            ['term' => 3, 'week_number' => 1, 'topic_label' => 'Trigonometry: Basic Ratios'],
            ['term' => 3, 'week_number' => 2, 'topic_label' => 'Trigonometry: Angles of Elevation and Depression'],
            ['term' => 3, 'week_number' => 3, 'topic_label' => 'Mensuration: Circles and Sectors'],
            ['term' => 3, 'week_number' => 4, 'topic_label' => 'Mensuration: Solid Figures'],
            ['term' => 3, 'week_number' => 5, 'topic_label' => 'Coordinate Geometry: Distance and Midpoint'],
            ['term' => 3, 'week_number' => 6, 'topic_label' => 'Coordinate Geometry: Gradient and Equations of Lines'],
            ['term' => 3, 'week_number' => 7, 'topic_label' => 'Statistics: Data Collection and Presentation'],
            ['term' => 3, 'week_number' => 8, 'topic_label' => 'Statistics: Mean, Median, and Mode'],
            ['term' => 3, 'week_number' => 9, 'topic_label' => 'Probability: Basic Concepts'],
            ['term' => 3, 'week_number' => 10, 'topic_label' => 'Revision and Final Exam'],
        ];

        foreach ($ss1MathScheme as $item) {
            SchemeOfWorkItem::create([
                'curriculum_subject_level_id' => $ss1Math->id,
                'term' => $item['term'],
                'week_number' => $item['week_number'],
                'topic_label' => $item['topic_label'],
            ]);
        }

        $ss1PhysicsScheme = [
            ['term' => 1, 'week_number' => 1, 'topic_label' => 'Introduction to Physics: Measurements'],
            ['term' => 1, 'week_number' => 2, 'topic_label' => 'Fundamental and Derived Units'],
            ['term' => 1, 'week_number' => 3, 'topic_label' => 'Scalar and Vector Quantities'],
            ['term' => 1, 'week_number' => 4, 'topic_label' => 'Motion: Speed, Velocity, and Acceleration'],
            ['term' => 1, 'week_number' => 5, 'topic_label' => 'Equations of Motion'],
            ['term' => 1, 'week_number' => 6, 'topic_label' => 'Newton\'s Laws of Motion'],
            ['term' => 1, 'week_number' => 7, 'topic_label' => 'Friction: Types and Applications'],
            ['term' => 1, 'week_number' => 8, 'topic_label' => 'Work, Energy, and Power'],
            ['term' => 1, 'week_number' => 9, 'topic_label' => 'Energy Conservation'],
            ['term' => 1, 'week_number' => 10, 'topic_label' => 'Revision and Term Exam'],
            ['term' => 2, 'week_number' => 1, 'topic_label' => 'Pressure in Solids and Fluids'],
            ['term' => 2, 'week_number' => 2, 'topic_label' => 'Archimedes\' Principle and Flotation'],
            ['term' => 2, 'week_number' => 3, 'topic_label' => 'Temperature and Thermometers'],
            ['term' => 2, 'week_number' => 4, 'topic_label' => 'Heat Transfer: Conduction and Convection'],
            ['term' => 2, 'week_number' => 5, 'topic_label' => 'Heat Transfer: Radiation'],
            ['term' => 2, 'week_number' => 6, 'topic_label' => 'Change of State and Latent Heat'],
            ['term' => 2, 'week_number' => 7, 'topic_label' => 'Gas Laws'],
            ['term' => 2, 'week_number' => 8, 'topic_label' => 'Waves: Properties and Types'],
            ['term' => 2, 'week_number' => 9, 'topic_label' => 'Sound Waves'],
            ['term' => 2, 'week_number' => 10, 'topic_label' => 'Revision and Term Exam'],
        ];

        foreach ($ss1PhysicsScheme as $item) {
            SchemeOfWorkItem::create([
                'curriculum_subject_level_id' => $ss1Physics->id,
                'term' => $item['term'],
                'week_number' => $item['week_number'],
                'topic_label' => $item['topic_label'],
            ]);
        }

        $algoBlocks = ContentBlock::where('canonical_topic_id', $algoTopic->id)->where('is_container', false)->orderBy('path')->get();
        $dsBlocks = ContentBlock::where('canonical_topic_id', $dsTopic->id)->where('is_container', false)->orderBy('path')->get();

        $jss1CSScheme = [
            ['term' => 1, 'week_number' => 1, 'topic_label' => 'Introduction to Computers', 'canonical_topic_id' => null, 'content_block_id' => null],
            ['term' => 1, 'week_number' => 2, 'topic_label' => 'Computer Hardware Components', 'canonical_topic_id' => null, 'content_block_id' => null],
            ['term' => 1, 'week_number' => 3, 'topic_label' => 'Computer Software Types', 'canonical_topic_id' => null, 'content_block_id' => null],
            ['term' => 1, 'week_number' => 4, 'topic_label' => 'Introduction to Algorithms', 'canonical_topic_id' => $algoTopic->id, 'content_block_id' => $algoBlocks->first()?->id],
            ['term' => 1, 'week_number' => 5, 'topic_label' => 'Searching: Linear and Binary', 'canonical_topic_id' => $algoTopic->id, 'content_block_id' => $algoBlocks->get(2)?->id],
            ['term' => 1, 'week_number' => 6, 'topic_label' => 'Simple Sorting Algorithms', 'canonical_topic_id' => $algoTopic->id, 'content_block_id' => $algoBlocks->get(4)?->id],
            ['term' => 1, 'week_number' => 7, 'topic_label' => 'Data Structures Overview', 'canonical_topic_id' => $dsTopic->id, 'content_block_id' => $dsBlocks->first()?->id],
            ['term' => 1, 'week_number' => 8, 'topic_label' => 'Arrays and Lists', 'canonical_topic_id' => $dsTopic->id, 'content_block_id' => $dsBlocks->get(2)?->id],
            ['term' => 1, 'week_number' => 9, 'topic_label' => 'Stacks and Queues', 'canonical_topic_id' => $dsTopic->id, 'content_block_id' => $dsBlocks->get(4)?->id],
            ['term' => 1, 'week_number' => 10, 'topic_label' => 'Revision and Assessment'],
        ];

        foreach ($jss1CSScheme as $item) {
            SchemeOfWorkItem::create([
                'curriculum_subject_level_id' => $jss1CS->id,
                'term' => $item['term'],
                'week_number' => $item['week_number'],
                'topic_label' => $item['topic_label'],
                'canonical_topic_id' => $item['canonical_topic_id'] ?? null,
                'content_block_id' => $item['content_block_id'] ?? null,
            ]);
        }
    }
}
