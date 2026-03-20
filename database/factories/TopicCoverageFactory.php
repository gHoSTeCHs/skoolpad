<?php

namespace Database\Factories;

use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\TopicCoverage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TopicCoverage>
 */
class TopicCoverageFactory extends Factory
{
    protected $model = TopicCoverage::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'parent_child_link_id' => ParentChildLink::factory(),
            'canonical_topic_id' => CanonicalTopic::factory(),
            'status' => TopicCoverageStatus::Covered,
            'covered_at' => now(),
            'source' => TopicCoverageSource::ParentReported,
        ];
    }

    public function notYetCovered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TopicCoverageStatus::NotYetCovered,
            'covered_at' => null,
        ]);
    }

    public function skipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TopicCoverageStatus::Skipped,
            'covered_at' => null,
        ]);
    }

    public function fromScheme(): static
    {
        return $this->state(fn (array $attributes) => [
            'source' => TopicCoverageSource::SchemeDefault,
        ]);
    }

    public function fromApp(): static
    {
        return $this->state(fn (array $attributes) => [
            'source' => TopicCoverageSource::AppActivity,
        ]);
    }
}
