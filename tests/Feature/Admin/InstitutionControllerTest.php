<?php

use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Models\Country;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays institutions page', function () {
    Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);
    Institution::factory()->create(['name' => 'University of Nigeria', 'abbreviation' => 'UNN']);
    Institution::factory()->create(['name' => 'Ahmadu Bello University', 'abbreviation' => 'ABU']);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institutions/index')
            ->has('institutions.data', 3)
            ->has('institutions.meta.current_page')
            ->has('institutions.meta.last_page')
            ->has('institutions.meta.per_page')
            ->has('institutions.meta.total')
            ->has('institutions.links.prev')
            ->has('institutions.links.next')
            ->has('institutionTypes')
            ->has('ownershipTypes')
        );
});

test('index filters institutions by search', function () {
    Institution::factory()->create(['name' => 'Michael Okpara University of Agriculture', 'abbreviation' => 'MOUAU']);
    Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.index', ['search' => 'MOUAU']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('institutions.data', 1)
        );
});

test('index filters institutions by abbreviation', function () {
    Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);
    Institution::factory()->create(['name' => 'University of Nigeria', 'abbreviation' => 'UNN']);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.index', ['search' => 'UNN']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('institutions.data', 1)
        );
});

test('index filters institutions by institution_type', function () {
    Institution::factory()->create([
        'name' => 'University of Lagos',
        'abbreviation' => 'UNILAG',
        'institution_type' => InstitutionType::University,
    ]);
    Institution::factory()->create([
        'name' => 'Federal Polytechnic Nekede',
        'abbreviation' => 'FEDPONEK',
        'institution_type' => InstitutionType::Polytechnic,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.index', ['institution_type' => 'university']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('institutions.data', 1)
        );
});

test('index filters institutions by ownership_type', function () {
    Institution::factory()->create([
        'name' => 'University of Lagos',
        'abbreviation' => 'UNILAG',
        'ownership_type' => OwnershipType::Federal,
    ]);
    Institution::factory()->create([
        'name' => 'Lagos State University',
        'abbreviation' => 'LASU',
        'ownership_type' => OwnershipType::State,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.index', ['ownership_type' => 'federal']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('institutions.data', 1)
        );
});

test('index filters institutions by is_active', function () {
    Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG', 'is_active' => true]);
    Institution::factory()->create(['name' => 'University of Nigeria', 'abbreviation' => 'UNN', 'is_active' => false]);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.index', ['is_active' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('institutions.data', 1)
        );
});

test('create displays create institution page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.institutions.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institutions/create')
            ->has('institutionTypes')
            ->has('ownershipTypes')
            ->has('countries')
        );
});

test('store creates an institution and redirects', function () {
    $country = Country::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.institutions.store'), [
            'name' => 'Test University',
            'abbreviation' => 'TU',
            'institution_type' => 'university',
            'ownership_type' => 'federal',
            'country_id' => $country->id,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.institutions.index'));

    $this->assertDatabaseHas('institutions', [
        'name' => 'Test University',
        'abbreviation' => 'TU',
        'country_id' => $country->id,
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.institutions.store'), [])
        ->assertSessionHasErrors(['name', 'abbreviation', 'institution_type', 'ownership_type', 'country_id']);
});

test('store validates unique name', function () {
    Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);

    $this->actingAs($this->admin)
        ->post(route('admin.institutions.store'), [
            'name' => 'University of Lagos',
            'abbreviation' => 'NEWABBR',
            'institution_type' => 'university',
            'ownership_type' => 'federal',
            'country_id' => Country::factory()->create()->id,
        ])
        ->assertSessionHasErrors(['name']);
});

test('store validates unique abbreviation', function () {
    Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);

    $this->actingAs($this->admin)
        ->post(route('admin.institutions.store'), [
            'name' => 'Some Other University',
            'abbreviation' => 'UNILAG',
            'institution_type' => 'university',
            'ownership_type' => 'federal',
            'country_id' => Country::factory()->create()->id,
        ])
        ->assertSessionHasErrors(['abbreviation']);
});

test('edit displays edit institution page', function () {
    $institution = Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);

    $this->actingAs($this->admin)
        ->get(route('admin.institutions.edit', $institution))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institutions/edit')
            ->has('institution')
            ->has('institutionTypes')
            ->has('ownershipTypes')
            ->has('countries')
        );
});

test('update modifies an institution and redirects', function () {
    $institution = Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);

    $this->actingAs($this->admin)
        ->put(route('admin.institutions.update', $institution), [
            'name' => 'Updated University',
            'abbreviation' => 'UU',
            'institution_type' => $institution->institution_type->value,
            'ownership_type' => $institution->ownership_type->value,
            'country_id' => $institution->country_id,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.institutions.index'));

    $this->assertDatabaseHas('institutions', [
        'id' => $institution->id,
        'name' => 'Updated University',
        'abbreviation' => 'UU',
    ]);
});

test('update allows keeping the same name and abbreviation', function () {
    $institution = Institution::factory()->create(['name' => 'University of Lagos', 'abbreviation' => 'UNILAG']);

    $this->actingAs($this->admin)
        ->put(route('admin.institutions.update', $institution), [
            'name' => 'University of Lagos',
            'abbreviation' => 'UNILAG',
            'institution_type' => $institution->institution_type->value,
            'ownership_type' => $institution->ownership_type->value,
            'country_id' => $institution->country_id,
        ])
        ->assertRedirect(route('admin.institutions.index'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.institutions.index'))
        ->assertForbidden();
});

test('store uploads a logo', function () {
    Storage::fake('s3');
    $country = Country::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.institutions.store'), [
            'name' => 'Logo University',
            'abbreviation' => 'LU',
            'institution_type' => 'university',
            'ownership_type' => 'federal',
            'country_id' => $country->id,
            'logo' => UploadedFile::fake()->image('logo.png', 200, 200),
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.institutions.index'));

    $institution = Institution::where('abbreviation', 'LU')->first();
    expect($institution->logo_path)->not->toBeNull();
    Storage::disk('s3')->assertExists($institution->logo_path);
});

test('staff without manage_institutions permission get 403', function () {
    $staff = User::factory()->contentManager()->create();

    $this->actingAs($staff)
        ->get(route('admin.institutions.index'))
        ->assertForbidden();
});

test('guests cannot access institution routes', function () {
    $this->get(route('admin.institutions.index'))->assertRedirect(route('login'));
    $this->get(route('admin.institutions.create'))->assertRedirect(route('login'));
});
