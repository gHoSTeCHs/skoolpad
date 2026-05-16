<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

/**
 * License a stencil ships under — enforced at admin upload to keep Skoolpad
 * (a proprietary product) free of share-alike obligations.
 *
 * CC-BY-SA is deliberately omitted: an annotated stencil on the canvas could
 * become a derivative work inheriting CC-BY-SA, which conflicts with the
 * platform's proprietary stance. Decision pinned in
 * `2026-05-16-visualization-decisions-and-phase-6-alignment.md` §3.
 */
enum StencilLicense: string
{
    use HasSelectOptions;

    case Skoolpad = 'skoolpad';
    case Cc0 = 'cc0';
    case PublicDomain = 'public_domain';
    case CcBy4 = 'cc_by_4';

    public function label(): string
    {
        return match ($this) {
            self::Skoolpad => 'Skoolpad (proprietary)',
            self::Cc0 => 'CC0 (no rights reserved)',
            self::PublicDomain => 'Public Domain',
            self::CcBy4 => 'CC-BY-4.0 (attribution required)',
        };
    }

    public function requiresAttribution(): bool
    {
        return $this === self::CcBy4;
    }
}
