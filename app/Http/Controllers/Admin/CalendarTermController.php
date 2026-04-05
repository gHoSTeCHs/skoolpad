<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveCalendarTermRequest;
use App\Models\CalendarTerm;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class CalendarTermController extends Controller
{
    public function store(SaveCalendarTermRequest $request, Institution $institution): RedirectResponse
    {
        Gate::authorize('create', Institution::class);

        $institution->calendarTerms()->create($request->validated());

        return back()->with('success', 'Calendar term created.');
    }

    public function update(SaveCalendarTermRequest $request, CalendarTerm $calendarTerm): RedirectResponse
    {
        Gate::authorize('update', Institution::class);

        $calendarTerm->update($request->validated());

        return back()->with('success', 'Calendar term updated.');
    }

    public function destroy(CalendarTerm $calendarTerm): RedirectResponse
    {
        Gate::authorize('delete', Institution::class);

        $calendarTerm->delete();

        return back()->with('success', 'Calendar term deleted.');
    }
}
