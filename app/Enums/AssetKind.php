<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum AssetKind: string
{
    use HasSelectOptions;

    case DiagramExcalidraw = 'diagram_excalidraw';
    case Image = 'image';
    case VideoEmbed = 'video_embed';

    public function label(): string
    {
        return match ($this) {
            self::DiagramExcalidraw => 'Diagram (Excalidraw)',
            self::Image => 'Image',
            self::VideoEmbed => 'Video embed',
        };
    }
}
