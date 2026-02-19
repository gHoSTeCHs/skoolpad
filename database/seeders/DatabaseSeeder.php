<?php

namespace Database\Seeders;

use App\Enums\BillingPeriod;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Enums\TopicDifficulty;
use App\Enums\UserRole;
use App\Models\CanonicalTopic;
use App\Models\Country;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\ExamType;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\PlatformSetting;
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

        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@skoolpad.com',
            'role' => UserRole::SuperAdmin,
            'password' => 'password',
            'is_active' => true,
        ]);
    }
}
