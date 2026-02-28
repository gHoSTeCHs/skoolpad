<?php

namespace Database\Factories;

use App\Models\AssessmentType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AssessmentSubject>
 */
class AssessmentSubjectFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $subjects = [
            ['name' => 'Mathematics', 'compulsory' => true],
            ['name' => 'English Language', 'compulsory' => true],
            ['name' => 'Physics', 'compulsory' => false],
            ['name' => 'Chemistry', 'compulsory' => false],
            ['name' => 'Biology', 'compulsory' => false],
            ['name' => 'Economics', 'compulsory' => false],
            ['name' => 'Government', 'compulsory' => false],
        ];

        $pick = fake()->randomElement($subjects);

        return [
            'assessment_type_id' => AssessmentType::factory(),
            'name' => $pick['name'],
            'slug' => Str::slug($pick['name']).'-'.Str::random(4),
            'is_compulsory' => $pick['compulsory'],
        ];
    }
}
