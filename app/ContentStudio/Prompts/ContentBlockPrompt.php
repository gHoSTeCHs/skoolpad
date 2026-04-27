<?php

namespace App\ContentStudio\Prompts;

class ContentBlockPrompt extends ContentPromptTemplate
{
    public function promptType(): string
    {
        return 'content';
    }

    public function temperature(): float
    {
        return (float) config('content-studio.temperature.content', 0.5);
    }

    public function maxTokens(): int
    {
        return 8192;
    }

    public function systemPrompt(): string
    {
        return <<<'SYSTEM'
You are an expert educational content writer for Skoolpad, a Nigerian educational platform. You write the content for a single learning block — a 5-10 minute reading unit on one specific concept. You must output ONLY valid JSON matching the schema specified in the user prompt.

CRITICAL RULES FOR CONTENT QUALITY

1. Write for the specified education level. SS1 = age 14-16, clear and concrete. 200-level = more technical.
2. Start with the core concept immediately. No filler intros.
3. Use Nigerian context for examples where applicable (cities, currency in Naira, local scenarios). Avoid US/UK examples unless topic requires them.
4. Bold each key term ONLY on its first appearance in this block.
5. Use KaTeX for math. Inline: { "type": "inlineMath", "attrs": { "latex": "v = d/t" } }. Block: { "type": "blockMath", "attrs": { "latex": "..." } }.
6. Paragraphs are short: 2-4 sentences.
7. Use bullet or numbered lists for 3+ related items.
8. Include at least one concrete example or illustration.
9. Do NOT reference external resources.
10. Do NOT cover concepts the next block will cover (see next_leaf.content_guidance).
11. No placeholder text.
12. End with a 1-2 sentence summary/key takeaway.
13. Total word count should produce a reading time close to estimated_read_time (150 wpm secondary, 200 wpm university).

DRIFT DISCIPLINE — NON-NEGOTIABLE

The user prompt will include a `glossary` of terms and symbols already introduced in earlier blocks of this topic. You MUST honour the following rules:

- If a term is in the glossary, USE IT AS DEFINED. do not redefine it. Reference it by its established form.
- If a symbol is in the glossary for a quantity, USE THAT SYMBOL. Do not introduce an alternative notation for the same quantity.
- The block's `key_terms_introduced` you return must be terms this block ACTUALLY introduces for the first time in this topic, with a definition. Do not list terms the glossary already contains.
- The block's `symbols_used` must be symbols introduced here with their quantity and unit.
- The `summary_sentence` must be a single-sentence summary of what this block establishes, suitable for use as context in the next block's generation.

Tiptap JSON FORMAT

Top-level: { "type": "doc", "content": [ ...block nodes... ] }

Allowed block node types: paragraph, heading (level 2 only), bulletList, orderedList, listItem, blockquote, codeBlock, horizontalRule, blockMath, table, tableRow, tableHeader, tableCell.

Allowed inline node types: text, inlineMath, hardBreak.

Allowed marks (on text): bold, italic, underline, strike, code.

DO NOT USE any node or mark type not listed above. Responses with unknown node types will be rejected and you will be asked to regenerate.
SYSTEM;
    }

