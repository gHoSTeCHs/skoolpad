<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentDashboardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'children' => LinkedChildResource::collection($this->resource['children']),
            'subscription_status' => $this->resource['subscription_status'],
            'check_in' => $this->resource['check_in']
                ? new CheckInSessionResource($this->resource['check_in'])
                : null,
            'readiness_scores' => ExamReadinessResource::collection(
                $this->resource['readiness_scores']
            ),
        ];
    }
}
