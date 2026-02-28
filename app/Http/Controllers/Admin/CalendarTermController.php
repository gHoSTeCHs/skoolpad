<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CalendarTerm;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CalendarTermController extends Controller
{
    public function store(Request $request, Institution $institution): RedirectResponse
    {
        $data = $request->validate([
            'academic_year' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'sort_order' => ['required', 'integer', 'min:1'],
        ]);

        $institution->calendarTerms()->create($data);

        return back()->with('success', 'Calendar term created.');
    }

    public function update(Request $request, CalendarTerm $calendarTerm): RedirectResponse
    {
        $data = $request->validate([
            'academic_year' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'sort_order' => ['required', 'integer', 'min:1'],
        ]);

        $calendarTerm->update($data);

        return back()->with('success', 'Calendar term updated.');
    }

    public function destroy(CalendarTerm $calendarTerm): RedirectResponse
    {
        $calendarTerm->delete();

        return back()->with('success', 'Calendar term deleted.');
    }
}
