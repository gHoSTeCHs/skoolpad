<?php

namespace Database\Factories;

use App\Enums\ImportStatus;
use App\Enums\ImportType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ImportLog>
 */
class ImportLogFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'import_type' => fake()->randomElement(ImportType::cases()),
            'original_filename' => fake()->word().'.csv',
            'status' => ImportStatus::Completed,
            'total_rows' => fake()->numberBetween(10, 500),
            'success_count' => fake()->numberBetween(5, 500),
            'error_count' => 0,
            'errors' => null,
            'processed_by' => User::factory(),
        ];
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ImportStatus::Failed,
            'error_count' => fake()->numberBetween(1, 50),
            'errors' => [
                ['row' => 1, 'message' => 'Invalid data format'],
                ['row' => 5, 'message' => 'Missing required field'],
            ],
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ImportStatus::Pending,
            'total_rows' => 0,
            'success_count' => 0,
            'error_count' => 0,
            'errors' => null,
        ]);
    }
}
