<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ResponseConfigValidator implements ValidationRule
{
    public function __construct(private string $questionType) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->questionType === 'group') {
            if ($value !== null) {
                $fail('This question type must not have response_config.');
            }

            return;
        }

        if ($this->isWrittenType()) {
            if ($value === null) {
                return;
            }

            $config = is_array($value) ? $value : json_decode($value, true);
            if (! is_array($config)) {
                $fail('response_config must be a valid JSON object.');

                return;
            }

            $this->validateFreeForm($config, $fail);

            return;
        }

        if ($value === null) {
            $fail('This question type requires response_config.');

            return;
        }

        $config = is_array($value) ? $value : json_decode($value, true);
        if (! is_array($config)) {
            $fail('response_config must be a valid JSON object.');

            return;
        }

        $method = 'validate'.str_replace('_', '', ucwords($this->questionType, '_'));
        // Guard: the dispatched name must be a real per-type validator, not the
        // outer ::validate() — an empty/unknown questionType used to recurse
        // and explode with a TypeError.
        if ($method !== 'validate' && method_exists($this, $method)) {
            $this->$method($config, $fail);
        }
    }

    private function validateFreeForm(array $config, Closure $fail): void
    {
        $allowed = ['minWords', 'maxWords', 'rubric'];
        foreach (array_keys($config) as $key) {
            if (! in_array($key, $allowed, true)) {
                $fail('Free-form response_config may only contain: '.implode(', ', $allowed).'.');

                return;
            }
        }

        if (isset($config['minWords']) && (! is_int($config['minWords']) || $config['minWords'] < 0)) {
            $fail('minWords must be a non-negative integer.');

            return;
        }

        if (isset($config['maxWords']) && (! is_int($config['maxWords']) || $config['maxWords'] < 0)) {
            $fail('maxWords must be a non-negative integer.');

            return;
        }

        if (isset($config['rubric'])) {
            if (! is_array($config['rubric'])) {
                $fail('rubric must be an array.');

                return;
            }

            foreach ($config['rubric'] as $i => $criterion) {
                if (! isset($criterion['label']) || ! isset($criterion['text']) || ! isset($criterion['points'])) {
                    $fail("Rubric criterion {$i} requires label, text, and points.");

                    return;
                }
                if (! is_int($criterion['points']) || $criterion['points'] < 0) {
                    $fail("Rubric criterion {$i} points must be a non-negative integer.");

                    return;
                }
            }
        }
    }

    private function isWrittenType(): bool
    {
        return in_array($this->questionType, ['theory', 'short_answer', 'essay']);
    }

    private function validateMcq(array $config, Closure $fail): void
    {
        if (! isset($config['options']) || ! is_array($config['options'])) {
            $fail('MCQ requires an options array.');

            return;
        }

        $options = $config['options'];
        if (count($options) < 2 || count($options) > 6) {
            $fail('MCQ requires 2-6 options.');

            return;
        }

        $correctCount = 0;
        foreach ($options as $i => $option) {
            if (! isset($option['label']) || ! isset($option['text'])) {
                $fail("Option {$i} requires label and text.");

                return;
            }
            if (! empty($option['is_correct'])) {
                $correctCount++;
            }
        }

        if ($correctCount !== 1) {
            $fail('MCQ requires exactly one correct option.');
        }
    }

    private function validateMultiSelectMcq(array $config, Closure $fail): void
    {
        if (! isset($config['options']) || ! is_array($config['options'])) {
            $fail('Multi-select MCQ requires an options array.');

            return;
        }

        $options = $config['options'];
        if (count($options) < 2 || count($options) > 6) {
            $fail('Multi-select MCQ requires 2-6 options.');

            return;
        }

        $correctCount = collect($options)->where('is_correct', true)->count();
        if ($correctCount < 2) {
            $fail('Multi-select MCQ requires at least 2 correct options.');
        }
    }

    private function validateTrueFalse(array $config, Closure $fail): void
    {
        if (! array_key_exists('correct_answer', $config) || ! is_bool($config['correct_answer'])) {
            $fail('True/False requires a boolean correct_answer.');
        }
    }

    private function validateFillBlank(array $config, Closure $fail): void
    {
        if (! isset($config['blanks']) || ! is_array($config['blanks']) || count($config['blanks']) < 1) {
            $fail('Fill-blank requires at least one blank.');

            return;
        }

        foreach ($config['blanks'] as $i => $blank) {
            if (! isset($blank['position']) || ! isset($blank['correct_answers']) || ! is_array($blank['correct_answers']) || count($blank['correct_answers']) < 1) {
                $fail("Blank {$i} requires position and at least one correct_answer.");

                return;
            }
        }
    }

    private function validateCloze(array $config, Closure $fail): void
    {
        if (! isset($config['gaps']) || ! is_array($config['gaps']) || count($config['gaps']) < 1) {
            $fail('Cloze requires at least one gap.');

            return;
        }

        foreach ($config['gaps'] as $i => $gap) {
            if (! isset($gap['position']) || ! isset($gap['options']) || ! is_array($gap['options']) || count($gap['options']) < 2) {
                $fail("Gap {$i} requires position and at least 2 options.");

                return;
            }
            if (! isset($gap['correct']) || ! is_int($gap['correct'])) {
                $fail("Gap {$i} requires a correct index.");

                return;
            }
        }
    }

    private function validateMatching(array $config, Closure $fail): void
    {
        if (! isset($config['pairs']) || ! is_array($config['pairs']) || count($config['pairs']) < 2) {
            $fail('Matching requires at least 2 pairs.');

            return;
        }

        foreach ($config['pairs'] as $i => $pair) {
            if (! isset($pair['left']) || ! isset($pair['right'])) {
                $fail("Pair {$i} requires left and right values.");

                return;
            }
        }
    }

    private function validateMatrixMatching(array $config, Closure $fail): void
    {
        if (! isset($config['left']) || ! is_array($config['left']) || count($config['left']) < 2) {
            $fail('Matrix matching requires at least 2 left items.');

            return;
        }
        if (! isset($config['right']) || ! is_array($config['right']) || count($config['right']) < 2) {
            $fail('Matrix matching requires at least 2 right items.');

            return;
        }
        if (! isset($config['mapping']) || ! is_array($config['mapping'])) {
            $fail('Matrix matching requires a mapping object.');
        }
    }

    private function validateOrdering(array $config, Closure $fail): void
    {
        if (! isset($config['items']) || ! is_array($config['items']) || count($config['items']) < 2) {
            $fail('Ordering requires at least 2 items.');

            return;
        }
        if (! isset($config['correct_order']) || ! is_array($config['correct_order'])) {
            $fail('Ordering requires a correct_order array.');
        }
    }

    private function validateDiagramLabel(array $config, Closure $fail): void
    {
        if (! isset($config['labels']) || ! is_array($config['labels']) || count($config['labels']) < 1) {
            $fail('Diagram label requires at least one label.');

            return;
        }

        foreach ($config['labels'] as $i => $label) {
            if (! isset($label['label']) || ! isset($label['answer'])) {
                $fail("Label {$i} requires label identifier and answer.");

                return;
            }
        }
    }

    private function validateCalculation(array $config, Closure $fail): void
    {
        if (! isset($config['answer'])) {
            $fail('Calculation requires an answer.');
        }
    }

    private function validateNumericEntry(array $config, Closure $fail): void
    {
        if (! isset($config['answer']) || ! is_numeric($config['answer'])) {
            $fail('Numeric entry requires a numeric answer.');
        }
    }

    private function validateAssertionReason(array $config, Closure $fail): void
    {
        if (! isset($config['assertion']) || ! is_string($config['assertion'])) {
            $fail('Assertion-reason requires an assertion string.');

            return;
        }
        if (! isset($config['reason']) || ! is_string($config['reason'])) {
            $fail('Assertion-reason requires a reason string.');

            return;
        }
        if (! isset($config['options']) || ! is_array($config['options']) || count($config['options']) < 2) {
            $fail('Assertion-reason requires at least 2 answer options.');
        }
    }
}
