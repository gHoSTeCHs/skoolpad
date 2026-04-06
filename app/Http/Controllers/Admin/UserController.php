<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $users = User::query()
            ->with('studentProfile.institution:id,name,abbreviation')
            ->when($request->filled('search'), fn ($q) => $q->search($request->string('search')))
            ->when($request->filled('role'), function ($query) use ($request) {
                $query->where('role', $request->string('role'));
            })
            ->when($request->filled('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'email', 'role', 'is_active', 'last_login_at', 'created_at']))
            ->paginate(self::DEFAULT_PER_PAGE)
            ->withQueryString();

        $usersWithLabels = $users->through(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'role_label' => $user->role->label(),
            'is_active' => $user->is_active,
            'institution_abbreviation' => $user->studentProfile?->institution?->abbreviation,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
        ]);

        return Inertia::render('admin/users/index', [
            'users' => $this->paginated($usersWithLabels),
            'filters' => $request->only(['search', 'role', 'is_active', 'sort', 'direction']),
            'roles' => UserRole::toSelectOptions(),
        ]);
    }

    public function show(User $user): Response
    {
        Gate::authorize('view', $user);

        $user->load([
            'studentProfile.institution:id,name,abbreviation',
            'studentProfile.faculty:id,name',
            'studentProfile.department:id,name',
            'studentProfile.studentCourses',
        ]);

        $user->loadCount(['practiceSessions', 'studentNotes', 'contentSubmissions']);

        $profile = $user->studentProfile;

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'role_label' => $user->role->label(),
                'role_description' => $user->role->description(),
                'is_active' => $user->is_active,
                'last_login_at' => $user->last_login_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
                'practice_sessions_count' => $user->practice_sessions_count,
                'student_notes_count' => $user->student_notes_count,
                'content_submissions_count' => $user->content_submissions_count,
                'student_profile' => $profile ? [
                    'id' => $profile->id,
                    'level' => $profile->level,
                    'matric_number' => $profile->matric_number,
                    'institution' => $profile->institution ? [
                        'id' => $profile->institution->id,
                        'name' => $profile->institution->name,
                        'abbreviation' => $profile->institution->abbreviation,
                    ] : null,
                    'faculty' => $profile->faculty ? [
                        'id' => $profile->faculty->id,
                        'name' => $profile->faculty->name,
                    ] : null,
                    'department' => $profile->department ? [
                        'id' => $profile->department->id,
                        'name' => $profile->department->name,
                    ] : null,
                    'student_courses' => $profile->studentCourses->map(fn ($sc) => ['id' => $sc->id]),
                ] : null,
            ],
        ]);
    }

    public function edit(User $user): Response
    {
        Gate::authorize('update', $user);

        return Inertia::render('admin/users/edit', [
            'user' => $user->only('id', 'name', 'email', 'role', 'is_active'),
            'roles' => UserRole::toSelectOptions(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('update', $user);

        $data = $request->validated();
        $isRoleChanging = $data['role'] !== $user->role->value;

        if ($isRoleChanging && $user->id === $request->user()->id) {
            abort(403, 'You cannot change your own role.');
        }

        if ($isRoleChanging && ! $request->user()->role->hasPermission('manage_roles')) {
            abort(403, 'You do not have permission to change user roles.');
        }

        $user->update($data);

        return to_route('admin.users.index')->with('success', 'User updated successfully.');
    }
}
