<?php

namespace App\Http\Controllers\Student;

use App\Enums\ParentChildLinkStatus;
use App\Http\Controllers\Controller;
use App\Models\ParentChildLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ParentInvitationController extends Controller
{
    public function dismiss(Request $request): RedirectResponse
    {
        $profile = $request->user()->studentProfile;
        $profile->update(['parent_invite_dismissed_at' => now()]);

        return redirect()->back();
    }

    public function send(Request $request): RedirectResponse
    {
        $request->validate([
            'parent_email' => ['required', 'email', 'max:255'],
        ]);

        $profile = $request->user()->studentProfile;

        ParentChildLink::create([
            'student_profile_id' => $profile->id,
            'status' => ParentChildLinkStatus::Pending,
        ]);

        return redirect()->back();
    }
}
