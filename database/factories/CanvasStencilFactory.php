<?php

namespace Database\Factories;

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use App\Models\CanvasStencil;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CanvasStencil>
 */
class CanvasStencilFactory extends Factory
{
    protected $model = CanvasStencil::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);
        $slug = Str::slug($name).'-'.$this->faker->unique()->bothify('##??');

        return [
            'name' => ucwords($name),
            'slug' => $slug,
            'category' => StencilCategory::General->value,
            'tags' => [$this->faker->word(), $this->faker->word()],
            'svg_path' => "/stencils/general/{$slug}.svg",
            'thumbnail_path' => null,
            'license' => StencilLicense::Skoolpad->value,
            'source_attribution' => null,
            'source_url' => null,
            'sort_order' => 0,
            'is_active' => true,
            'created_by' => User::factory(),
        ];
    }

    public function category(StencilCategory $category): self
    {
        return $this->state(fn () => [
            'category' => $category->value,
            'svg_path' => "/stencils/{$category->value}/".Str::random(8).'.svg',
        ]);
    }

    public function inactive(): self
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
