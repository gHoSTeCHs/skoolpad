<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\Paginates;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInstitutionRequest;
use App\Http\Requests\Admin\UpdateInstitutionRequest;
use App\Models\Country;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionController extends Controller
{
    use Paginates;

    public function index(Request $request): Response
    {
        $institutions = Institution::query()
            ->withCount('faculties')
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('abbreviation', 'ilike', "%{$search}%");
                });
            })
            ->when($request->filled('institution_type'), function ($query) use ($request) {
                $query->where('institution_type', $request->string('institution_type'));
            })
            ->when($request->filled('ownership_type'), function ($query) use ($request) {
                $query->where('ownership_type', $request->string('ownership_type'));
            })
            ->when($request->filled('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->tap(fn ($query) => $this->applySorting($query, $request, ['name', 'institution_type', 'ownership_type', 'state', 'is_active', 'faculties_count']))
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/institutions/index', [
            'institutions' => $this->paginated($institutions),
            'filters' => $request->only(['search', 'institution_type', 'ownership_type', 'is_active', 'sort', 'direction']),
            'institutionTypes' => InstitutionType::cases(),
            'ownershipTypes' => OwnershipType::cases(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/institutions/create', [
            'institutionTypes' => InstitutionType::cases(),
            'ownershipTypes' => OwnershipType::cases(),
            'countries' => Country::all(),
        ]);
    }

    public function store(StoreInstitutionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('logos/institutions', 's3');
        }
        unset($data['logo']);

        Institution::create($data);

        return to_route('admin.institutions.index')->with('success', 'Institution created successfully.');
    }

    public function edit(Institution $institution): Response
    {
        return Inertia::render('admin/institutions/edit', [
            'institution' => $institution,
            'institutionTypes' => InstitutionType::cases(),
            'ownershipTypes' => OwnershipType::cases(),
            'countries' => Country::all(),
        ]);
    }

    public function update(UpdateInstitutionRequest $request, Institution $institution): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($institution->logo_path) {
                Storage::disk('s3')->delete($institution->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('logos/institutions', 's3');
        }
        unset($data['logo']);

        $institution->update($data);

        return to_route('admin.institutions.index')->with('success', 'Institution updated successfully.');
    }
}
