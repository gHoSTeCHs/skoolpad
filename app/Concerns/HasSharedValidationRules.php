<?php

namespace App\Concerns;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

trait HasSharedValidationRules
{
    /**
     * Get shared validation rules for both store and update requests
     *
     * @return array<string, array<int, mixed>>
     */
    abstract protected function sharedRules(): array;

    /**
     * Get unique validation rules (differs between store/update)
     *
     * @return array<string, array<int, mixed>>
     */
    abstract protected function uniqueRules(): array;

    /**
     * Merge shared and unique rules
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return array_merge($this->sharedRules(), $this->uniqueRules());
    }

    /**
     * Create a unique rule for update requests with ignore
     */
    protected function uniqueForUpdate(string $table, string $routeParameter, ?callable $scopeCallback = null): Unique
    {
        $rule = Rule::unique($table)->ignore($this->route($routeParameter));

        if ($scopeCallback) {
            $scopeCallback($rule, $this);
        }

        return $rule;
    }

    /**
     * Create a unique rule for store requests with optional scope
     */
    protected function uniqueForStore(string $table, ?callable $scopeCallback = null): Unique
    {
        $rule = Rule::unique($table);

        if ($scopeCallback) {
            $scopeCallback($rule, $this);
        }

        return $rule;
    }
}
