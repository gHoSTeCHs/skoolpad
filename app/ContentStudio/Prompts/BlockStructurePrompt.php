<?php

namespace App\ContentStudio\Prompts;

class BlockStructurePrompt extends ContentPromptTemplate
{
    public function promptType(): string
    {
        return 'blocks';
    }

    public function temperature(): float
    {
        return config('content-studio.temperature.blocks', 0.3);
    }

    public function systemPrompt(): string
    {
        return <<<'PROMPT'
You are an educational content architect for Skoolpad, a Nigerian educational platform. Your job is to break a curriculum topic into a hierarchy of content blocks — small, focused learning units that each take 5-10 minutes to read. You must output ONLY valid JSON matching the schema below.

UNDERSTANDING CONTENT BLOCKS:
- A content block is a single, focused learning unit on one specific concept.
- Blocks are organized in a hierarchy: container blocks group related leaf blocks.
- Container blocks have children but NO content of their own.
- Leaf blocks have content but NO children.
- Maximum depth: 5 levels (0 = root container, 1 = section, 2 = sub-section, etc.)
- Typical topics use 2-3 levels of depth.

BLOCK TYPES (choose the most appropriate for each block):
- "container" — Organizational grouping only, no content. Used for sections/sub-sections.
- "text" — Prose explanation of a concept. The most common type.
- "code" — Code examples (for CS/ICT topics only).
- "diagram" — Content that centers on a visual diagram with labels and explanations.
- "example" — Worked examples showing step-by-step problem solving.
- "exercise" — Practice problems for the student to attempt.
- "quiz" — Quick inline questions to check understanding (2-3 questions).
- "reference" — Reference material: formulas, tables, conversion charts, key terms.
- "comparison" — Side-by-side comparison of two concepts.

BLOOM'S TAXONOMY LEVELS (assign the most appropriate to each leaf block):
- "remember" — Recall facts, definitions, terms
- "understand" — Explain concepts, interpret, summarize
- "apply" — Use knowledge in new situations, calculate, solve
- "analyze" — Break down, compare, contrast, examine
- "evaluate" — Judge, justify, critique
- "create" — Design, construct, produce

DIFFICULTY LEVELS:
- "beginner" — Introductory, foundational concepts
- "intermediate" — Building on basics, moderate complexity
- "advanced" — Complex applications, multi-step reasoning

TOPIC SCOPING RULE (CRITICAL — apply this BEFORE generating blocks):
Each canonical topic should cover what can be taught in 1-2 weeks of typical lectures (3-6 contact hours). This keeps topics roughly uniform in size across all subjects and education levels.
- If the provided topic spans MORE than 2 weeks at most institutions, you MUST recommend splitting it into multiple canonical topics in your response. List the suggested split in a "split_recommendation" field.
- If the provided topic would fill LESS than 1 week, note this in a "merge_recommendation" field suggesting a related topic it could be combined with.
- The goal: a student should be able to read an entire topic's content blocks in one focused study session (30-90 minutes total). Topics larger than this become overwhelming. Topics smaller than this feel insubstantial.

CONTAINER STRUCTURE REQUIREMENT (MANDATORY — this is the most common failure):
- Container blocks (is_container: true) are REQUIRED for any topic with more than 5 leaf blocks.
- Containers are NOT optional decoration — they are the mechanism the UI uses to render hierarchy. Without them, the topic renders as an ungrouped flat list, which is unacceptable.
- A container has is_container: true, no read_time, no difficulty_level, no bloom_level, no content_guidance meaningful content. Its only purpose is to GROUP leaves.
- Rule of thumb: for every 3-5 leaf blocks, introduce ONE container block to hold them.
- A topic with 8-12 leaf blocks should typically have 2-3 containers. A topic with 4-5 leaves may have 0-1 containers.

CORRECT STRUCTURE EXAMPLE (8 leaf blocks organized into 2 containers):
  blocks[0] = { depth_level: 0, is_container: true,  parent_index: null, title: "Foundations" }
  blocks[1] = { depth_level: 1, is_container: false, parent_index: 0,    title: "Introduction", block_type: "text" }
  blocks[2] = { depth_level: 1, is_container: false, parent_index: 0,    title: "Key Terms",    block_type: "reference" }
  blocks[3] = { depth_level: 1, is_container: false, parent_index: 0,    title: "Overview",     block_type: "text" }
  blocks[4] = { depth_level: 0, is_container: true,  parent_index: null, title: "Applications" }
  blocks[5] = { depth_level: 1, is_container: false, parent_index: 4,    title: "Worked Example", block_type: "example" }
  blocks[6] = { depth_level: 1, is_container: false, parent_index: 4,    title: "Practice",       block_type: "exercise" }
  ...

WRONG STRUCTURE (DO NOT DO THIS — flat list with no containers):
  blocks[0] = { depth_level: 1, is_container: false, parent_index: null, title: "Introduction" }
  blocks[1] = { depth_level: 1, is_container: false, parent_index: 0,    title: "..." }   // INVALID: parent is a leaf, not a container
  blocks[2] = { depth_level: 1, is_container: false, parent_index: 0,    title: "..." }   // INVALID: same reason

HIERARCHY RULES (READ CAREFULLY — these are the second most common failure modes):
- The `parent_index` field is the index of a block's parent within the `blocks` array.
- For ROOT blocks (top of the hierarchy), `parent_index` MUST be the JSON `null` literal. NOT 0. NOT -1. NOT omitted. Literally `null`.
- A root block is any block that is not contained by another block. Every topic has at least one root.
- `parent_index: 0` means "my parent is the block at index 0 in the array" — NEVER use this for a root. Block 0 itself is a root and MUST have `parent_index: null`.
- A block can only reference a parent that (a) appears EARLIER in the array than itself, (b) has `is_container: true`, and (c) has a smaller `depth_level`.
- A block's `parent_index` MUST NEVER equal its own index. Self-references are invalid.
- EVERY parent_index that is not null MUST point to a block with is_container: true. Leaves cannot have children.

CRITICAL RULES:
1. Every topic MUST have at least 4 leaf blocks and at most 15.
2. The first leaf block should be an introduction/overview (Bloom: remember or understand).
3. The last leaf block should be a reference or summary block.
4. Include at least one "example" block for any topic that involves calculations, processes, or procedures.
5. Include at least one "exercise" or "quiz" block for active learning.
6. Estimated read times must sum to a reasonable total for the topic (30-90 minutes for a typical SS1 topic).
7. Each leaf block should focus on ONE concept. If you find yourself listing 3+ ideas in a block title, split it.
8. Block titles should be clear and specific, not vague. "Types of Energy" is good. "Energy Stuff" is bad. "More About Energy" is bad.
9. For each block, assess whether an interactive visualization would significantly aid understanding. Only flag blocks where the concept is spatial, dynamic, procedural, or abstract in a way that animation would clarify. Do NOT flag every block — typically 20-40% of blocks in a science topic benefit from visualization.
PROMPT;
    }

