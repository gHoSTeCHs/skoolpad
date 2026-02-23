import { Head } from '@inertiajs/react';
import { Users } from 'lucide-react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';
import type { UserFilters, UserListItem } from '@/types/users';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    users: PaginatedData<UserListItem>;
    filters: UserFilters;
    roles: EnumOption[];
}

const roleBadgeStyles: Record<string, string> = {
    super_admin: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)] hover:bg-[var(--badge-danger-bg)]',
    content_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    institution_moderator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 reader:bg-purple-900/30 reader:text-purple-400',
    content_reviewer: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)] hover:bg-[var(--badge-reward-bg)]',
    community_moderator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 reader:bg-orange-900/30 reader:text-orange-400',
    student: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]',
};

const breadcrumbs = [{ title: 'Users', href: '/admin/users' }];

const columns: ColumnDef<UserListItem>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name}</span>,
        sortable: true,
    },
    {
        id: 'email',
        header: 'Email',
        cell: (row) => row.email,
        sortable: true,
    },
    {
        id: 'role',
        header: 'Role',
        cell: (row) => (
            <Badge variant="secondary" className={roleBadgeStyles[row.role] ?? ''}>
                {row.role_label}
            </Badge>
        ),
        sortable: true,
    },
    {
        id: 'institution',
        header: 'Institution',
        cell: (row) => row.institution_abbreviation ?? '—',
    },
    {
        id: 'is_active',
        header: 'Status',
        cell: (row) => <StatusBadge isActive={row.is_active} />,
        sortable: true,
    },
    {
        id: 'last_login_at',
        header: 'Last Login',
        cell: (row) => (row.last_login_at ? formatDate(row.last_login_at) : 'Never'),
        sortable: true,
    },
    {
        id: 'created_at',
        header: 'Created',
        cell: (row) => formatDate(row.created_at),
        sortable: true,
    },
];

export default function AdminUsers({ users, filters, roles }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: UserController.index.url(),
        filters,
    });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader title="Users" />

                <DataTable
                    columns={columns}
                    paginatedData={users}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={UserController.index.url()}
                                placeholder="Search users..."
                                queryParams={{
                                    role: filters.role,
                                    is_active: filters.is_active,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.role ?? ''}
                                onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.is_active ?? ''}
                                onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions
                            editUrl={UserController.edit.url(row.id)}
                            actions={[{ label: 'View Details', href: UserController.show.url(row.id) }]}
                        />
                    )}
                    emptyState={{
                        icon: Users,
                        title: 'No users found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
