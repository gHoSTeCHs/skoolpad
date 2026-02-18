<?php

namespace Database\Factories;

use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamType>
 */
class ExamTypeFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $exams = [
            ['name' => 'West African Senior School Certificate Examination', 'slug' => 'wassce', 'duration' => 180, 'questions' => 60],
            ['name' => 'Joint Admissions and Matriculation Board', 'slug' => 'jamb', 'duration' => 120, 'questions' => 40],
            ['name' => 'National Examinations Council', 'slug' => 'neco', 'duration' => 180, 'questions' => 60],
            ['name' => 'Post UTME', 'slug' => 'post-utme', 'duration' => 60, 'questions' => 50],
        ];

        $pick = fake()->unique()->randomElement($exams);

        return [
            'country_id' => Country::factory(),
            'name' => $pick['name'],
            'slug' => $pick['slug'].'-'.Str::random(4),
            'description' => fake()->sentence(),
            'duration_minutes' => $pick['duration'],
            'questions_per_subject' => $pick['questions'],
            'is_active' => true,
        ];
    }
}