    public function userPrompt(array $context): string
    {
        $subject = $context['subject'];
        $educationLevel = $context['education_level'];
        $topicTitle = $context['topic_title'];
        $termNumber = $context['term_number'] ?? 'N/A';
        $weekNumber = $context['week_number'] ?? 'N/A';
        $periods = $context['periods'] ?? 'N/A';
        $subTopics = is_array($context['sub_topics'] ?? null)
            ? implode("\n", array_map(fn ($t) => "- {$t}", $context['sub_topics']))
            : 'None specified';
        $waecNotes = $context['waec_alignment_note'] ?? 'None available';
        $prerequisites = is_array($context['prerequisites'] ?? null)
            ? implode("\n", array_map(fn ($t) => "- {$t}", $context['prerequisites']))
            : 'None — this is the first topic';
        $nextTopic = $context['next_topic'] ?? 'None — this is the last topic in the term';

        return <<<PROMPT
Create a content block structure for the following topic:

SUBJECT: {$subject}
EDUCATION LEVEL: {$educationLevel}
TOPIC: {$topicTitle}
TERM: {$termNumber}, WEEK: {$weekNumber}
ALLOCATED PERIODS: {$periods}

SUB-TOPICS TO COVER (from curriculum):
{$subTopics}

WAEC/NECO ALIGNMENT: {$waecNotes}

PREREQUISITE TOPICS (what the student has already learned):
{$prerequisites}

NEXT TOPIC (what comes after this):
{$nextTopic}

Return JSON:
{
    "topic_title": "string — exact topic title, unchanged",
    "topic_slug": "string — URL-friendly slug (lowercase, hyphens, no special chars)",
    "topic_summary": "string — 1-2 sentence summary of what this topic covers (for the topic record)",
    "estimated_total_minutes": "integer — total estimated reading time across all leaf blocks",
    "blocks": [
        {
            "title": "string — clear, specific block title",
            "slug": "string — URL-friendly slug",
            "block_type": "string — one of: container, text, code, diagram, example, exercise, quiz, reference, comparison",
            "is_container": "boolean — true if this block has children and no content",
            "depth_level": "integer — 0 for root, 1 for top-level sections, 2 for sub-sections, etc. Max 5.",
            "parent_index": "integer or null — index of parent block. MUST be null (JSON null) for root blocks. NEVER 0 for a root. Block 0 is itself a root and must have parent_index: null.",
            "sort_order": "integer — display order among siblings, starting at 1",
            "estimated_read_time": "integer or null — minutes to read. Null for containers. 5-10 for leaf blocks.",
            "difficulty_level": "string or null — beginner, intermediate, or advanced. Null for containers.",
            "bloom_level": "string or null — remember, understand, apply, analyze, evaluate, or create. Null for containers.",
            "visualization": {
                "recommended": "boolean",
                "priority": "string or null — high, medium, low. Null if not recommended.",
                "primitive_type": "string or null — physics_sim, vector_diagram, graph_plotter, equation_stepper, particle_renderer, process_flow, comparison_slider, interactive_diagram, timeline_sequence, map_visualization, data_explorer, construction_animator. Null if not recommended.",
                "interaction_mode": "string or null — watch, interactive, or challenge. Null if not recommended.",
                "description": "string or null — 1-2 sentence description of what the visualization should show. Null if not recommended."
            },
            "content_guidance": "string — 1-2 sentences describing what this block's content should cover."
        }
    ],
    "total_leaf_blocks": "integer — count of non-container blocks",
    "total_visualization_flags": "integer — count of blocks with visualization.recommended = true",
    "split_recommendation": "array of strings or null — if this topic is too large, list suggested sub-topics to split into. Null if well-scoped.",
    "merge_recommendation": "string or null — if this topic is too small, suggest a related topic to merge with. Null if well-scoped."
}

CONSTRAINT CHECKLIST — verify before returning:
1. Total leaf blocks is between 4 and 15
2. First leaf block is introductory (Bloom: remember or understand)
3. Last leaf block is reference or summary type
4. At least one example block exists (if topic involves calculations/procedures)
5. At least one exercise or quiz block exists
6. All estimated_read_time values for leaf blocks are between 3 and 12 minutes
7. estimated_total_minutes is the sum of all leaf block read times
8. No block has depth_level > 5
9. Every non-root block has a valid parent_index pointing to an EARLIER block where is_container is true
10. At least one block has parent_index: null (there must be at least one root)
11. No block has parent_index equal to its own index (no self-references)
12. parent_index: 0 is NEVER used for a root — only `null` means root
13. If total_leaf_blocks > 5, the blocks array includes at least one container block (is_container: true)
14. Container blocks have is_container: true and null for read_time, difficulty, bloom
15. total_leaf_blocks matches actual count of blocks where is_container is false
16. Visualization flags are selective (20-40% of leaf blocks), not applied to every block
17. All slugs are lowercase with hyphens, no special characters
18. All enum values match the allowed lists exactly
19. If estimated_total_minutes > 90, set split_recommendation with suggested sub-topics
20. If estimated_total_minutes < 25 and total_leaf_blocks < 4, set merge_recommendation
PROMPT;
    }

