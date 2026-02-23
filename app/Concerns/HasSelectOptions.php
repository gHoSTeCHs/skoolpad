<?php

namespace App\Concerns;

/**
 * Trait for enums to provide select options for frontend dropdowns
 *
 * Usage:
 *   enum InstitutionType: string
 *   {
 *       use HasSelectOptions;
 *
 *       case University = 'university';
 *       // ...
 *
 *       public function label(): string { ... }
 *   }
 *
 * In controllers:
 *   'institutionTypes' => InstitutionType::toSelectOptions()
 */
trait HasSelectOptions
{
    /**
     * Convert enum cases to select options array for frontend
     *
     * @return array<int, array{value: string|int, label: string}>
     */
    public static function toSelectOptions(): array
    {
        return array_map(
            fn (self $case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ],
            self::cases()
        );
    }
}
