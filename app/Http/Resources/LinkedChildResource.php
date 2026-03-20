<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LinkedChildResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_profile_id' => $this->parent_profile_id,
            'student_profile_id' => $this->student_profile_id,
            'status' => $this->status->value,
            'study_goal_minutes' => $this->study_goal_minutes,
            'student_profile' => $this->whenLoaded('studentProfile', fn () => [
                'id' => $this->studentProfile->id,
                'user' => [
                    'id' => $this->studentProfile->user->id,
                    'name' => $this->studentProfile->user->name,
                ],
            ]),
        ];
    }
}
