<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

/**
 * Canvas stencil categories — STEM symbol library.
 *
 * Matches Phase 6 brief §6.87 (Bible reference). Cases are snake_case so URL
 * slugs and R2 paths derive cleanly: stencils/{category}/{symbol-slug}.svg.
 */
enum StencilCategory: string
{
    use HasSelectOptions;

    case PhysicsCircuits = 'physics_circuits';
    case PhysicsMechanics = 'physics_mechanics';
    case PhysicsOptics = 'physics_optics';
    case PhysicsWaves = 'physics_waves';
    case ChemistryLabApparatus = 'chemistry_lab_apparatus';
    case ChemistryAtomic = 'chemistry_atomic';
    case BiologyCell = 'biology_cell';
    case BiologySystems = 'biology_systems';
    case BiologyGenetics = 'biology_genetics';
    case EngineeringLogicGates = 'engineering_logic_gates';
    case EngineeringStructural = 'engineering_structural';
    case MathGeometry = 'math_geometry';
    case General = 'general';

    public function label(): string
    {
        return match ($this) {
            self::PhysicsCircuits => 'Physics — Circuits',
            self::PhysicsMechanics => 'Physics — Mechanics',
            self::PhysicsOptics => 'Physics — Optics',
            self::PhysicsWaves => 'Physics — Waves',
            self::ChemistryLabApparatus => 'Chemistry — Lab Apparatus',
            self::ChemistryAtomic => 'Chemistry — Atomic',
            self::BiologyCell => 'Biology — Cell Biology',
            self::BiologySystems => 'Biology — Human Systems',
            self::BiologyGenetics => 'Biology — Genetics',
            self::EngineeringLogicGates => 'Engineering — Logic Gates',
            self::EngineeringStructural => 'Engineering — Structural',
            self::MathGeometry => 'Math — Geometry',
            self::General => 'General',
        };
    }
}
