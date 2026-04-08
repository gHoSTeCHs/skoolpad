<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mode' => $this->mode->value,
            'mode_label' => $this->mode->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'education_level' => $this->whenLoaded('educationLevel', fn () => [
                'id' => $this->educationLevel->id,
                'name' => $this->educationLevel->display_name ?? $this->educationLevel->name,
            ]),
            'curriculum_subject' => $this->whenLoaded('curriculumSubject', fn () => [
                'id' => $this->curriculumSubject->id,
                'name' => $this->curriculumSubject->name,
            ]),
            'discipline' => $this->whenLoaded('discipline', fn () => [
                'id' => $this->discipline->id,
                'name' => $this->discipline->name,
            ]),
            'created_by' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'progress_data' => $this->progress_data,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
