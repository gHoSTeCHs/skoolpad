<?php

namespace App\Services\Admin;

use App\ContentStudio\Prompts\AnswerGenerationPrompt;
use App\ContentStudio\Prompts\AnswerPlanPrompt;
use App\Enums\AnswerDepthLevel;
use App\Models\AIGenerationLog;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Services\ContentGenerationService;
use Illuminate\Support\Facades\DB;

class AnswerGenerationService
{
    public function __construct(
        private readonly ContentGenerationService $generation,
    ) {}

    /** @return array{prose_outline: string[], illustration_briefs: array<int, array{type: string, description: string}>, estimated_tokens: int, estimated_seconds: int} */
    public function plan(Question $question, AnswerDepthLevel $depth): array
    {
        $question->loadMissing(['institutionCourse:id,course_code,course_title', 'answers']);

        $context = $this->buildContext($question, $depth);

        $model = $this->generation->resolveModel(taskType: 'answers');
        $adapter = $this->generation->resolveAdapter($model);
        $prompt = (new AnswerPlanPrompt)->build($context);

        $response = $adapter->generate($prompt);

        if (! $response->valid) {
            throw new \DomainException(
                'Answer plan generation failed: '.json_encode($response->validation_errors)
            );
        }

        $this->writeLog($model, $prompt, $response, $question);

        return $response->data;
    }

    public function generate(Question $question, AnswerDepthLevel $depth, array $proseOutline = []): string
    {
        $question->loadMissing(['institutionCourse:id,course_code,course_title', 'answers']);

        $context = $this->buildContext($question, $depth);
        $context['prose_outline'] = $proseOutline;

        $model = $this->generation->resolveModel(taskType: 'answers');
        $adapter = $this->generation->resolveAdapter($model);
        $prompt = (new AnswerGenerationPrompt)->build($context);

        $response = $adapter->generate($prompt);

        if (! $response->valid) {
            $response = $this->retryWithCorrection($adapter, $prompt, $response);
        }

        if (! $response->valid) {
            throw new \DomainException(
                'Answer generation failed after retry: '.json_encode($response->validation_errors)
            );
        }

        $this->assertNotHollow($response->data);

        $data = $response->data;

        DB::transaction(function () use ($question, $depth, $data) {
            $existing = QuestionAnswer::query()
                ->where('question_id', $question->id)
                ->where('depth_level', $depth)
                ->first();

            if ($existing) {
                $existing->update([
                    'content' => $data['content'],
                    'content_plain' => $data['content_plain'],
                ]);
            } else {
                QuestionAnswer::query()->create([
                    'question_id' => $question->id,
                    'depth_level' => $depth->value,
                    'content' => $data['content'],
                    'content_plain' => $data['content_plain'],
                    'is_published' => false,
                ]);
            }
        });

        $log = $this->writeLog($model, $prompt, $response, $question);

        return $log->id;
    }

    private function buildContext(Question $question, AnswerDepthLevel $depth): array
    {
        $course = $question->institutionCourse;
        $answers = $question->answers ?? collect();

        $priorDepths = [];
        foreach (AnswerDepthLevel::cases() as $prior) {
            if ($prior === $depth) {
                break;
            }
            $answer = $answers->first(fn ($a) => $a->depth_level === $prior);
            if ($answer && filled($answer->content_plain)) {
                $priorDepths[$prior->label()] = mb_substr($answer->content_plain, 0, 600);
            }
        }

        return [
            'depth' => $depth->value,
            'depth_label' => $depth->label(),
            'question_type' => $question->question_type->value,
            'stem' => $question->content,
            'response_config' => $question->response_config,
            'marks' => $question->marks,
            'difficulty' => $question->difficulty_level?->value,
            'bloom' => $question->bloom_level?->value,
            'course_name' => $course ? "{$course->course_code} — {$course->course_title}" : '',
            'prior_depths' => $priorDepths,
            'prose_outline' => [],
        ];
    }

    private function assertNotHollow(array $data): void
    {
        $claimedWordCount = (int) ($data['word_count'] ?? 0);
        if ($claimedWordCount === 0) {
            return;
        }

        $actualLength = $this->tiptapTextLength($data['content'] ?? []);
        if ($actualLength < $claimedWordCount) {
            throw new \DomainException(
                "AI returned hollow content: claimed {$claimedWordCount} words but Tiptap document contains only {$actualLength} characters."
            );
        }
    }

    private function retryWithCorrection(
        \App\ContentStudio\ContentAIProvider $adapter,
        \App\DataTransferObjects\ContentPrompt $originalPrompt,
        \App\DataTransferObjects\ContentResponse $failed,
    ): \App\DataTransferObjects\ContentResponse {
        $errorSummary = collect($failed->validation_errors)
            ->map(fn ($errors, $field) => is_array($errors)
                ? "{$field}: ".implode(', ', $errors)
                : "{$field}: {$errors}"
            )
            ->implode("\n");

        $correctionText = "---\nYour previous response had these validation errors:\n{$errorSummary}\n\n"
            ."Fix only these errors and return the corrected JSON. All other fields must remain unchanged.\n\n"
            ."Your previous response:\n{$failed->raw_response}";

        $correctedPrompt = new \App\DataTransferObjects\ContentPrompt(
            system_prompt: $originalPrompt->system_prompt,
            user_prompt: $originalPrompt->user_prompt."\n\n".$correctionText,
            json_schema: $originalPrompt->json_schema,
            temperature: $originalPrompt->temperature,
            max_tokens: $originalPrompt->max_tokens,
            context: $originalPrompt->context,
        );

        return $adapter->generate($correctedPrompt);
    }

    private function writeLog(
        \App\Models\AIModel $model,
        \App\DataTransferObjects\ContentPrompt $prompt,
        \App\DataTransferObjects\ContentResponse $response,
        Question $question,
    ): AIGenerationLog {
        $inputCost = ($response->input_tokens / 1_000_000) * $model->input_cost_per_million;
        $outputCost = ($response->output_tokens / 1_000_000) * $model->output_cost_per_million;

        return AIGenerationLog::query()->create([
            'content_project_id' => null,
            'question_id' => $question->id,
            'ai_model_id' => $model->id,
            'prompt_type' => $prompt->context['depth'] ?? 'answer',
            'system_prompt' => $prompt->system_prompt,
            'user_prompt' => $prompt->user_prompt,
            'raw_response' => $response->raw_response,
            'parsed_data' => $response->valid ? $response->data : null,
            'is_valid' => $response->valid,
            'validation_errors' => $response->valid ? null : $response->validation_errors,
            'model_used' => $response->model_used,
            'provider' => $model->provider->adapter_type->value,
            'tokens_used' => $response->tokens_used,
            'input_tokens' => $response->input_tokens,
            'output_tokens' => $response->output_tokens,
            'generation_time_ms' => (int) $response->generation_time_ms,
            'estimated_cost_cents' => (int) round($inputCost + $outputCost),
        ]);
    }

    private static function tiptapTextLength(array $node): int
    {
        $length = 0;
        if (($node['type'] ?? '') === 'text' && isset($node['text'])) {
            $length += mb_strlen($node['text']);
        }
        foreach ($node['content'] ?? [] as $child) {
            $length += self::tiptapTextLength($child);
        }

        return $length;
    }
}
