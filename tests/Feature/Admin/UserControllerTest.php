<?php

use App\Enums\UserRole;
use App\Models\Institution;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays users page', function () {
    User::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data')
            ->has('users.meta.current_page')
            ->has('users.meta.last_page')
            ->has('users.meta.per_page')
            ->has('users.meta.total')
            ->has('users.links.prev')
            ->has('users.links.next')
            ->has('filters')
            ->has('roles')
        );
});

test('index paginates users', function () {
    User::factory()->count(20)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('users.meta.per_page', 15)
        );
});

test('index filters by role', function () {
    User::factory()->contentManager()->create();
    User::factory()->contentManager()->create();
    User::factory()->contentReviewer()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.index', ['role' => 'content_manager']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 2)
        );
});

test('index filters by is_active', function () {
    User::factory()->create(['is_active' => true]);
    User::factory()->inactive()->create();
    User::factory()->inactive()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.index', ['is_active' => '0']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 2)
        );
});

test('index searches by name', function () {
    User::factory()->create(['name' => 'John Unique Name']);
    User::factory()->create(['name' => 'Jane Doe']);

    $this->actingAs($this->admin)
        ->get(route('admin.users.index', ['search' => 'John Unique']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
        );
});

test('index searches by email', function () {
    User::factory()->create(['email' => 'uniquesearch@example.com']);
    User::factory()->create(['email' => 'other@example.com']);

    $this->actingAs($this->admin)
        ->get(route('admin.users.index', ['search' => 'uniquesearch@']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
        );
});

test('show displays user with student profile', function () {
    $student = User::factory()->create(['role' => UserRole::Student]);
    $institution = Institution::factory()->create();
    StudentProfile::factory()->create([
        'user_id' => $student->id,
        'institution_id' => $institution->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.users.show', $student))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->has('user.student_profile')
            ->where('user.student_profile.institution.id', $institution->id)
        );
});

test('show displays user without student profile', function () {
    $staff = User::factory()->contentManager()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.show', $staff))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/show')
            ->where('user.student_profile', null)
        );
});

test('edit renders with user data and roles', function () {
    $user = User::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.users.edit', $user))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/edit')
            ->has('user')
            ->has('roles')
        );
});

test('update changes role and is_active', function () {
    $user = User::factory()->create(['role' => UserRole::Student, 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $user), [
            'role' => 'content_reviewer',
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.users.index'));

    $user->refresh();
    expect($user->role)->toBe(UserRole::ContentReviewer);
    expect($user->is_active)->toBeFalse();
});

test('update prevents self role change', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.users.update', $this->admin), [
            'role' => 'content_manager',
            'is_active' => true,
        ])
        ->assertForbidden();
});

test('update requires manage_roles for role change', function () {
    $contentManager = User::factory()->contentManager()->create();
    $user = User::factory()->create(['role' => UserRole::Student]);

    $this->actingAs($contentManager)
        ->put(route('admin.users.update', $user), [
            'role' => 'content_reviewer',
            'is_active' => true,
        ])
        ->assertForbidden();
});

test('update is forbidden for non-superadmin staff', function () {
    $contentManager = User::factory()->contentManager()->create();
    $user = User::factory()->create(['role' => UserRole::Student, 'is_active' => true]);

    $this->actingAs($contentManager)
        ->put(route('admin.users.update', $user), [
            'role' => 'student',
            'is_active' => false,
        ])
        ->assertForbidden();
});

test('guests cannot access user routes', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('login'));
    $this->get(route('admin.users.show', User::factory()->create()))->assertRedirect(route('login'));
    $this->get(route('admin.users.edit', User::factory()->create()))->assertRedirect(route('login'));
});
