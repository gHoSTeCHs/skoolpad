<?php

namespace Database\Factories;

use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ContentProject>
 */
class ContentProjectFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'mode' => ContentProjectMode::Secondary,
            'education_level_id' => EducationLevel::factory(),
            'curriculum_subject_id' => CurriculumSubject::factory(),
            'discipline_id' => null,
            'status' => ContentProjectStatus::Draft,
            'created_by' => User::factory(),
            'progress_data' => null,
            'ai_context' => null,
        ];
    }

    public function secondary(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => ContentProjectMode::Secondary,
            'education_level_id' => EducationLevel::factory(),
            'curriculum_subject_id' => CurriculumSubject::factory(),
            'discipline_id' => null,
        ]);
    }

    public function tertiary(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => ContentProjectMode::Tertiary,
            'education_level_id' => null,
            'curriculum_subject_id' => null,
            'discipline_id' => Discipline::factory(),
        ]);
    }

    public function withStatus(ContentProjectStatus $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
        ]);
    }

    public function withResearch(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ContentProjectStatus::Research,
            'ai_context' => [
                'research' => [
                    'education_level' => 'SS1',
                    'subject' => 'Physics',
                    'total_topics_found' => 3,
                    'source_confidence' => 'medium',
                    'terms' => [
                        [
                            'term_number' => 1,
                            'term_label' => 'First Term',
                            'topics' => [
                                ['sequence' => 1, 'title' => 'Introduction to Physics', 'sub_topics' => ['definition', 'branches'], 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
                                ['sequence' => 2, 'title' => 'Measurement', 'sub_topics' => ['units', 'instruments'], 'estimated_hours' => 4, 'practical_component' => true, 'waec_alignment_note' => null],
                                ['sequence' => 3, 'title' => 'Motion', 'sub_topics' => ['speed', 'velocity', 'acceleration'], 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => 'WAEC frequently tests equations of motion'],
                            ],
                        ],
                    ],
                    'lab_work_summary' => 'Measurement practical',
                    'conflicts' => [],
                    'missing_data' => [],
                ],
            ],
        ]);
    }

    public function withApprovedResearch(): static
    {
        return $this->withResearch()->state(fn (array $attributes) => [
            'ai_context' => array_merge($attributes['ai_context'] ?? [], [
                'research_approved' => [
                    ['title' => 'Introduction to Physics', 'sub_topics' => ['definition', 'branches'], 'term_number' => 1, 'sequence' => 1, 'estimated_hours' => 3, 'practical_component' => false, 'waec_alignment_note' => null],
                    ['title' => 'Measurement', 'sub_topics' => ['units', 'instruments'], 'term_number' => 1, 'sequence' => 2, 'estimated_hours' => 4, 'practical_component' => true, 'waec_alignment_note' => null],
                    ['title' => 'Motion', 'sub_topics' => ['speed', 'velocity', 'acceleration'], 'term_number' => 1, 'sequence' => 3, 'estimated_hours' => 6, 'practical_component' => false, 'waec_alignment_note' => 'WAEC frequently tests equations of motion'],
                ],
            ]),
            'progress_data' => ['research_approved_at' => now()->toISOString()],
        ]);
    }

    public function withScheme(): static
    {
        return $this->withApprovedResearch()->state(fn (array $attributes) => [
            'ai_context' => array_merge($attributes['ai_context'] ?? [], [
                'scheme' => [
                    'education_level' => 'SS1',
                    'subject' => 'Physics',
                    'terms' => [
                        [
                            'term_number' => 1,
                            'instructional_weeks' => 10,
                            'topics' => [
                                ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                                ['title' => 'Measurement', 'week_start' => 2, 'week_end' => 3, 'periods' => 6, 'notes' => 'includes practical session'],
                                ['title' => 'Motion', 'week_start' => 4, 'week_end' => 6, 'periods' => 9, 'notes' => null],
                            ],
                            'total_periods' => 18,
                        ],
                    ],
                    'total_topics_allocated' => 3,
                ],
            ]),
        ]);
    }

    public function withApprovedScheme(): static
    {
        return $this->withScheme()->state(fn (array $attributes) => [
            'status' => ContentProjectStatus::Structuring,
            'ai_context' => array_merge($attributes['ai_context'] ?? [], [
                'scheme_approved' => [
                    [
                        'term_number' => 1,
                        'instructional_weeks' => 10,
                        'topics' => [
                            ['title' => 'Introduction to Physics', 'week_start' => 1, 'week_end' => 1, 'periods' => 3, 'notes' => null],
                            ['title' => 'Measurement', 'week_start' => 2, 'week_end' => 3, 'periods' => 6, 'notes' => 'includes practical session'],
                            ['title' => 'Motion', 'week_start' => 4, 'week_end' => 6, 'periods' => 9, 'notes' => null],
                        ],
                    ],
                ],
            ]),
            'progress_data' => array_merge($attributes['progress_data'] ?? [], [
                'scheme_approved_at' => now()->toISOString(),
            ]),
        ]);
    }
}
