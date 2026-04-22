<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentGenerationUpdate implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  'status'|'complete'|'error'  $type
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public readonly string $projectId,
        public readonly string $jobId,
        public readonly string $type,
        public readonly array $data,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("content-studio.{$this->projectId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ContentGenerationUpdate';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'job_id' => $this->jobId,
            'type' => $this->type,
            'data' => $this->data,
        ];
    }
}