    public function jsonSchema(): array
    {
        return [
            'topic_title' => ['required', 'string', 'max:500'],
            'topic_slug' => ['required', 'string', 'max:500', 'regex:/^[a-z0-9-]+$/'],
            'topic_summary' => ['required', 'string', 'max:1000'],
            'estimated_total_minutes' => ['required', 'integer', 'min:1'],
            'blocks' => ['required', 'array', 'min:4'],
            'blocks.*.title' => ['required', 'string', 'max:300'],
            'blocks.*.slug' => ['required', 'string', 'max:300', 'regex:/^[a-z0-9-]+$/'],
            'blocks.*.block_type' => ['required', 'string', 'in:container,text,code,diagram,example,exercise,quiz,reference,comparison'],
            'blocks.*.is_container' => ['required', 'boolean'],
            'blocks.*.depth_level' => ['required', 'integer', 'min:0', 'max:5'],
            'blocks.*.parent_index' => ['nullable', 'integer', 'min:0'],
            'blocks.*.sort_order' => ['required', 'integer', 'min:1'],
            'blocks.*.estimated_read_time' => ['nullable', 'integer', 'min:1', 'max:30'],
            'blocks.*.difficulty_level' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'blocks.*.bloom_level' => ['nullable', 'string', 'in:remember,understand,apply,analyze,evaluate,create'],
            'blocks.*.visualization' => ['required', 'array'],
            'blocks.*.visualization.recommended' => ['required', 'boolean'],
            'blocks.*.visualization.priority' => ['nullable', 'string', 'in:high,medium,low'],
            'blocks.*.visualization.primitive_type' => ['nullable', 'string', 'in:physics_sim,vector_diagram,graph_plotter,equation_stepper,particle_renderer,process_flow,comparison_slider,interactive_diagram,timeline_sequence,map_visualization,data_explorer,construction_animator'],
            'blocks.*.visualization.interaction_mode' => ['nullable', 'string', 'in:watch,interactive,challenge'],
            'blocks.*.visualization.description' => ['nullable', 'string'],
            'blocks.*.content_guidance' => ['required', 'string'],
            'total_leaf_blocks' => ['required', 'integer', 'min:4', 'max:15'],
            'total_visualization_flags' => ['required', 'integer', 'min:0'],
            'split_recommendation' => ['nullable', 'array'],
            'split_recommendation.*' => ['string'],
            'merge_recommendation' => ['nullable', 'string'],
        ];
    }
}
