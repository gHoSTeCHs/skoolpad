import { router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/admin/pagination';
import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';

export interface ColumnDef<T> {
    id: string;
    header: string;
    cell: (row: T) => ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string;
    className?: string;
    sortable?: boolean;
}

interface EmptyStateConfig {
    icon: LucideIcon;
    title: string;
    description: string;
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    paginatedData: PaginatedData<T>;
    getRowKey: (row: T) => string;
    toolbar?: ReactNode;
    renderActions?: (row: T) => ReactNode;
    emptyState: EmptyStateConfig;
}

function useCurrentSort(): { sort: string | null; direction: 'asc' | 'desc' } {
    const params = new URLSearchParams(window.location.search);
    return {
        sort: params.get('sort'),
        direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
    };
}

function handleSort(columnId: string) {
    const params = new URLSearchParams(window.location.search);
    const currentSort = params.get('sort');
    const currentDir = params.get('direction');

    if (currentSort === columnId) {
        params.set('direction', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
        params.set('sort', columnId);
        params.set('direction', 'asc');
    }
    params.delete('page');

    router.get(window.location.pathname + '?' + params.toString(), {}, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });
}

function SortIndicator({ columnId, currentSort }: { columnId: string; currentSort: { sort: string | null; direction: 'asc' | 'desc' } }) {
    if (currentSort.sort !== columnId) {
        return <ArrowUpDown className="size-3.5 text-muted-foreground/40" />;
    }
    if (currentSort.direction === 'asc') {
        return <ArrowUp className="size-3.5" />;
    }
    return <ArrowDown className="size-3.5" />;
}

export function DataTable<T>({ columns, paginatedData, getRowKey, toolbar, renderActions, emptyState }: DataTableProps<T>) {
    const { data, meta, links } = paginatedData;
    const Icon = emptyState.icon;
    const hasData = data.length > 0;
    const [isLoading, setIsLoading] = useState(false);
    const currentSort = useCurrentSort();

    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    const renderSkeletonRows = () =>
        Array.from({ length: 8 }).map((_, rowIdx) => (
            <TableRow key={`skeleton-${rowIdx}`}>
                {columns.map((col) => (
                    <TableCell
                        key={col.id}
                        className={cn(
                            'px-4 py-3',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                        )}
                    >
                        <SkeletonText className="h-4 w-3/4" />
                    </TableCell>
                ))}
                {renderActions && (
                    <TableCell className="px-4 py-3">
                        <Skeleton className="size-8" />
                    </TableCell>
                )}
            </TableRow>
        ));

    if (!hasData && !isLoading) {
        return (
            <Card className="overflow-hidden p-0">
                {toolbar && (
                    <div className="border-b px-4 py-3">
                        {toolbar}
                    </div>
                )}
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
                        <Icon className="size-6 text-muted-foreground/60" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-foreground">{emptyState.title}</p>
                    <p className="mt-1 max-w-[280px] text-sm text-muted-foreground">
                        {emptyState.description}
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden p-0">
            {toolbar && (
                <div className="border-b px-4 py-3">
                    {toolbar}
                </div>
            )}

            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        {columns.map((col) => (
                            <TableHead
                                key={col.id}
                                className={cn(
                                    'px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground',
                                    col.align === 'right' && 'text-right',
                                    col.align === 'center' && 'text-center',
                                    col.width,
                                    col.className,
                                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                                )}
                                onClick={col.sortable ? () => handleSort(col.id) : undefined}
                            >
                                {col.sortable ? (
                                    <span className={cn(
                                        'inline-flex items-center gap-1',
                                        col.align === 'right' && 'flex-row-reverse',
                                    )}>
                                        {col.header}
                                        <SortIndicator columnId={col.id} currentSort={currentSort} />
                                    </span>
                                ) : (
                                    col.header
                                )}
                            </TableHead>
                        ))}
                        {renderActions && (
                            <TableHead className="w-[60px] px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                                Actions
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading
                        ? renderSkeletonRows()
                        : data.map((row) => (
                            <TableRow key={getRowKey(row)}>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.id}
                                        className={cn(
                                            'px-4 py-3',
                                            col.align === 'right' && 'text-right',
                                            col.align === 'center' && 'text-center',
                                        )}
                                    >
                                        {col.cell(row)}
                                    </TableCell>
                                ))}
                                {renderActions && (
                                    <TableCell className="px-4 py-3">
                                        {renderActions(row)}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    }
                </TableBody>
            </Table>

            {!isLoading && meta.last_page > 1 && (
                <div className="border-t px-4 py-3">
                    <Pagination meta={meta} links={links} />
                </div>
            )}
        </Card>
    );
}
