<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum ContextType: string
{
    use HasSelectOptions;

    case Passage = 'passage';
    case Diagram = 'diagram';
    case Table = 'table';
    case CaseStudy = 'case_study';
    case CodeSnippet = 'code_snippet';
    case Map = 'map';
    case Graph = 'graph';
    case WordBank = 'word_bank';
    case EquationSet = 'equation_set';

    public function label(): string
    {
        return match ($this) {
            self::Passage => 'Passage',
            self::Diagram => 'Diagram',
            self::Table => 'Table',
            self::CaseStudy => 'Case Study',
            self::CodeSnippet => 'Code Snippet',
            self::Map => 'Map',
            self::Graph => 'Graph',
            self::WordBank => 'Word Bank',
            self::EquationSet => 'Equation Set',
        };
    }
}
