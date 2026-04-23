<?php

namespace App\ContentStudio\Prompts;

class CurriculumParserPrompt extends ContentPromptTemplate
{
    public function promptType(): string
    {
        return 'research';
    }

    public function temperature(): float
    {
        return config('content-studio.temperature.research', 0.6);
    }

    public function maxTokens(): int
    {
        return 16384;
    }

    public function systemPrompt(): string
    {
        return <<<'PROMPT'
You are a curriculum analysis assistant for Skoolpad, a Nigerian educational platform. Your job is to extract structured topic data from curriculum research documents. You must output ONLY valid JSON matching the schema below. Do not include any text outside the JSON object.

You are parsing a curriculum document for a specific education level and subject. Extract every topic mentioned, organized by term, with sub-topics and metadata.

CRITICAL RULES:
1. Extract ONLY topics explicitly mentioned in the document. Do NOT add topics from your own knowledge.
2. If the document mentions a topic but provides no sub-topics, set sub_topics to an empty array.
3. If the document does not specify a term for a topic, set term to null.
4. If the document does not specify hours, set hours to null.
5. Preserve the exact topic names as written in the document. Do not rephrase or "improve" them.
6. If the document contains conflicting information (e.g., a topic listed under two different terms), include it under the FIRST occurrence and add a note in the conflicts array.
7. Count carefully. The total number of topics in your output MUST match the number of distinct topics in the document. If the document says "33 topics" and you extract 31, you are missing topics — re-read the document.
PROMPT;
    }

    public function userPrompt(array $context): string
    {
        $educationLevel = $context['education_level'];
        $subjectName = $context['subject_name'];
        $documentContent = $context['document_text'];

        return <<<PROMPT
Parse the following curriculum document for: {$educationLevel} {$subjectName}

DOCUMENT:
---
{$documentContent}
---

Extract all topics and return them as JSON matching this exact schema:

{
    "education_level": "string (e.g., 'SS1')",
    "subject": "string (e.g., 'Physics')",
    "total_topics_found": "integer — count of ALL distinct topics extracted",
    "source_confidence": "string — 'high' if document cites NERDC/WAEC directly, 'medium' if from secondary sources, 'low' if inferred",
    "terms": [
        {
            "term_number": "integer (1, 2, or 3)",
            "term_label": "string (e.g., 'First Term')",
            "topics": [
                {
                    "sequence": "integer — position within term, starting at 1",
                    "title": "string — exact topic title from document",
                    "sub_topics": [
                        "string — each sub-topic or concept listed under this topic"
                    ],
                    "estimated_hours": "number or null — teaching hours if mentioned",
                    "practical_component": "boolean — true if document mentions lab/practical work for this topic",
                    "waec_alignment_note": "string or null — any WAEC/NECO alignment note from the document"
                }
            ]
        }
    ],
    "lab_work_summary": "string or null — overall lab/practical requirements if mentioned",
    "conflicts": [
        "string — any conflicting information found in the document"
    ],
    "missing_data": [
        "string — any data the document does not provide (e.g., 'no hours specified', 'Term 3 topics not listed')"
    ]
}

CORRECT EXAMPLE (abbreviated):
{
    "education_level": "SS1",
    "subject": "Physics",
    "total_topics_found": 33,
    "source_confidence": "medium",
    "terms": [
        {
            "term_number": 1,
            "term_label": "First Term",
            "topics": [
                {
                    "sequence": 1,
                    "title": "Introduction to Physics",
                    "sub_topics": ["definition of physics", "branches of physics", "career opportunities"],
                    "estimated_hours": 3,
                    "practical_component": false,
                    "waec_alignment_note": null
                }
            ]
        }
    ],
    "lab_work_summary": "Vernier calipers, micrometer use, density measurement, Hooke's law verification",
    "conflicts": [],
    "missing_data": ["Term 2 hours not specified for individual topics"]
}

WRONG EXAMPLE (do NOT do this):
{
    "education_level": "SS1",
    "subject": "Physics",
    "total_topics_found": 10,
    "terms": [
        {
            "term_number": 1,
            "topics": [
                {
                    "title": "Mechanics and Measurement",
                    "sub_topics": []
                }
            ]
        }
    ]
}
WHY THIS IS WRONG: It groups 12 topics into one called "Mechanics and Measurement" instead of listing each topic individually. It only found 10 topics when the document lists 33. It omits required fields (source_confidence, sequence, estimated_hours, practical_component, waec_alignment_note, lab_work_summary, conflicts, missing_data).

BEFORE RETURNING YOUR RESPONSE, VERIFY:
1. Every topic mentioned in the document appears in your output
2. total_topics_found matches the actual count of topics in your terms array
3. All required fields are present for every topic
4. Topic titles match the document exactly — no rephrasing
5. Your output is valid JSON with no trailing commas or syntax errors
PROMPT;
    }

    public function jsonSchema(): array
    {
        return [
            'education_level' => ['required', 'string'],
            'subject' => ['required', 'string'],
            'total_topics_found' => ['required', 'integer', 'min:1'],
            'source_confidence' => ['required', 'string', 'in:high,medium,low'],
            'terms' => ['required', 'array', 'min:1'],
            'terms.*.term_number' => ['required', 'integer', 'min:1', 'max:4'],
            'terms.*.term_label' => ['required', 'string'],
            'terms.*.topics' => ['required', 'array', 'min:1'],
            'terms.*.topics.*.sequence' => ['required', 'integer', 'min:1'],
            'terms.*.topics.*.title' => ['required', 'string', 'max:500'],
            'terms.*.topics.*.sub_topics' => ['present', 'array'],
            'terms.*.topics.*.sub_topics.*' => ['string'],
            'terms.*.topics.*.estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'terms.*.topics.*.practical_component' => ['required', 'boolean'],
            'terms.*.topics.*.waec_alignment_note' => ['nullable', 'string'],
            'lab_work_summary' => ['nullable', 'string'],
            'conflicts' => ['present', 'array'],
            'conflicts.*' => ['string'],
            'missing_data' => ['present', 'array'],
            'missing_data.*' => ['string'],
        ];
    }
}
