import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Pagination } from '@/components/admin/pagination';
import { Card } from '@/components/ui/card';
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

export function DataTable<T>({ columns, paginatedData, getRowKey, toolbar, renderActions, emptyState }: DataTableProps<T>) {
    const { data, meta, links } = paginatedData;
    const Icon = emptyState.icon;
    const hasData = data.length > 0;

    return (
        <Card className="overflow-hidden p-0">
            {toolbar && (
                <div className="border-b px-4 py-3">
                    {toolbar}
                </div>
            )}

            {hasData ? (
                <>
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
                                        )}
                                    >
                                        {col.header}
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
                            {data.map((row) => (
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
                            ))}
                        </TableBody>
                    </Table>

                    {meta.last_page > 1 && (
                        <div className="border-t px-4 py-3">
                            <Pagination meta={meta} links={links} />
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
                        <Icon className="size-6 text-muted-foreground/60" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-foreground">{emptyState.title}</p>
                    <p className="mt-1 max-w-[280px] text-sm text-muted-foreground">
                        {emptyState.description}
                    </p>
                </div>
            )}
        </Card>
    );
}