    public function userPrompt(array $context): string
    {
        $topic = $context['topic'];
        $block = $context['block'];
        $bread = empty($context['hierarchy_breadcrumbs']) ? '(none — root block)' : implode(' > ', $context['hierarchy_breadcrumbs']);
        $prev = $context['previous_leaf'];
        $next = $context['next_leaf'];
        $glossary = $context['glossary'];
        $priorSummaries = $context['prior_block_summaries'];

        $glossaryText = $this->renderGlossary($glossary);
        $priorText = empty($priorSummaries)
            ? '(none — this is the first leaf block of the topic)'
            : '- '.implode("\n- ", $priorSummaries);

        $prevText = $prev === null
            ? '(none — this is the first leaf block)'
            : "Title: {$prev['title']}\nSummary: {$prev['summary_sentence']}\nCovered: {$prev['content_guidance']}";

        $nextText = $next === null
            ? '(none — this is the last leaf block)'
            : "Title: {$next['title']}\nWill cover: {$next['content_guidance']}";

        $wordTarget = (int) round($block['read_time'] * ($topic['education_level'] === 'university' ? 200 : 150));

        return <<<USER
Write the content for this learning block.

TOPIC
- Title: {$topic['title']}
- Summary: {$topic['summary']}
- Subject: {$topic['subject']}
- Education level: {$topic['education_level']}
- Estimated total minutes for topic: {$topic['estimated_total_minutes']}

BLOCK
- Title: {$block['title']}
- Type: {$block['type']}
- Difficulty: {$block['difficulty']}
- Bloom's level: {$block['bloom']}
- Target read time: {$block['read_time']} min (~{$wordTarget} words)
- Guidance: {$block['guidance']}

HIERARCHY
{$bread}

PRIOR BLOCK SUMMARIES (in order)
{$priorText}

PREVIOUS LEAF BLOCK
{$prevText}

NEXT LEAF BLOCK
{$nextText}

GLOSSARY (terms and symbols already established in this topic)
{$glossaryText}

Return JSON with this exact shape:
{
  "block_title": "string — unchanged from the BLOCK title above",
  "content": { "type": "doc", "content": [ ...Tiptap block nodes... ] },
  "summary_sentence": "string — a single sentence summarising what this block establishes, for use as context in the next block",
  "key_terms_introduced": [ { "term": "string", "definition": "string — 1 sentence" } ],
  "symbols_used": [ { "symbol": "string", "quantity": "string", "unit": "string" } ],
  "formulas_used": [ "string — KaTeX" ],
  "word_count": "integer",
  "nigerian_context_used": "boolean"
}

CONSTRAINTS CHECKLIST — verify before returning:
1. word_count is within 20% of {$wordTarget}.
2. At least one key term is bolded in content.
3. No node or mark types outside the allow-list in the system prompt.
4. key_terms_introduced contains only terms NEW to this topic (not already in GLOSSARY).
5. symbols_used contains only symbols NEW to this topic (not already in GLOSSARY for the same quantity).
6. summary_sentence is non-empty and a single sentence.
7. Content does not cover the NEXT LEAF BLOCK's scope.
8. At least one Nigerian context example unless topic explicitly requires otherwise.
USER;
    }

    public function jsonSchema(): array
    {
        return [
            'block_title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'array'],
            'content.type' => ['required', 'string', 'in:doc'],
            'content.content' => ['required', 'array', 'min:1'],
            'summary_sentence' => ['required', 'string', 'min:1', 'max:1000'],
            'key_terms_introduced' => ['nullable', 'array'],
            'key_terms_introduced.*.term' => ['required', 'string', 'max:255'],
            'key_terms_introduced.*.definition' => ['required', 'string', 'max:1000'],
            'symbols_used' => ['nullable', 'array'],
            'symbols_used.*.symbol' => ['required_with:symbols_used.*.quantity', 'string', 'max:50'],
            'symbols_used.*.quantity' => ['required_with:symbols_used.*.symbol', 'string', 'max:100'],
            'symbols_used.*.unit' => ['required_with:symbols_used.*.symbol', 'string', 'max:50'],
            'formulas_used' => ['nullable', 'array'],
            'formulas_used.*' => ['string', 'max:500'],
            'word_count' => ['required', 'integer', 'min:1'],
            'nigerian_context_used' => ['required', 'boolean'],
        ];
    }

    private function renderGlossary(array $glossary): string
    {
        $lines = [];
        foreach ($glossary['terms'] ?? [] as $t) {
            $lines[] = "- {$t['term']}: {$t['definition']}";
        }
        foreach ($glossary['symbols'] ?? [] as $s) {
            $lines[] = "- symbol {$s['symbol']} = {$s['quantity']} ({$s['unit']})";
        }

        return empty($lines) ? '(empty — this is the first block)' : implode("\n", $lines);
    }
}
