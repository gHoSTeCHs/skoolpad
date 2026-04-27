<?php

namespace App\ContentStudio\Prompts;

class SchemeOfWorkPrompt extends ContentPromptTemplate
{
    public function promptType(): string
    {
        return 'scheme';
    }

    public function temperature(): float
    {
        return config('content-studio.temperature.scheme', 0.3);
    }

    public function systemPrompt(): string
    {
        return <<<'PROMPT'
You are a Nigerian secondary school curriculum planner for Skoolpad. Your job is to allocate topics across terms and weeks following NERDC scheme of work conventions. You must output ONLY valid JSON matching the schema below.

CRITICAL RULES:
1. Use ONLY the topics provided in the input. Do NOT add, remove, rename, or reorder topics beyond what is specified.
2. Nigerian school terms typically have 10-11 instructional weeks after excluding exam weeks and mid-term break.
3. Complex topics (more sub-topics, higher difficulty) should be allocated more weeks. Simple introductory topics can share a week.
4. A topic can span multiple weeks if complex. Mark this with week_start and week_end.
5. Two light topics can share one week. Mark both with the same week number.
6. Total hours across all weeks in a term should roughly match the standard subject allocation (3-5 periods per week, ~40-45 minutes each, for 10-11 weeks = 30-55 teaching hours per term).
7. Term 1 usually has the most weeks (10-11). Term 3 usually has the fewest (9-10).
8. Every topic from the input MUST appear in the output. Count to verify.
PROMPT;
    }

    public function userPrompt(array $context): string
    {
        $educationLevel = $context['education_level'];
        $subjectName = $context['subject_name'];
        $topicsJson = json_encode($context['topics'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $termsCount = $context['terms_count'];
        $weeksPerTerm = $context['weeks_per_term'];
        $periodsPerWeek = $context['periods_per_week'] ?? 4;
        $minutesPerPeriod = $context['minutes_per_period'] ?? 40;

        $termLines = '';
        for ($i = 1; $i <= $termsCount; $i++) {
            $termLines .= "- Term {$i}: {$weeksPerTerm} instructional weeks\n";
        }

        return <<<PROMPT
Allocate the following {$subjectName} topics for {$educationLevel} across {$termsCount} terms:

TOPICS (in suggested teaching order):
{$topicsJson}

School calendar:
{$termLines}- Periods per week: {$periodsPerWeek} (each ~{$minutesPerPeriod} minutes)

Return JSON:
{
    "education_level": "string",
    "subject": "string",
    "terms": [
        {
            "term_number": "integer",
            "instructional_weeks": "integer",
            "topics": [
                {
                    "title": "string — exact topic title from input, unchanged",
                    "week_start": "integer — first week this topic is taught",
                    "week_end": "integer — last week (same as week_start if single week)",
                    "periods": "integer — total teaching periods allocated",
                    "notes": "string or null — any scheduling note (e.g., 'includes practical session')"
                }
            ],
            "total_periods": "integer — sum of all periods in this term"
        }
    ],
    "total_topics_allocated": "integer — MUST equal the number of input topics"
}

CONSTRAINT CHECKLIST:
1. Every input topic appears exactly once in the output
2. No week number exceeds the instructional_weeks for its term
3. Week numbers within each term are sequential (no gaps)
4. total_topics_allocated matches the input count
5. No topic title has been changed from the input

VERIFY before returning: Count the topics in your output and compare to the input count. They MUST match.
PROMPT;
    }

    public function normalize(array $data): array
    {
        if (! isset($data['terms']) || ! is_array($data['terms'])) {
            return $data;
        }

        $totalTopics = 0;

        $data['terms'] = array_map(function (array $term) use (&$totalTopics) {
            $topics = is_array($term['topics'] ?? null) ? $term['topics'] : [];
            $totalTopics += count($topics);

            if (! isset($term['total_periods'])) {
                $term['total_periods'] = (int) array_sum(array_column($topics, 'periods'));
            }

            return $term;
        }, $data['terms']);

        if (! isset($data['total_topics_allocated'])) {
            $data['total_topics_allocated'] = $totalTopics;
        }

        return $data;
    }

    public function jsonSchema(): array
    {
        return [
            'education_level' => ['required', 'string'],
            'subject' => ['required', 'string'],
            'terms' => ['required', 'array', 'min:1'],
            'terms.*.term_number' => ['required', 'integer', 'min:1'],
            'terms.*.instructional_weeks' => ['required', 'integer', 'min:1'],
            'terms.*.topics' => ['required', 'array'],
            'terms.*.topics.*.title' => ['required', 'string', 'max:500'],
            'terms.*.topics.*.week_start' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.week_end' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.periods' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.notes' => ['nullable', 'string'],
            'terms.*.total_periods' => ['required', 'integer', 'min:0'],
            'total_topics_allocated' => ['required', 'integer', 'min:1'],
        ];
    }
}
