<?php

namespace Database\Seeders;

use App\Enums\AnswerDepthLevel;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionSource;
use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Enums\TopicDifficulty;
use App\Enums\UserRole;
use App\Models\CanonicalTopic;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\LevelSubject;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionTopicLink;
use App\Models\SchemeOfWorkItem;
use App\Models\Stream;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class SecondaryPracticeSeeder extends Seeder
{
    public function run(): void
    {
        $contentUser = User::where('email', 'content@skoolpad.com')->firstOrFail();
        $ss1 = EducationLevel::where('name', 'SS 1')->firstOrFail();
        $scienceStream = Stream::where('name', 'Science')->firstOrFail();

        $mathDiscipline = Discipline::where('slug', 'mathematics')->firstOrFail();
        $physicsDiscipline = Discipline::where('slug', 'physics')->firstOrFail();

        $mathSubject = CurriculumSubject::where('slug', 'mathematics')->firstOrFail();
        $physicsSubject = CurriculumSubject::where('slug', 'physics')->firstOrFail();

        $ss1Math = LevelSubject::where('education_level_id', $ss1->id)
            ->where('curriculum_subject_id', $mathSubject->id)
            ->firstOrFail();

        $ss1Physics = LevelSubject::where('education_level_id', $ss1->id)
            ->where('curriculum_subject_id', $physicsSubject->id)
            ->firstOrFail();

        $tiptap = fn (string $text): array => [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
            ],
        ];

        $mathTopics = $this->createMathTopics($mathDiscipline);
        $physicsTopics = $this->createPhysicsTopics($physicsDiscipline);

        $this->linkTopicsToScheme($ss1Math, $mathTopics, [
            'Number Bases' => 'number-bases',
            'Indices' => 'indices-logarithms',
            'Sets: Types' => 'sets',
            'Union, Intersection' => 'sets',
            'Venn Diagrams' => 'sets',
            'Quadratic Expressions' => 'quadratic-equations',
            'Quadratic Equations: Solving' => 'quadratic-equations',
            'Quadratic Equations: Word' => 'quadratic-equations',
            'Trigonometry: Basic' => 'trigonometry-basics',
            'Trigonometry: Angles' => 'trigonometry-basics',
            'Statistics: Data' => 'statistics-basics',
            'Statistics: Mean' => 'statistics-basics',
        ]);

        $this->linkTopicsToScheme($ss1Physics, $physicsTopics, [
            'Measurements' => 'measurements-and-units',
            'Fundamental and Derived Units' => 'measurements-and-units',
            'Speed, Velocity' => 'motion',
            'Equations of Motion' => 'motion',
            'Newton\'s Laws' => 'newtons-laws',
            'Work, Energy' => 'work-energy-power',
            'Energy Conservation' => 'work-energy-power',
            'Pressure in Solids' => 'pressure',
            'Archimedes' => 'pressure',
            'Conduction and Convection' => 'heat-transfer',
            'Radiation' => 'heat-transfer',
        ]);

        $this->seedMathQuestions($contentUser, $mathTopics, $tiptap);
        $this->seedPhysicsQuestions($contentUser, $physicsTopics, $tiptap);

        $this->createSecondaryStudent($ss1, $scienceStream);
    }

    /** @return array<string, CanonicalTopic> */
    private function createMathTopics(Discipline $discipline): array
    {
        $topics = [
            ['title' => 'Number Bases', 'slug' => 'number-bases', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 12],
            ['title' => 'Indices and Logarithms', 'slug' => 'indices-logarithms', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 15],
            ['title' => 'Sets', 'slug' => 'sets', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 10],
            ['title' => 'Quadratic Equations', 'slug' => 'quadratic-equations', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 18],
            ['title' => 'Trigonometry Basics', 'slug' => 'trigonometry-basics', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 20],
            ['title' => 'Statistics Basics', 'slug' => 'statistics-basics', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 14],
        ];

        return $this->createTopics($discipline, $topics);
    }

    /** @return array<string, CanonicalTopic> */
    private function createPhysicsTopics(Discipline $discipline): array
    {
        $topics = [
            ['title' => 'Measurements and Units', 'slug' => 'measurements-and-units', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 10],
            ['title' => 'Motion', 'slug' => 'motion', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 18],
            ['title' => 'Newton\'s Laws of Motion', 'slug' => 'newtons-laws', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 16],
            ['title' => 'Work, Energy and Power', 'slug' => 'work-energy-power', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 20],
            ['title' => 'Pressure', 'slug' => 'pressure', 'difficulty' => TopicDifficulty::Foundational, 'minutes' => 12],
            ['title' => 'Heat Transfer', 'slug' => 'heat-transfer', 'difficulty' => TopicDifficulty::Intermediate, 'minutes' => 15],
        ];

        return $this->createTopics($discipline, $topics);
    }

    /** @return array<string, CanonicalTopic> */
    private function createTopics(Discipline $discipline, array $topics): array
    {
        $created = [];

        foreach ($topics as $data) {
            $created[$data['slug']] = CanonicalTopic::create([
                'discipline_id' => $discipline->id,
                'title' => $data['title'],
                'slug' => $data['slug'],
                'content' => [
                    'type' => 'doc',
                    'content' => [
                        ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => "Comprehensive guide to {$data['title']} for secondary school students."]]],
                    ],
                ],
                'content_plain' => "Comprehensive guide to {$data['title']} for secondary school students.",
                'summary' => "An overview of {$data['title']} covering key concepts and worked examples.",
                'difficulty_level' => $data['difficulty'],
                'estimated_read_minutes' => $data['minutes'],
                'language' => 'en',
                'is_published' => true,
                'published_at' => now(),
            ]);
        }

        return $created;
    }

    /**
     * @param  array<string, string>  $mapping  topic_label substring => topic slug
     * @param  array<string, CanonicalTopic>  $topics
     */
    private function linkTopicsToScheme(LevelSubject $levelSubject, array $topics, array $mapping): void
    {
        foreach ($mapping as $labelPattern => $topicSlug) {
            SchemeOfWorkItem::where('curriculum_subject_level_id', $levelSubject->id)
                ->where('topic_label', 'ilike', "%{$labelPattern}%")
                ->whereNull('canonical_topic_id')
                ->update(['canonical_topic_id' => $topics[$topicSlug]->id]);
        }
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function seedMathQuestions(User $author, array $topics, \Closure $tiptap): void
    {
        $questions = [
            [
                'topic' => 'number-bases',
                'content' => 'Convert 1101₂ to base 10.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '11', 'is_correct' => false],
                    ['label' => 'B', 'text' => '13', 'is_correct' => true],
                    ['label' => 'C', 'text' => '15', 'is_correct' => false],
                    ['label' => 'D', 'text' => '12', 'is_correct' => false],
                ],
                'answer' => '13. 1×2³ + 1×2² + 0×2¹ + 1×2⁰ = 8 + 4 + 0 + 1 = 13.',
            ],
            [
                'topic' => 'number-bases',
                'content' => 'Add 1011₂ and 1101₂.',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => '11000₂', 'is_correct' => true],
                    ['label' => 'B', 'text' => '10110₂', 'is_correct' => false],
                    ['label' => 'C', 'text' => '11010₂', 'is_correct' => false],
                    ['label' => 'D', 'text' => '10100₂', 'is_correct' => false],
                ],
                'answer' => '11000₂. 1011 + 1101 = 11000 in binary (11 + 13 = 24 in base 10).',
            ],
            [
                'topic' => 'indices-logarithms',
                'content' => 'Simplify 2³ × 2⁴.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '2⁷', 'is_correct' => true],
                    ['label' => 'B', 'text' => '2¹²', 'is_correct' => false],
                    ['label' => 'C', 'text' => '4⁷', 'is_correct' => false],
                    ['label' => 'D', 'text' => '2⁸', 'is_correct' => false],
                ],
                'answer' => '2⁷. When multiplying powers with the same base, add the indices: 2³⁺⁴ = 2⁷.',
            ],
            [
                'topic' => 'indices-logarithms',
                'content' => 'If log₁₀ 2 = 0.3010, find log₁₀ 8.',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => '0.6020', 'is_correct' => false],
                    ['label' => 'B', 'text' => '0.9030', 'is_correct' => true],
                    ['label' => 'C', 'text' => '0.3010', 'is_correct' => false],
                    ['label' => 'D', 'text' => '1.2040', 'is_correct' => false],
                ],
                'answer' => '0.9030. Since 8 = 2³, log₁₀ 8 = 3 × log₁₀ 2 = 3 × 0.3010 = 0.9030.',
            ],
            [
                'topic' => 'sets',
                'content' => 'If A = {1,2,3,4} and B = {3,4,5,6}, find A ∩ B.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '{1,2,3,4,5,6}', 'is_correct' => false],
                    ['label' => 'B', 'text' => '{3,4}', 'is_correct' => true],
                    ['label' => 'C', 'text' => '{1,2}', 'is_correct' => false],
                    ['label' => 'D', 'text' => '{5,6}', 'is_correct' => false],
                ],
                'answer' => '{3,4}. The intersection contains elements common to both sets.',
            ],
            [
                'topic' => 'sets',
                'content' => 'In a class of 40 students, 25 study Mathematics and 20 study Physics. If 10 study both, how many study neither?',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => '5', 'is_correct' => true],
                    ['label' => 'B', 'text' => '10', 'is_correct' => false],
                    ['label' => 'C', 'text' => '15', 'is_correct' => false],
                    ['label' => 'D', 'text' => '0', 'is_correct' => false],
                ],
                'answer' => '5. n(M ∪ P) = 25 + 20 - 10 = 35. Neither = 40 - 35 = 5.',
            ],
            [
                'topic' => 'quadratic-equations',
                'content' => 'Solve x² - 5x + 6 = 0.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => 'x = 2 or x = 3', 'is_correct' => true],
                    ['label' => 'B', 'text' => 'x = -2 or x = -3', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'x = 1 or x = 6', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'x = -1 or x = -6', 'is_correct' => false],
                ],
                'answer' => 'x = 2 or x = 3. Factoring: (x - 2)(x - 3) = 0.',
            ],
            [
                'topic' => 'quadratic-equations',
                'content' => 'Find the sum and product of roots of 2x² + 3x - 5 = 0.',
                'difficulty' => QuestionDifficulty::Hard,
                'options' => [
                    ['label' => 'A', 'text' => 'Sum = -3/2, Product = -5/2', 'is_correct' => true],
                    ['label' => 'B', 'text' => 'Sum = 3/2, Product = 5/2', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Sum = -3, Product = -5', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Sum = 3/2, Product = -5/2', 'is_correct' => false],
                ],
                'answer' => 'Sum = -b/a = -3/2, Product = c/a = -5/2.',
            ],
            [
                'topic' => 'trigonometry-basics',
                'content' => 'In a right triangle, if sin θ = 3/5, find cos θ.',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => '4/5', 'is_correct' => true],
                    ['label' => 'B', 'text' => '3/4', 'is_correct' => false],
                    ['label' => 'C', 'text' => '5/3', 'is_correct' => false],
                    ['label' => 'D', 'text' => '5/4', 'is_correct' => false],
                ],
                'answer' => '4/5. Using sin²θ + cos²θ = 1: cos θ = √(1 - 9/25) = √(16/25) = 4/5.',
            ],
            [
                'topic' => 'trigonometry-basics',
                'content' => 'What is tan 45°?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '0', 'is_correct' => false],
                    ['label' => 'B', 'text' => '1', 'is_correct' => true],
                    ['label' => 'C', 'text' => '√2', 'is_correct' => false],
                    ['label' => 'D', 'text' => '1/√2', 'is_correct' => false],
                ],
                'answer' => '1. tan 45° = sin 45° / cos 45° = (1/√2) / (1/√2) = 1.',
            ],
            [
                'topic' => 'statistics-basics',
                'content' => 'Find the mean of 4, 7, 9, 11, 14.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '8', 'is_correct' => false],
                    ['label' => 'B', 'text' => '9', 'is_correct' => true],
                    ['label' => 'C', 'text' => '10', 'is_correct' => false],
                    ['label' => 'D', 'text' => '11', 'is_correct' => false],
                ],
                'answer' => '9. Mean = (4 + 7 + 9 + 11 + 14) / 5 = 45 / 5 = 9.',
            ],
            [
                'topic' => 'statistics-basics',
                'content' => 'Find the median of 3, 7, 1, 9, 5.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '5', 'is_correct' => true],
                    ['label' => 'B', 'text' => '7', 'is_correct' => false],
                    ['label' => 'C', 'text' => '3', 'is_correct' => false],
                    ['label' => 'D', 'text' => '9', 'is_correct' => false],
                ],
                'answer' => '5. Arranged: 1, 3, 5, 7, 9. The middle value is 5.',
            ],
        ];

        foreach ($questions as $qData) {
            $this->createQuestion($author, $topics[$qData['topic']], $qData, $tiptap);
        }
    }

    /** @param array<string, CanonicalTopic> $topics */
    private function seedPhysicsQuestions(User $author, array $topics, \Closure $tiptap): void
    {
        $questions = [
            [
                'topic' => 'measurements-and-units',
                'content' => 'Which of the following is a fundamental SI unit?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => 'Newton', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Joule', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Kilogram', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'Watt', 'is_correct' => false],
                ],
                'answer' => 'Kilogram. It is one of the seven SI base units (m, kg, s, A, K, mol, cd).',
            ],
            [
                'topic' => 'measurements-and-units',
                'content' => 'Express 0.00045 m in standard form.',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '4.5 × 10⁻⁴ m', 'is_correct' => true],
                    ['label' => 'B', 'text' => '45 × 10⁻⁵ m', 'is_correct' => false],
                    ['label' => 'C', 'text' => '4.5 × 10⁻³ m', 'is_correct' => false],
                    ['label' => 'D', 'text' => '0.45 × 10⁻³ m', 'is_correct' => false],
                ],
                'answer' => '4.5 × 10⁻⁴ m. Move the decimal 4 places right to get a number between 1 and 10.',
            ],
            [
                'topic' => 'motion',
                'content' => 'A car travels 100 m in 5 s. What is its average speed?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '10 m/s', 'is_correct' => false],
                    ['label' => 'B', 'text' => '20 m/s', 'is_correct' => true],
                    ['label' => 'C', 'text' => '50 m/s', 'is_correct' => false],
                    ['label' => 'D', 'text' => '500 m/s', 'is_correct' => false],
                ],
                'answer' => '20 m/s. Speed = distance / time = 100 / 5 = 20 m/s.',
            ],
            [
                'topic' => 'motion',
                'content' => 'A body starts from rest and accelerates at 2 m/s² for 10 s. What is the final velocity?',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => '10 m/s', 'is_correct' => false],
                    ['label' => 'B', 'text' => '20 m/s', 'is_correct' => true],
                    ['label' => 'C', 'text' => '5 m/s', 'is_correct' => false],
                    ['label' => 'D', 'text' => '40 m/s', 'is_correct' => false],
                ],
                'answer' => '20 m/s. Using v = u + at: v = 0 + 2×10 = 20 m/s.',
            ],
            [
                'topic' => 'newtons-laws',
                'content' => 'A force of 20 N acts on a mass of 4 kg. What is the acceleration?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '80 m/s²', 'is_correct' => false],
                    ['label' => 'B', 'text' => '5 m/s²', 'is_correct' => true],
                    ['label' => 'C', 'text' => '24 m/s²', 'is_correct' => false],
                    ['label' => 'D', 'text' => '0.2 m/s²', 'is_correct' => false],
                ],
                'answer' => '5 m/s². From F = ma: a = F/m = 20/4 = 5 m/s².',
            ],
            [
                'topic' => 'newtons-laws',
                'content' => 'Which of Newton\'s laws explains why passengers jerk forward when a bus brakes suddenly?',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => 'First Law (Inertia)', 'is_correct' => true],
                    ['label' => 'B', 'text' => 'Second Law', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Third Law', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Law of Gravitation', 'is_correct' => false],
                ],
                'answer' => 'First Law. The body tends to remain in its state of motion (moving forward) when the bus decelerates.',
            ],
            [
                'topic' => 'work-energy-power',
                'content' => 'A force of 50 N moves an object through 10 m in the direction of the force. What is the work done?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '5 J', 'is_correct' => false],
                    ['label' => 'B', 'text' => '60 J', 'is_correct' => false],
                    ['label' => 'C', 'text' => '500 J', 'is_correct' => true],
                    ['label' => 'D', 'text' => '0.2 J', 'is_correct' => false],
                ],
                'answer' => '500 J. Work = Force × Distance = 50 × 10 = 500 J.',
            ],
            [
                'topic' => 'work-energy-power',
                'content' => 'A machine does 3000 J of work in 60 seconds. What is its power?',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => '180000 W', 'is_correct' => false],
                    ['label' => 'B', 'text' => '500 W', 'is_correct' => false],
                    ['label' => 'C', 'text' => '50 W', 'is_correct' => true],
                    ['label' => 'D', 'text' => '3060 W', 'is_correct' => false],
                ],
                'answer' => '50 W. Power = Work / Time = 3000 / 60 = 50 W.',
            ],
            [
                'topic' => 'pressure',
                'content' => 'A block of weight 200 N rests on a surface area of 0.5 m². What is the pressure exerted?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '100 Pa', 'is_correct' => false],
                    ['label' => 'B', 'text' => '400 Pa', 'is_correct' => true],
                    ['label' => 'C', 'text' => '200 Pa', 'is_correct' => false],
                    ['label' => 'D', 'text' => '0.0025 Pa', 'is_correct' => false],
                ],
                'answer' => '400 Pa. Pressure = Force / Area = 200 / 0.5 = 400 Pa.',
            ],
            [
                'topic' => 'pressure',
                'content' => 'Atmospheric pressure at sea level is approximately:',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => '1.01 × 10⁵ Pa', 'is_correct' => true],
                    ['label' => 'B', 'text' => '1.01 × 10³ Pa', 'is_correct' => false],
                    ['label' => 'C', 'text' => '9.8 Pa', 'is_correct' => false],
                    ['label' => 'D', 'text' => '1.01 × 10⁸ Pa', 'is_correct' => false],
                ],
                'answer' => '1.01 × 10⁵ Pa. Standard atmospheric pressure is approximately 101,325 Pa.',
            ],
            [
                'topic' => 'heat-transfer',
                'content' => 'Which method of heat transfer does not require a medium?',
                'difficulty' => QuestionDifficulty::Easy,
                'options' => [
                    ['label' => 'A', 'text' => 'Conduction', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Convection', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Radiation', 'is_correct' => true],
                    ['label' => 'D', 'text' => 'Evaporation', 'is_correct' => false],
                ],
                'answer' => 'Radiation. It travels through electromagnetic waves and does not require a material medium.',
            ],
            [
                'topic' => 'heat-transfer',
                'content' => 'A thermos flask reduces heat loss by minimising:',
                'difficulty' => QuestionDifficulty::Medium,
                'options' => [
                    ['label' => 'A', 'text' => 'Conduction only', 'is_correct' => false],
                    ['label' => 'B', 'text' => 'Convection only', 'is_correct' => false],
                    ['label' => 'C', 'text' => 'Radiation only', 'is_correct' => false],
                    ['label' => 'D', 'text' => 'Conduction, convection and radiation', 'is_correct' => true],
                ],
                'answer' => 'All three. Vacuum prevents conduction and convection, silvered walls reduce radiation.',
            ],
        ];

        foreach ($questions as $qData) {
            $this->createQuestion($author, $topics[$qData['topic']], $qData, $tiptap);
        }
    }

    private function createQuestion(User $author, CanonicalTopic $topic, array $data, \Closure $tiptap): void
    {
        $question = Question::create([
            'institution_course_id' => null,
            'question_type' => QuestionType::Mcq,
            'content' => $data['content'],
            'marks' => 2,
            'difficulty_level' => $data['difficulty'],
            'response_config' => ['options' => $data['options']],
            'source' => QuestionSource::Manual,
            'status' => QuestionStatus::Published,
            'is_published' => true,
            'created_by' => $author->id,
            'reviewed_by' => $author->id,
            'published_at' => now(),
        ]);

        QuestionTopicLink::create([
            'question_id' => $question->id,
            'canonical_topic_id' => $topic->id,
            'is_primary' => true,
        ]);

        QuestionAnswer::create([
            'question_id' => $question->id,
            'depth_level' => AnswerDepthLevel::Quick,
            'content' => $tiptap($data['answer']),
            'content_plain' => $data['answer'],
            'is_published' => true,
            'created_by' => $author->id,
        ]);
    }

    private function createSecondaryStudent(EducationLevel $ss1, Stream $scienceStream): void
    {
        $user = User::create([
            'name' => 'Demo Secondary Student',
            'email' => 'secondary@skoolpad.com',
            'role' => UserRole::Student,
            'password' => 'password',
            'is_active' => true,
        ]);

        $institution = \App\Models\Institution::where('abbreviation', 'MOUAU')->firstOrFail();
        $nerdc = \App\Models\EducationSystem::where('slug', 'nerdc')->firstOrFail();

        StudentProfile::create([
            'user_id' => $user->id,
            'institution_id' => $institution->id,
            'education_system_id' => $nerdc->id,
            'education_level_id' => $ss1->id,
            'stream_id' => $scienceStream->id,
            'student_type' => \App\Enums\StudentType::Secondary,
        ]);
    }
}
