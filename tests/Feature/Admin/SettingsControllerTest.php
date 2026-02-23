<?php

use App\Models\PlatformSetting;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();

    PlatformSetting::factory()->create([
        'key' => 'monetization_enabled',
        'value' => false,
        'updated_by' => null,
    ]);

    PlatformSetting::factory()->create([
        'key' => 'registration_open',
        'value' => true,
        'updated_by' => null,
    ]);
});

test('index displays settings with current values', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.settings.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/index')
            ->has('settings')
            ->where('settings.monetization_enabled', false)
            ->where('settings.registration_open', true)
        );
});

test('update toggles monetization_enabled', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'key' => 'monetization_enabled',
            'value' => true,
        ])
        ->assertRedirect();

    $setting = PlatformSetting::where('key', 'monetization_enabled')->first();
    expect($setting->value)->toBeTrue();
});

test('update toggles registration_open', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'key' => 'registration_open',
            'value' => false,
        ])
        ->assertRedirect();

    $setting = PlatformSetting::where('key', 'registration_open')->first();
    expect($setting->value)->toBeFalse();
});

test('update sets updated_by on setting', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'key' => 'monetization_enabled',
            'value' => true,
        ])
        ->assertRedirect();

    $setting = PlatformSetting::where('key', 'monetization_enabled')->first();
    expect($setting->updated_by)->toBe($this->admin->id);
});

test('update rejects invalid key', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.settings.update'), [
            'key' => 'nonexistent_setting',
            'value' => true,
        ])
        ->assertSessionHasErrors('key');
});

test('update requires manage_platform_settings permission', function () {
    $reviewer = User::factory()->contentReviewer()->create();

    $this->actingAs($reviewer)
        ->put(route('admin.settings.update'), [
            'key' => 'registration_open',
            'value' => false,
        ])
        ->assertForbidden();
});

test('update monetization requires toggle_monetization permission', function () {
    $contentManager = User::factory()->contentManager()->create();

    $this->actingAs($contentManager)
        ->put(route('admin.settings.update'), [
            'key' => 'monetization_enabled',
            'value' => true,
        ])
        ->assertForbidden();
});

test('guests cannot access settings', function () {
    $this->get(route('admin.settings.index'))->assertRedirect(route('login'));
    $this->put(route('admin.settings.update'))->assertRedirect(route('login'));
});
