<?php

namespace App\ContentStudio\Prompts;

class AnswerPlanPrompt extends ContentPromptTemplate
{
    public function promptType(): string
    {
        return 'answer_plan';
    }

    public function temperature(): float
    {
        return 0.3;
    }

    public function maxTokens(): int
    {
        return 1024;
    }

    public function systemPrompt(): string
    {
        return <<<'SYSTEM'
You are an educational content expert for Skoolpad, a Nigerian academic platform. Your task is to outline an answer plan — NOT write the full answer. Output ONLY valid JSON matching the schema specified in the user prompt.
SYSTEM;
    }

    public function userPrompt(array $context): string
    {
        $depth = $context['depth'];
        $depthLabel = $context['depth_label'];
        $questionType = $context['question_type'];
        $stem = $context['stem'];
        $responseConfig = $context['response_config'] ?? null;
        $marks = $context['marks'] ?? null;
        $difficulty = $context['difficulty'] ?? 'intermediate';
        $bloom = $context['bloom'] ?? 'understand';
        $courseName = $context['course_name'] ?? '';
        $priorDepths = $context['prior_depths'] ?? [];

        $configText = $responseConfig ? json_encode($responseConfig, JSON_PRETTY_PRINT) : '(none)';
        $marksText = $marks ? "{$marks} marks" : '(unspecified)';

        $priorText = '';
        foreach ($priorDepths as $priorDepth => $priorContent) {
            $priorText .= "\n{$priorDepth}: {$priorContent}";
        }

        $depthGuidance = match ($depth) {
            'quick' => '1–2 sentence direct answer. No explanation.',
            'standard' => 'Step-by-step explanation with reasoning (~200 words). Can reference Quick answer.',
            'deep_dive' => 'Comprehensive treatment with derivations, edge cases, and references (>500 words). Builds on Standard answer.',
        };

        $illustrationGuidance = match ($depth) {
            'quick' => 'No illustrations needed.',
            'standard' => 'Include one clarifying diagram only if the concept is spatial or procedural.',
            'deep_dive' => 'Include comparison diagrams, flow charts, or decision trees where they aid understanding.',
        };

        return <<<TEXT
Plan a {$depthLabel} answer for the following question.

QUESTION
Type: {$questionType}
Course: {$courseName}
Difficulty: {$difficulty} | Bloom: {$bloom} | Marks: {$marksText}
Stem: {$stem}
Response config: {$configText}

DEPTH GUIDANCE
{$depthGuidance}

ILLUSTRATION GUIDANCE
{$illustrationGuidance}
{$priorText}

Return a JSON object with this exact schema:
{
  "prose_outline": ["string — one bullet per prose section, max 6 bullets"],
  "illustration_briefs": [{"type": "string (diagram|chart|table|none)", "description": "string"}],
  "estimated_tokens": <integer>,
  "estimated_seconds": <integer>
}

Return ONLY the JSON. No other text.
TEXT;
    }

    public function jsonSchema(): array
    {
        return [
            'prose_outline' => ['required', 'array', 'min:1'],
            'prose_outline.*' => ['required', 'string'],
            'illustration_briefs' => ['required', 'array'],
            'illustration_briefs.*.type' => ['required', 'string'],
            'illustration_briefs.*.description' => ['required', 'string'],
            'estimated_tokens' => ['required', 'integer'],
            'estimated_seconds' => ['required', 'integer'],
        ];
    }
}
