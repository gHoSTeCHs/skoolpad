<?php

namespace Database\Factories;

use App\Enums\CheckInSessionStatus;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ParentCheckInSession>
 */
class ParentCheckInSessionFactory extends Factory
{
    protected $model = ParentCheckInSession::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'parent_child_link_id' => ParentChildLink::factory(),
            'session_date' => now()->toDateString(),
            'duration_minutes' => 10,
            'items' => [],
            'completed_items' => [],
            'status' => CheckInSessionStatus::Pending,
            'started_at' => null,
            'completed_at' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CheckInSessionStatus::InProgress,
            'started_at' => now(),
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CheckInSessionStatus::Completed,
            'started_at' => now()->subMinutes(10),
            'completed_at' => now(),
        ]);
    }
}
