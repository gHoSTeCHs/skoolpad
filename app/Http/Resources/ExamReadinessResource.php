<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamReadinessResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'subject_name' => $this->levelSubject?->curriculumSubject?->name,
            'composite_score' => (float) $this->composite_score,
        ];
    }
}
