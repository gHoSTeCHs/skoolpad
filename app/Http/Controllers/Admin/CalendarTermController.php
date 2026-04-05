<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveCalendarTermRequest;
use App\Models\CalendarTerm;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;

class CalendarTermController extends Controller
{
    public function store(SaveCalendarTermRequest $request, Institution $institution): RedirectResponse
    {
        $institution->calendarTerms()->create($request->validated());

        return back()->with('success', 'Calendar term created.');
    }

    public function update(SaveCalendarTermRequest $request, CalendarTerm $calendarTerm): RedirectResponse
    {
        $calendarTerm->update($request->validated());

        return back()->with('success', 'Calendar term updated.');
    }

    public function destroy(CalendarTerm $calendarTerm): RedirectResponse
    {
        $calendarTerm->delete();

        return back()->with('success', 'Calendar term deleted.');
    }
}
