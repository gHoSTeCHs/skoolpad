import { Head, router } from '@inertiajs/react';
import { AlertCircle, FileUp } from 'lucide-react';
import { useState } from 'react';
import { history } from '@/actions/App/Http/Controllers/Admin/BulkImportController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { importStatusLabels, importTypeLabels } from '@/lib/enum-labels';
import type { ImportLogItem, ImportStatus } from '@/types/import';
import type { PaginatedData } from '@/types/models';

interface Props {
    logs: PaginatedData<ImportLogItem>;
    importTypes: string[];
    filters: { import_type?: string; sort?: string; direction?: string };
}

const breadcrumbs = [
    { title: 'Bulk Import', href: '/admin/import' },
    { title: 'History', href: '/admin/import/history' },
];

const statusStyles: Record<ImportStatus, string> = {
    pending: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    completed: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)]',
    failed: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)] hover:bg-[var(--badge-danger-bg)]',
};

function formatDate(dateString: string): { date: string; time: string } {
    const d = new Date(dateString);
    return {
        date: d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
    };
}

export default function ImportHistory({ logs, importTypes, filters }: Props) {
    const [errorDialogLog, setErrorDialogLog] = useState<ImportLogItem | null>(null);
    const historyUrl = history.url();

    function handleFilterChange(key: string, value: string | undefined) {
        router.get(
            historyUrl,
            { ...filters, [key]: value || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function clearFilters() {
        router.get(
            historyUrl,
            { sort: filters.sort, direction: filters.direction },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    const columns: ColumnDef<ImportLogItem>[] = [
        {
            id: 'original_filename',
            header: 'Filename',
            cell: (row) => (
                <span className="block max-w-[200px] truncate font-medium" title={row.original_filename}>
                    {row.original_filename}
                </span>
            ),
        },
        {
            id: 'import_type',
            header: 'Type',
            cell: (row) => (
                <Badge
                    variant="secondary"
                    className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]"
                >
                    {importTypeLabels[row.import_type] ?? row.import_type}
                </Badge>
            ),
            sortable: true,
        },
        {
            id: 'status',
            header: 'Status',
            cell: (row) => (
                <Badge variant="secondary" className={statusStyles[row.status]}>
                    {importStatusLabels[row.status] ?? row.status}
                </Badge>
            ),
            sortable: true,
        },
        {
            id: 'total_rows',
            header: 'Rows',
            cell: (row) => <span className="tabular-nums">{row.total_rows}</span>,
            align: 'right',
        },
        {
            id: 'success_count',
            header: 'Success',
            cell: (row) => (
                <span
                    className="tabular-nums font-medium"
                    style={row.success_count > 0 ? { color: 'var(--badge-primary-fg)' } : undefined}
                >
                    {row.success_count}
                </span>
            ),
            align: 'right',
        },
        {
            id: 'error_count',
            header: 'Errors',
            cell: (row) =>
                row.error_count > 0 ? (
                    <button
                        type="button"
                        onClick={() => setErrorDialogLog(row)}
                        className="inline-flex items-center gap-1 tabular-nums text-sm font-medium hover:underline"
                        style={{ color: 'var(--badge-danger-fg)' }}
                    >
                        <AlertCircle className="size-3.5" />
                        {row.error_count}
                    </button>
                ) : (
                    <span className="tabular-nums text-muted-foreground">0</span>
                ),
            align: 'right',
        },
        {
            id: 'processed_by',
            header: 'Imported by',
            cell: (row) => row.processed_by ?? <span className="text-muted-foreground">—</span>,
        },
        {
            id: 'created_at',
            header: 'Date',
            cell: (row) => {
                const { date, time } = formatDate(row.created_at);
                return (
                    <div>
                        <span className="block text-sm">{date}</span>
                        <span className="block text-xs text-muted-foreground">{time}</span>
                    </div>
                );
            },
            sortable: true,
        },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Import History" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader title="Import History" />

                <DataTable
                    columns={columns}
                    paginatedData={logs}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <Select
                                value={filters.import_type ?? ''}
                                onValueChange={(value) => handleFilterChange('import_type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Import Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Import Types</SelectItem>
                                    {importTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {importTypeLabels[type] ?? type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {filters.import_type && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    emptyState={{
                        icon: FileUp,
                        title: 'No import logs found',
                        description: 'Import history will appear here after your first CSV upload.',
                    }}
                />
            </div>

            <Dialog open={!!errorDialogLog} onOpenChange={(open) => !open && setErrorDialogLog(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Import Errors</DialogTitle>
                        <DialogDescription>
                            {errorDialogLog?.original_filename} — {errorDialogLog?.error_count}{' '}
                            {(errorDialogLog?.error_count ?? 0) === 1 ? 'error' : 'errors'}
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {errorDialogLog?.errors?.map((error, idx) => (
                            <li
                                key={idx}
                                className="flex gap-3 rounded-md border-l-2 bg-muted/30 px-3 py-2.5 text-sm leading-relaxed"
                                style={{ borderLeftColor: 'var(--badge-danger-fg)' }}
                            >
                                <span
                                    className="shrink-0 text-xs font-semibold tabular-nums"
                                    style={{ color: 'var(--badge-danger-fg)' }}
                                >
                                    {idx + 1}.
                                </span>
                                <span className="text-foreground">{error}</span>
                            </li>
                        ))}
                    </ul>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
