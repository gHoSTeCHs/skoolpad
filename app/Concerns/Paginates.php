<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

trait Paginates
{
    protected function applySorting(Builder $query, Request $request, array $sortable, string $default = 'updated_at', string $defaultDirection = 'desc'): Builder
    {
        $sort = $request->string('sort');
        $direction = $request->string('direction', 'asc')->value() === 'desc' ? 'desc' : 'asc';

        if ($sort->isNotEmpty() && in_array($sort->value(), $sortable, true)) {
            return $query->orderBy($sort->value(), $direction);
        }

        return $query->orderBy($default, $defaultDirection);
    }

    protected function paginated(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'links' => [
                'prev' => $paginator->previousPageUrl(),
                'next' => $paginator->nextPageUrl(),
            ],
        ];
    }
}
