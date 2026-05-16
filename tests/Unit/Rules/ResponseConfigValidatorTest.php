<?php

use App\Rules\ResponseConfigValidator;
use Illuminate\Support\Facades\Validator;

uses(Tests\TestCase::class);

function validateConfig(string $type, mixed $config): bool
{
    $validator = Validator::make(
        ['response_config' => $config],
        ['response_config' => [new ResponseConfigValidator($type)]]
    );

    return $validator->passes();
}

function validMcqConfig(): array
{
    return [
        'options' => [
            ['label' => 'A', 'text' => 'Option 1', 'is_correct' => false],
            ['label' => 'B', 'text' => 'Option 2', 'is_correct' => true],
            ['label' => 'C', 'text' => 'Option 3', 'is_correct' => false],
            ['label' => 'D', 'text' => 'Option 4', 'is_correct' => false],
        ],
    ];
}

function validMultiSelectConfig(): array
{
    return [
        'options' => [
            ['label' => 'A', 'text' => 'Option 1', 'is_correct' => true],
            ['label' => 'B', 'text' => 'Option 2', 'is_correct' => true],
            ['label' => 'C', 'text' => 'Option 3', 'is_correct' => false],
            ['label' => 'D', 'text' => 'Option 4', 'is_correct' => false],
        ],
    ];
}

test('mcq with valid config passes', function () {
    expect(validateConfig('mcq', validMcqConfig()))->toBeTrue();
});

test('mcq with no correct option fails', function () {
    $config = validMcqConfig();
    foreach ($config['options'] as &$opt) {
        $opt['is_correct'] = false;
    }
    expect(validateConfig('mcq', $config))->toBeFalse();
});

test('mcq with two correct options fails', function () {
    $config = validMcqConfig();
    $config['options'][0]['is_correct'] = true;
    $config['options'][1]['is_correct'] = true;
    expect(validateConfig('mcq', $config))->toBeFalse();
});

test('mcq with less than 2 options fails', function () {
    $config = ['options' => [['label' => 'A', 'text' => 'Only one', 'is_correct' => true]]];
    expect(validateConfig('mcq', $config))->toBeFalse();
});

test('mcq with more than 6 options fails', function () {
    $options = [];
    for ($i = 0; $i < 7; $i++) {
        $options[] = ['label' => chr(65 + $i), 'text' => "Option {$i}", 'is_correct' => $i === 0];
    }
    expect(validateConfig('mcq', ['options' => $options]))->toBeFalse();
});

test('mcq with missing option label fails', function () {
    $config = [
        'options' => [
            ['text' => 'No label', 'is_correct' => false],
            ['label' => 'B', 'text' => 'Has label', 'is_correct' => true],
        ],
    ];
    expect(validateConfig('mcq', $config))->toBeFalse();
});

test('mcq with null config fails', function () {
    expect(validateConfig('mcq', null))->toBeFalse();
});

test('multi_select_mcq with valid config passes', function () {
    expect(validateConfig('multi_select_mcq', validMultiSelectConfig()))->toBeTrue();
});

test('multi_select_mcq with only one correct option fails', function () {
    $config = validMultiSelectConfig();
    $config['options'][1]['is_correct'] = false;
    expect(validateConfig('multi_select_mcq', $config))->toBeFalse();
});

test('true_false with valid config passes', function () {
    expect(validateConfig('true_false', ['correct_answer' => true]))->toBeTrue();
    expect(validateConfig('true_false', ['correct_answer' => false]))->toBeTrue();
});

test('true_false with non-boolean correct_answer fails', function () {
    expect(validateConfig('true_false', ['correct_answer' => 'yes']))->toBeFalse();
});

test('true_false with missing correct_answer fails', function () {
    expect(validateConfig('true_false', []))->toBeFalse();
});

test('fill_blank with valid config passes', function () {
    $config = [
        'blanks' => [
            ['position' => 0, 'correct_answers' => ['Paris']],
            ['position' => 1, 'correct_answers' => ['France', 'french republic']],
        ],
    ];
    expect(validateConfig('fill_blank', $config))->toBeTrue();
});

