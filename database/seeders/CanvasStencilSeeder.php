<?php

namespace Database\Seeders;

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use App\Models\CanvasStencil;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Seeds the initial canvas stencil library — 30 STEM symbols hand-authored as
 * inline SVG markup. All ship under Skoolpad license (proprietary, our own work).
 *
 * Symbols use viewBox 100x100 + `currentColor` strokes so they adapt to canvas
 * theming. Stroke width is uniform at 4 for visual consistency.
 *
 * Source: hand-authored 2026-05-16 per the SVG sourcing policy in
 * `Content Strategy/2026-05-16-visualization-decisions-and-phase-6-alignment.md` §3.
 */
class CanvasStencilSeeder extends Seeder
{
    public function run(): void
    {
        $stencils = $this->definitions();

        foreach ($stencils as $idx => $def) {
            $slug = $def['slug'];
            $category = $def['category'];

            // Write SVG file to public/stencils/{category}/{slug}.svg
            $dir = public_path("stencils/{$category->value}");
            if (! File::isDirectory($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            $relPath = "/stencils/{$category->value}/{$slug}.svg";
            File::put(public_path(ltrim($relPath, '/')), $def['svg']);

            CanvasStencil::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $def['name'],
                    'category' => $category->value,
                    'tags' => $def['tags'],
                    'svg_path' => $relPath,
                    'license' => StencilLicense::Skoolpad->value,
                    'source_attribution' => null,
                    'source_url' => null,
                    'sort_order' => $idx,
                    'is_active' => true,
                ],
            );
        }
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     slug: string,
     *     category: StencilCategory,
     *     tags: array<int, string>,
     *     svg: string,
     * }>
     */
    private function definitions(): array
    {
        $S = 'stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
        $TXT = 'fill="currentColor" font-family="sans-serif" font-size="14"';

        return [
            // === Physics — Circuits (8) ===
            [
                'name' => 'Resistor', 'slug' => 'resistor', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['resistor', 'ohm', 'circuit', 'component'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="20" y2="50" '.$S.'/><polyline points="20,50 28,30 44,70 60,30 76,70 84,50" '.$S.'/><line x1="80" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Capacitor', 'slug' => 'capacitor', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['capacitor', 'farad', 'circuit', 'component'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="42" y2="50" '.$S.'/><line x1="42" y1="20" x2="42" y2="80" '.$S.'/><line x1="58" y1="20" x2="58" y2="80" '.$S.'/><line x1="58" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Inductor', 'slug' => 'inductor', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['inductor', 'coil', 'henry', 'circuit'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="15" y2="50" '.$S.'/><path d="M15,50 a8,8 0 0 1 16,0 a8,8 0 0 1 16,0 a8,8 0 0 1 16,0 a8,8 0 0 1 16,0" '.$S.'/><line x1="79" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Battery', 'slug' => 'battery', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['battery', 'cell', 'emf', 'voltage'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="40" y2="50" '.$S.'/><line x1="40" y1="25" x2="40" y2="75" '.$S.'/><line x1="50" y1="35" x2="50" y2="65" '.$S.'/><line x1="60" y1="25" x2="60" y2="75" '.$S.'/><line x1="70" y1="35" x2="70" y2="65" '.$S.'/><line x1="70" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Switch (open)', 'slug' => 'switch-open', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['switch', 'open', 'circuit'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="30" y2="50" '.$S.'/><line x1="30" y1="50" x2="70" y2="25" '.$S.'/><circle cx="30" cy="50" r="3" fill="currentColor"/><circle cx="70" cy="50" r="3" fill="currentColor"/><line x1="70" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Ammeter', 'slug' => 'ammeter', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['ammeter', 'current', 'meter', 'circuit'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="25" y2="50" '.$S.'/><circle cx="50" cy="50" r="25" '.$S.'/><text x="50" y="56" text-anchor="middle" '.$TXT.'>A</text><line x1="75" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Voltmeter', 'slug' => 'voltmeter', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['voltmeter', 'voltage', 'meter', 'circuit'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="25" y2="50" '.$S.'/><circle cx="50" cy="50" r="25" '.$S.'/><text x="50" y="56" text-anchor="middle" '.$TXT.'>V</text><line x1="75" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Lamp', 'slug' => 'lamp', 'category' => StencilCategory::PhysicsCircuits,
                'tags' => ['lamp', 'bulb', 'light', 'circuit'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="25" y2="50" '.$S.'/><circle cx="50" cy="50" r="25" '.$S.'/><line x1="32" y1="32" x2="68" y2="68" '.$S.'/><line x1="68" y1="32" x2="32" y2="68" '.$S.'/><line x1="75" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],

            // === Physics — Mechanics (6) ===
            [
                'name' => 'Force arrow', 'slug' => 'force-arrow', 'category' => StencilCategory::PhysicsMechanics,
                'tags' => ['force', 'vector', 'arrow', 'newton'],
                'svg' => $this->svg('<line x1="10" y1="50" x2="80" y2="50" '.$S.'/><polyline points="65,35 85,50 65,65" '.$S.'/><text x="50" y="38" text-anchor="middle" '.$TXT.'>F</text>'),
            ],
            [
                'name' => 'Pulley', 'slug' => 'pulley', 'category' => StencilCategory::PhysicsMechanics,
                'tags' => ['pulley', 'wheel', 'mechanics'],
                'svg' => $this->svg('<circle cx="50" cy="40" r="22" '.$S.'/><line x1="50" y1="40" x2="50" y2="42" '.$S.'/><line x1="28" y1="40" x2="28" y2="95" '.$S.'/><line x1="72" y1="40" x2="72" y2="95" '.$S.'/><line x1="20" y1="14" x2="80" y2="14" '.$S.'/><line x1="50" y1="14" x2="50" y2="18" '.$S.'/>'),
            ],
            [
                'name' => 'Inclined plane', 'slug' => 'inclined-plane', 'category' => StencilCategory::PhysicsMechanics,
                'tags' => ['inclined', 'ramp', 'plane', 'slope'],
                'svg' => $this->svg('<polygon points="10,85 90,85 90,25" '.$S.'/>'),
            ],
            [
                'name' => 'Spring', 'slug' => 'spring', 'category' => StencilCategory::PhysicsMechanics,
                'tags' => ['spring', 'hooke', 'oscillation', 'mechanics'],
                'svg' => $this->svg('<line x1="0" y1="50" x2="15" y2="50" '.$S.'/><polyline points="15,50 22,30 32,70 42,30 52,70 62,30 72,70 82,50" '.$S.'/><line x1="82" y1="50" x2="100" y2="50" '.$S.'/>'),
            ],
            [
                'name' => 'Mass block', 'slug' => 'mass-block', 'category' => StencilCategory::PhysicsMechanics,
                'tags' => ['mass', 'block', 'body', 'mechanics'],
                'svg' => $this->svg('<rect x="20" y="35" width="60" height="35" rx="2" '.$S.'/><text x="50" y="58" text-anchor="middle" '.$TXT.'>m</text>'),
            ],
            [
                'name' => 'Pivot', 'slug' => 'pivot', 'category' => StencilCategory::PhysicsMechanics,
                'tags' => ['pivot', 'fulcrum', 'hinge', 'mechanics'],
                'svg' => $this->svg('<polygon points="50,30 30,80 70,80" '.$S.'/><circle cx="50" cy="30" r="5" fill="currentColor"/>'),
            ],

            // === Physics — Optics (3) ===
            [
                'name' => 'Convex lens', 'slug' => 'convex-lens', 'category' => StencilCategory::PhysicsOptics,
                'tags' => ['lens', 'convex', 'optics', 'biconvex'],
                'svg' => $this->svg('<path d="M50,15 Q70,50 50,85 Q30,50 50,15 Z" '.$S.'/><line x1="0" y1="50" x2="100" y2="50" '.$S.' stroke-dasharray="3,3"/>'),
            ],
            [
                'name' => 'Concave lens', 'slug' => 'concave-lens', 'category' => StencilCategory::PhysicsOptics,
                'tags' => ['lens', 'concave', 'optics', 'diverging'],
                'svg' => $this->svg('<path d="M40,15 L60,15 Q50,50 60,85 L40,85 Q50,50 40,15 Z" '.$S.'/><line x1="0" y1="50" x2="100" y2="50" '.$S.' stroke-dasharray="3,3"/>'),
            ],
            [
                'name' => 'Plane mirror', 'slug' => 'plane-mirror', 'category' => StencilCategory::PhysicsOptics,
                'tags' => ['mirror', 'plane', 'reflection', 'optics'],
                'svg' => $this->svg('<line x1="40" y1="15" x2="40" y2="85" stroke="currentColor" stroke-width="6"/><line x1="40" y1="20" x2="32" y2="14" '.$S.'/><line x1="40" y1="30" x2="32" y2="24" '.$S.'/><line x1="40" y1="40" x2="32" y2="34" '.$S.'/><line x1="40" y1="50" x2="32" y2="44" '.$S.'/><line x1="40" y1="60" x2="32" y2="54" '.$S.'/><line x1="40" y1="70" x2="32" y2="64" '.$S.'/><line x1="40" y1="80" x2="32" y2="74" '.$S.'/>'),
            ],

            // === Math — Geometry (5) ===
            [
                'name' => 'Triangle', 'slug' => 'triangle', 'category' => StencilCategory::MathGeometry,
                'tags' => ['triangle', 'geometry', 'shape'],
                'svg' => $this->svg('<polygon points="50,15 90,85 10,85" '.$S.'/>'),
            ],
            [
                'name' => 'Circle with radius', 'slug' => 'circle-radius', 'category' => StencilCategory::MathGeometry,
                'tags' => ['circle', 'radius', 'geometry'],
                'svg' => $this->svg('<circle cx="50" cy="50" r="35" '.$S.'/><line x1="50" y1="50" x2="85" y2="50" '.$S.'/><circle cx="50" cy="50" r="2" fill="currentColor"/><text x="65" y="44" '.$TXT.'>r</text>'),
            ],
            [
                'name' => 'Coordinate axes', 'slug' => 'coordinate-axes', 'category' => StencilCategory::MathGeometry,
                'tags' => ['axes', 'coordinate', 'cartesian', 'xy'],
                'svg' => $this->svg('<line x1="10" y1="50" x2="90" y2="50" '.$S.'/><polyline points="85,46 90,50 85,54" '.$S.'/><line x1="50" y1="90" x2="50" y2="10" '.$S.'/><polyline points="46,15 50,10 54,15" '.$S.'/><text x="84" y="44" '.$TXT.'>x</text><text x="56" y="18" '.$TXT.'>y</text>'),
            ],
            [
                'name' => 'Angle arc', 'slug' => 'angle-arc', 'category' => StencilCategory::MathGeometry,
                'tags' => ['angle', 'arc', 'theta', 'geometry'],
                'svg' => $this->svg('<line x1="20" y1="80" x2="90" y2="80" '.$S.'/><line x1="20" y1="80" x2="80" y2="20" '.$S.'/><path d="M55,80 A35,35 0 0 0 45,55" '.$S.'/><text x="60" y="70" '.$TXT.'>θ</text>'),
            ],
            [
                'name' => 'Number line', 'slug' => 'number-line', 'category' => StencilCategory::MathGeometry,
                'tags' => ['number', 'line', 'real', 'math'],
                'svg' => $this->svg('<line x1="5" y1="50" x2="95" y2="50" '.$S.'/><polyline points="10,46 5,50 10,54" '.$S.'/><polyline points="90,46 95,50 90,54" '.$S.'/><line x1="25" y1="45" x2="25" y2="55" '.$S.'/><line x1="50" y1="45" x2="50" y2="55" '.$S.'/><line x1="75" y1="45" x2="75" y2="55" '.$S.'/><text x="23" y="70" '.$TXT.'>-1</text><text x="48" y="70" '.$TXT.'>0</text><text x="73" y="70" '.$TXT.'>1</text>'),
            ],

            // === Engineering — Structural (4) ===
            [
                'name' => 'Beam', 'slug' => 'beam', 'category' => StencilCategory::EngineeringStructural,
                'tags' => ['beam', 'structural', 'engineering'],
                'svg' => $this->svg('<rect x="10" y="45" width="80" height="10" '.$S.'/>'),
            ],
            [
                'name' => 'Pin support', 'slug' => 'pin-support', 'category' => StencilCategory::EngineeringStructural,
                'tags' => ['pin', 'support', 'structural', 'engineering'],
                'svg' => $this->svg('<polygon points="50,30 30,80 70,80" '.$S.'/><line x1="20" y1="80" x2="80" y2="80" '.$S.'/><line x1="22" y1="80" x2="18" y2="90" '.$S.'/><line x1="34" y1="80" x2="30" y2="90" '.$S.'/><line x1="46" y1="80" x2="42" y2="90" '.$S.'/><line x1="58" y1="80" x2="54" y2="90" '.$S.'/><line x1="70" y1="80" x2="66" y2="90" '.$S.'/><line x1="82" y1="80" x2="78" y2="90" '.$S.'/>'),
            ],
            [
                'name' => 'Roller support', 'slug' => 'roller-support', 'category' => StencilCategory::EngineeringStructural,
                'tags' => ['roller', 'support', 'structural', 'engineering'],
                'svg' => $this->svg('<polygon points="50,30 30,70 70,70" '.$S.'/><circle cx="35" cy="76" r="5" '.$S.'/><circle cx="50" cy="76" r="5" '.$S.'/><circle cx="65" cy="76" r="5" '.$S.'/><line x1="25" y1="84" x2="75" y2="84" '.$S.'/>'),
            ],
            [
                'name' => 'Load arrow', 'slug' => 'load-arrow', 'category' => StencilCategory::EngineeringStructural,
                'tags' => ['load', 'arrow', 'force', 'structural'],
                'svg' => $this->svg('<line x1="50" y1="15" x2="50" y2="80" '.$S.'/><polyline points="38,68 50,82 62,68" '.$S.'/><text x="56" y="40" '.$TXT.'>P</text>'),
            ],

            // === General (4) ===
            [
                'name' => 'Arrow right', 'slug' => 'arrow-right', 'category' => StencilCategory::General,
                'tags' => ['arrow', 'right', 'pointer'],
                'svg' => $this->svg('<line x1="15" y1="50" x2="80" y2="50" '.$S.'/><polyline points="65,35 85,50 65,65" '.$S.'/>'),
            ],
            [
                'name' => 'Label box', 'slug' => 'label-box', 'category' => StencilCategory::General,
                'tags' => ['label', 'box', 'annotation'],
                'svg' => $this->svg('<rect x="15" y="35" width="70" height="30" rx="4" '.$S.'/><text x="50" y="56" text-anchor="middle" '.$TXT.'>Label</text>'),
            ],
            [
                'name' => 'Annotation callout', 'slug' => 'annotation-callout', 'category' => StencilCategory::General,
                'tags' => ['callout', 'annotation', 'note'],
                'svg' => $this->svg('<rect x="15" y="20" width="70" height="40" rx="4" '.$S.'/><polyline points="35,60 30,80 50,60" '.$S.'/>'),
            ],
            [
                'name' => 'Dimension line', 'slug' => 'dimension-line', 'category' => StencilCategory::General,
                'tags' => ['dimension', 'measure', 'line'],
                'svg' => $this->svg('<line x1="15" y1="50" x2="85" y2="50" '.$S.'/><line x1="15" y1="40" x2="15" y2="60" '.$S.'/><line x1="85" y1="40" x2="85" y2="60" '.$S.'/><text x="50" y="42" text-anchor="middle" '.$TXT.'>d</text>'),
            ],
        ];
    }

    private function svg(string $inner): string
    {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">'.$inner.'</svg>';
    }
}
