import { Card } from '@/components/ui/card';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableSkeletonProps {
    columnCount: number;
    rowCount?: number;
    hasToolbar?: boolean;
    hasActions?: boolean;
    hasPagination?: boolean;
}

export function DataTableSkeleton({
    columnCount,
    rowCount = 8,
    hasToolbar = true,
    hasActions = true,
    hasPagination = true,
}: DataTableSkeletonProps) {
    const totalColumns = hasActions ? columnCount + 1 : columnCount;

    return (
        <Card className="overflow-hidden p-0">
            {hasToolbar && (
                <div className="flex items-center gap-3 border-b px-4 py-3">
                    <SkeletonText className="h-9 w-[240px]" />
                    <SkeletonText className="h-9 w-[180px]" />
                </div>
            )}

            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        {Array.from({ length: totalColumns }).map((_, i) => (
                            <TableHead key={i} className="px-4 py-3">
                                <SkeletonText className="h-3 w-16" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: rowCount }).map((_, rowIdx) => (
                        <TableRow key={rowIdx}>
                            {Array.from({ length: columnCount }).map((_, colIdx) => (
                                <TableCell key={colIdx} className="px-4 py-3">
                                    <SkeletonText className="h-4 w-3/4" />
                                </TableCell>
                            ))}
                            {hasActions && (
                                <TableCell className="px-4 py-3">
                                    <Skeleton className="size-8" />
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {hasPagination && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                    <SkeletonText className="h-4 w-[160px]" />
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="size-8" />
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
