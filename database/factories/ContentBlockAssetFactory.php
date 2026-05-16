<?php

namespace Database\Factories;

use App\Enums\AssetKind;
use App\Models\ContentBlock;
use App\Models\ContentBlockAsset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContentBlockAsset>
 */
class ContentBlockAssetFactory extends Factory
{
    protected $model = ContentBlockAsset::class;

    public function definition(): array
    {
        return [
            'content_block_id' => ContentBlock::factory(),
            'question_id' => null,
            'question_paper_id' => null,
            'kind' => AssetKind::DiagramExcalidraw->value,
            'excalidraw_json' => [
                'type' => 'excalidraw',
                'version' => 2,
                'elements' => [],
                'appState' => ['viewBackgroundColor' => '#ffffff'],
                'files' => new \stdClass,
            ],
            'svg_payload' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#f5f5f5"/></svg>',
            'alt_text' => $this->faker->sentence(4),
            'caption' => $this->faker->sentence(6),
            'created_by' => User::factory(),
        ];
    }

    /** Asset attached to a question instead of a content block. */
    public function forQuestion(\App\Models\Question|string $question): self
    {
        $id = $question instanceof \App\Models\Question ? $question->id : $question;

        return $this->state(fn () => [
            'content_block_id' => null,
            'question_id' => $id,
            'question_paper_id' => null,
        ]);
    }

    /** Asset attached to a question paper (shared across questions). */
    public function forQuestionPaper(\App\Models\QuestionPaper|string $paper): self
    {
        $id = $paper instanceof \App\Models\QuestionPaper ? $paper->id : $paper;

        return $this->state(fn () => [
            'content_block_id' => null,
            'question_id' => null,
            'question_paper_id' => $id,
        ]);
    }
}
