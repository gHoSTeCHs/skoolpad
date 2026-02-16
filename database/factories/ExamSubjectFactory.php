<?php

namespace Database\Factories;

use App\Models\ExamType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamSubject>
 */
class ExamSubjectFactory extends Factory
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
            'exam_type_id' => ExamType::factory(),
            'name' => $pick['name'],
            'slug' => Str::slug($pick['name']).'-'.Str::random(4),
            'is_compulsory' => $pick['compulsory'],
        ];
    }
}
