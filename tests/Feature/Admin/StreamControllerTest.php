<?php

use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use App\Models\Stream;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->system = EducationSystem::factory()->create();
    $this->tier = CurriculumTier::factory()->create(['education_system_id' => $this->system->id]);
});

test('store creates a stream under the system', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.streams.store', $this->system), [
            'name' => 'Science',
            'applies_from_tier_id' => $this->tier->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseHas('streams', [
        'education_system_id' => $this->system->id,
        'name' => 'Science',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.streams.store', $this->system), [])
        ->assertSessionHasErrors(['name', 'applies_from_tier_id']);
});

test('store validates tier exists', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.streams.store', $this->system), [
            'name' => 'Arts',
            'applies_from_tier_id' => '00000000-0000-0000-0000-000000000000',
        ])
        ->assertSessionHasErrors(['applies_from_tier_id']);
});

test('update modifies a stream', function () {
    $stream = Stream::factory()->create([
        'education_system_id' => $this->system->id,
        'applies_from_tier_id' => $this->tier->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.streams.update', $stream), [
            'name' => 'Updated Stream',
            'applies_from_tier_id' => $this->tier->id,
        ])
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    expect($stream->fresh()->name)->toBe('Updated Stream');
});

test('destroy deletes a stream', function () {
    $stream = Stream::factory()->create([
        'education_system_id' => $this->system->id,
        'applies_from_tier_id' => $this->tier->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.streams.destroy', $stream))
        ->assertRedirect(route('admin.education-systems.show', $this->system));

    $this->assertDatabaseMissing('streams', ['id' => $stream->id]);
});