test('fill_blank with empty blanks fails', function () {
    expect(validateConfig('fill_blank', ['blanks' => []]))->toBeFalse();
});

test('fill_blank with missing correct_answers fails', function () {
    $config = ['blanks' => [['position' => 0]]];
    expect(validateConfig('fill_blank', $config))->toBeFalse();
});

test('cloze with valid config passes', function () {
    $config = [
        'gaps' => [
            ['position' => 0, 'options' => ['cat', 'dog', 'bird'], 'correct' => 0],
        ],
    ];
    expect(validateConfig('cloze', $config))->toBeTrue();
});

test('cloze with less than 2 gap options fails', function () {
    $config = ['gaps' => [['position' => 0, 'options' => ['only'], 'correct' => 0]]];
    expect(validateConfig('cloze', $config))->toBeFalse();
});

test('cloze with missing correct index fails', function () {
    $config = ['gaps' => [['position' => 0, 'options' => ['a', 'b']]]];
    expect(validateConfig('cloze', $config))->toBeFalse();
});

test('matching with valid config passes', function () {
    $config = [
        'pairs' => [
            ['left' => 'Capital of France', 'right' => 'Paris'],
            ['left' => 'Capital of Germany', 'right' => 'Berlin'],
        ],
    ];
    expect(validateConfig('matching', $config))->toBeTrue();
});

test('matching with less than 2 pairs fails', function () {
    $config = ['pairs' => [['left' => 'A', 'right' => 'B']]];
    expect(validateConfig('matching', $config))->toBeFalse();
});

test('matching with missing right value fails', function () {
    $config = ['pairs' => [['left' => 'A'], ['left' => 'B']]];
    expect(validateConfig('matching', $config))->toBeFalse();
});

test('matrix_matching with valid config passes', function () {
    $config = [
        'left' => ['Item A', 'Item B'],
        'right' => ['Match 1', 'Match 2'],
        'mapping' => ['0' => [0, 1], '1' => [1]],
    ];
    expect(validateConfig('matrix_matching', $config))->toBeTrue();
});

test('matrix_matching with less than 2 left items fails', function () {
    $config = ['left' => ['Only'], 'right' => ['A', 'B'], 'mapping' => []];
    expect(validateConfig('matrix_matching', $config))->toBeFalse();
});

test('matrix_matching with missing mapping fails', function () {
    $config = ['left' => ['A', 'B'], 'right' => ['C', 'D']];
    expect(validateConfig('matrix_matching', $config))->toBeFalse();
});

test('ordering with valid config passes', function () {
    $config = [
        'items' => ['First', 'Second', 'Third'],
        'correct_order' => [0, 1, 2],
    ];
    expect(validateConfig('ordering', $config))->toBeTrue();
});

test('ordering with less than 2 items fails', function () {
    $config = ['items' => ['Only'], 'correct_order' => [0]];
    expect(validateConfig('ordering', $config))->toBeFalse();
});

test('ordering with missing correct_order fails', function () {
    $config = ['items' => ['A', 'B', 'C']];
    expect(validateConfig('ordering', $config))->toBeFalse();
});

test('diagram_label with valid config passes', function () {
    $config = [
        'labels' => [
            ['label' => 'I', 'answer' => 'Mitochondria', 'x' => 50, 'y' => 30],
            ['label' => 'II', 'answer' => 'Nucleus', 'x' => 70, 'y' => 60],
        ],
    ];
    expect(validateConfig('diagram_label', $config))->toBeTrue();
});

test('diagram_label with empty labels fails', function () {
    expect(validateConfig('diagram_label', ['labels' => []]))->toBeFalse();
});

test('diagram_label with missing answer fails', function () {
    $config = ['labels' => [['label' => 'I']]];
    expect(validateConfig('diagram_label', $config))->toBeFalse();
});

test('calculation with valid config passes', function () {
    $config = ['answer' => 42, 'unit' => 'm/s', 'tolerance' => 0.5, 'requires_working' => true];
    expect(validateConfig('calculation', $config))->toBeTrue();
});

