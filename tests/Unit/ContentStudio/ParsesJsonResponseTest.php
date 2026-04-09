<?php

use App\ContentStudio\Adapters\OpenAICompatibleAdapter;
use App\Enums\AIAdapterType;
use App\Models\AIModel;

uses(Tests\TestCase::class);

function invokeStrip(OpenAICompatibleAdapter $adapter, string $input): string
{
    $reflection = new ReflectionClass($adapter);
    $method = $reflection->getMethod('stripMarkdownFences');
    $method->setAccessible(true);

    return $method->invoke($adapter, $input);
}

function makeAdapter(): OpenAICompatibleAdapter
{
    $model = new AIModel([
        'name' => 'test',
        'slug' => 'test',
        'adapter_type' => AIAdapterType::OpenAICompatible,
        'base_url' => 'https://example.test/v1',
        'model_id' => 'test-model',
        'api_key' => 'test-key',
    ]);

    return new OpenAICompatibleAdapter($model);
}

it('passes through raw JSON unchanged', function () {
    $adapter = makeAdapter();
    $input = '{"key": "value"}';

    expect(invokeStrip($adapter, $input))->toBe('{"key": "value"}');
});

it('strips markdown fences with json language tag', function () {
    $adapter = makeAdapter();
    $input = "```json\n{\"key\": \"value\"}\n```";

    expect(invokeStrip($adapter, $input))->toBe('{"key": "value"}');
});

it('strips markdown fences without language tag', function () {
    $adapter = makeAdapter();
    $input = "```\n{\"key\": \"value\"}\n```";

    expect(invokeStrip($adapter, $input))->toBe('{"key": "value"}');
});

it('strips fences with leading and trailing whitespace', function () {
    $adapter = makeAdapter();
    $input = "  \n```json\n{\"key\": \"value\"}\n```\n  ";

    expect(invokeStrip($adapter, $input))->toBe('{"key": "value"}');
});

it('handles multiline JSON inside fences', function () {
    $adapter = makeAdapter();
    $input = "```json\n{\n    \"education_level\": \"SS1\",\n    \"subject\": \"Physics\"\n}\n```";

    expect(invokeStrip($adapter, $input))->toBe("{\n    \"education_level\": \"SS1\",\n    \"subject\": \"Physics\"\n}");
});

it('does not strip backticks in the middle of JSON', function () {
    $adapter = makeAdapter();
    $input = '{"code": "`inline code`"}';

    expect(invokeStrip($adapter, $input))->toBe('{"code": "`inline code`"}');
});

function invokeExtractError(OpenAICompatibleAdapter $adapter, mixed $body, string $rawBody = ''): string
{
    $reflection = new ReflectionClass($adapter);
    $method = $reflection->getMethod('extractErrorMessage');
    $method->setAccessible(true);

    return $method->invoke($adapter, $body, $rawBody);
}

it('extracts error from OpenAI error shape', function () {
    $adapter = makeAdapter();
    $body = ['error' => ['message' => 'Invalid API key provided']];

    expect(invokeExtractError($adapter, $body))->toBe('Invalid API key provided');
});

it('extracts error from Gemini array-wrapped error shape', function () {
    $adapter = makeAdapter();
    $body = [
        [
            'error' => [
                'code' => 503,
                'message' => 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
                'status' => 'UNAVAILABLE',
            ],
        ],
    ];

    expect(invokeExtractError($adapter, $body))
        ->toBe('This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.');
});

it('extracts error from string error field', function () {
    $adapter = makeAdapter();
    $body = ['error' => 'Rate limit exceeded'];

    expect(invokeExtractError($adapter, $body))->toBe('Rate limit exceeded');
});

it('falls back to raw body for unstructured errors', function () {
    $adapter = makeAdapter();
    $body = null;

    expect(invokeExtractError($adapter, $body, 'Gateway Timeout'))->toBe('Gateway Timeout');
});

it('returns generic message when no error info available', function () {
    $adapter = makeAdapter();

    expect(invokeExtractError($adapter, null, ''))->toBe('Unknown API error');
});

it('does not return oversized raw bodies', function () {
    $adapter = makeAdapter();
    $longBody = str_repeat('x', 600);

    expect(invokeExtractError($adapter, null, $longBody))->toBe('Unknown API error');
});
