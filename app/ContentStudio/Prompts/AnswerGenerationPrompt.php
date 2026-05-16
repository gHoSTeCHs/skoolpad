<?php

namespace App\ContentStudio\Prompts;

class AnswerGenerationPrompt extends ContentPromptTemplate
{
    public function promptType(): string
    {
        return 'answer_generation';
    }

    public function temperature(): float
    {
        return 0.4;
    }

    public function maxTokens(): int
    {
        return 4096;
    }

    public function systemPrompt(): string
    {
        return <<<'SYSTEM'
You are an educational content expert for Skoolpad, a Nigerian academic platform. Write a complete answer in Tiptap JSON format. Output ONLY valid JSON matching the schema specified in the user prompt.

TIPTAP JSON RULES
- Top-level: { "type": "doc", "content": [ ...block nodes... ] }
- Allowed block nodes: paragraph, heading (level 2 only), bulletList, orderedList, listItem, blockquote, codeBlock, horizontalRule, blockMath, table, tableRow, tableHeader, tableCell
- Allowed inline nodes: text, inlineMath, hardBreak
- Allowed marks on text: bold, italic, underline, strike, code
- KaTeX for math: inline { "type": "inlineMath", "attrs": { "latex": "..." } }, block { "type": "blockMath", "attrs": { "latex": "..." } }
- DO NOT use any node type not listed above

QUALITY RULES
- Use Nigerian context for examples where applicable (cities, currency in Naira, local scenarios)
- Bold each key term only on its first use
- Paragraphs: 2–4 sentences
- Use lists for 3+ related items
- No placeholder text, no "In conclusion", no fluff introductions
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
        $proseOutline = $context['prose_outline'] ?? [];

        $configText = $responseConfig ? json_encode($responseConfig, JSON_PRETTY_PRINT) : '(none)';
        $marksText = $marks ? "{$marks} marks" : '(unspecified)';

        $outlineText = empty($proseOutline)
            ? ''
            : "\nPROSE OUTLINE TO FOLLOW\n".implode("\n", array_map(fn ($b) => "- {$b}", $proseOutline));

        $priorText = '';
        foreach ($priorDepths as $priorDepth => $priorContent) {
            $priorText .= "\n{$priorDepth} ANSWER (already written — build on it, do not repeat it verbatim)\n{$priorContent}\n";
        }

        $wordTarget = match ($depth) {
            'quick' => '50–80',
            'standard' => '180–250',
            'deep_dive' => '500–800',
        };

        return <<<TEXT
Write a {$depthLabel} answer for this question. Target: {$wordTarget} words.

QUESTION
Type: {$questionType}
Course: {$courseName}
Difficulty: {$difficulty} | Bloom: {$bloom} | Marks: {$marksText}
Stem: {$stem}
Response config: {$configText}
{$outlineText}{$priorText}
Return a JSON object with this exact schema:
{
  "content": <Tiptap JSON doc — the answer content>,
  "content_plain": "string — plain text version of the answer",
  "word_count": <integer>
}

Return ONLY the JSON. No other text.
TEXT;
    }

    public function jsonSchema(): array
    {
        return [
            'content' => ['required', 'array'],
            'content.type' => ['required', 'string', 'in:doc'],
            'content.content' => ['required', 'array', 'min:1'],
            'content_plain' => ['required', 'string'],
            'word_count' => ['required', 'integer', 'min:1'],
        ];
    }
}