test('calculation with missing answer fails', function () {
    expect(validateConfig('calculation', ['unit' => 'kg']))->toBeFalse();
});

test('numeric_entry with valid config passes', function () {
    $config = ['answer' => 3.14, 'tolerance' => 0.01];
    expect(validateConfig('numeric_entry', $config))->toBeTrue();
});

test('numeric_entry with non-numeric answer fails', function () {
    expect(validateConfig('numeric_entry', ['answer' => 'abc']))->toBeFalse();
});

test('numeric_entry with missing answer fails', function () {
    expect(validateConfig('numeric_entry', []))->toBeFalse();
});

test('assertion_reason with valid config passes', function () {
    $config = [
        'assertion' => 'Water boils at 100C.',
        'reason' => 'Because of atmospheric pressure at sea level.',
        'options' => [
            ['label' => 'A', 'text' => 'Both true, reason explains assertion', 'is_correct' => true],
            ['label' => 'B', 'text' => 'Both true, reason does not explain', 'is_correct' => false],
            ['label' => 'C', 'text' => 'Assertion true, reason false', 'is_correct' => false],
            ['label' => 'D', 'text' => 'Both false', 'is_correct' => false],
        ],
    ];
    expect(validateConfig('assertion_reason', $config))->toBeTrue();
});

test('assertion_reason with missing assertion fails', function () {
    $config = ['reason' => 'Some reason', 'options' => [['a'], ['b']]];
    expect(validateConfig('assertion_reason', $config))->toBeFalse();
});

test('assertion_reason with missing reason fails', function () {
    $config = ['assertion' => 'Some assertion', 'options' => [['a'], ['b']]];
    expect(validateConfig('assertion_reason', $config))->toBeFalse();
});

test('assertion_reason with less than 2 options fails', function () {
    $config = ['assertion' => 'A', 'reason' => 'R', 'options' => [['a']]];
    expect(validateConfig('assertion_reason', $config))->toBeFalse();
});

test('written types with null config pass', function (string $type) {
    expect(validateConfig($type, null))->toBeTrue();
})->with(['theory', 'short_answer', 'essay']);

test('written types with unknown keys fail', function (string $type) {
    expect(validateConfig($type, ['some' => 'data']))->toBeFalse();
})->with(['theory', 'short_answer', 'essay']);

test('written types with word range pass', function (string $type) {
    expect(validateConfig($type, ['minWords' => 100, 'maxWords' => 500]))->toBeTrue();
})->with(['theory', 'short_answer', 'essay']);

test('written types with rubric pass', function (string $type) {
    $config = [
        'rubric' => [
            ['label' => 'A', 'text' => 'Defines RISC and CISC', 'points' => 5],
            ['label' => 'B', 'text' => 'Names a real processor', 'points' => 3],
        ],
    ];
    expect(validateConfig($type, $config))->toBeTrue();
})->with(['theory', 'short_answer', 'essay']);

test('written types with rubric + word range pass', function () {
    $config = [
        'minWords' => 200,
        'maxWords' => 600,
        'rubric' => [
            ['label' => 'A', 'text' => 'Coherent', 'points' => 4],
        ],
    ];
    expect(validateConfig('essay', $config))->toBeTrue();
});

test('written types with malformed rubric criterion fail', function () {
    $config = ['rubric' => [['label' => 'A', 'text' => 'no points field']]];
    expect(validateConfig('theory', $config))->toBeFalse();
});

test('written types with negative word range fail', function () {
    expect(validateConfig('theory', ['minWords' => -5]))->toBeFalse();
});

test('written types with non-integer points fail', function () {
    $config = ['rubric' => [['label' => 'A', 'text' => 'X', 'points' => 'five']]];
    expect(validateConfig('theory', $config))->toBeFalse();
});

test('group with null config passes', function () {
    expect(validateConfig('group', null))->toBeTrue();
});

test('group with non-null config fails', function () {
    expect(validateConfig('group', ['some' => 'data']))->toBeFalse();
});
