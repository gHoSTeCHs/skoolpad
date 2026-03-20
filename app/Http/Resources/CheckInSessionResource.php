<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CheckInSessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_date' => $this->session_date->toDateString(),
            'duration_minutes' => $this->duration_minutes,
            'items' => $this->items,
            'completed_items' => $this->completed_items ?? [],
            'status' => $this->status->value,
            'started_at' => $this->started_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
        ];
    }
}
