<?php

namespace App\Jobs;

use App\Enums\AnswerDepthLevel;
use App\Events\AnswerGenerationUpdate;
use App\Models\Question;
use App\Services\Admin\AnswerGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunAnswerGeneration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 1;

    public function __construct(
        public readonly Question $question,
        public readonly AnswerDepthLevel $depth,
        public readonly string $jobId,
        public readonly array $proseOutline = [],
    ) {}

    public function handle(\Illuminate\Contracts\Container\Container $container): void
    {
        $service = $container->make(AnswerGenerationService::class);

        $this->broadcastUpdate('status', ['message' => "Generating {$this->depth->label()} answer..."]);

        try {
            $logId = $service->generate($this->question, $this->depth, $this->proseOutline);

            $this->broadcastUpdate('complete', [
                'generation_log_id' => $logId,
                'depth' => $this->depth->value,
            ]);
        } catch (\DomainException $e) {
            Log::warning('Answer generation failed', [
                'question_id' => $this->question->id,
                'depth' => $this->depth->value,
                'error' => $e->getMessage(),
            ]);

            $this->broadcastUpdate('error', ['message' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error('Unexpected answer generation error', [
                'question_id' => $this->question->id,
                'depth' => $this->depth->value,
                'exception' => $e,
            ]);

            $this->broadcastUpdate('error', ['message' => 'Unexpected error during answer generation.']);

            throw $e;
        }
    }

    private function broadcastUpdate(string $type, array $extra = []): void
    {
        broadcast(new AnswerGenerationUpdate(
            questionId: $this->question->id,
            jobId: $this->jobId,
            type: $type,
            data: array_merge([
                'question_id' => $this->question->id,
                'depth' => $this->depth->value,
            ], $extra),
        ));
    }
}
