<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum QuestionSource: string
{
    use HasSelectOptions;
    case Manual = 'manual';
    case Crowdsourced = 'crowdsourced';
    case AiGenerated = 'ai_generated';
    case BulkImport = 'bulk_import';
    case PastPaperImported = 'past_paper_imported';

    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::Crowdsourced => 'Crowdsourced',
            self::AiGenerated => 'AI Generated',
            self::BulkImport => 'Bulk Import',
            self::PastPaperImported => 'Past Paper (Imported)',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
