import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, ClipboardList, FileText, Pencil } from 'lucide-react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { UserDetail } from '@/types/users';

interface Props {
    user: UserDetail;
}

const roleBadgeStyles: Record<string, string> = {
    super_admin: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)] hover:bg-[var(--badge-danger-bg)]',
    content_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    institution_moderator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 reader:bg-purple-900/30 reader:text-purple-400',
    content_reviewer: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)] hover:bg-[var(--badge-reward-bg)]',
    community_moderator: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 reader:bg-orange-900/30 reader:text-orange-400',
    student: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]',
};

const breadcrumbs = [
    { title: 'Users', href: '/admin/users' },
    { title: 'Details', href: '#' },
];

export default function AdminUserShow({ user }: Props) {
    const profile = user.student_profile;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`User: ${user.name}`} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Link
                        href={UserController.index.url()}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Users
                    </Link>
                    <Button asChild size="sm">
                        <Link href={UserController.edit.url(user.id)}>
                            <Pencil className="size-4" />
                            Edit User
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-display text-xl">User Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                                <dd className="mt-1 text-sm">{user.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                                <dd className="mt-1 text-sm">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                                <dd className="mt-1">
                                    <Badge variant="secondary" className={roleBadgeStyles[user.role] ?? ''}>
                                        {user.role_label}
                                    </Badge>
                                    <p className="mt-1 text-xs text-muted-foreground">{user.role_description}</p>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                                <dd className="mt-1">
                                    <StatusBadge isActive={user.is_active} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Last Login</dt>
                                <dd className="mt-1 text-sm">
                                    {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Joined</dt>
                                <dd className="mt-1 text-sm">{formatDate(user.created_at)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-[var(--badge-primary-bg)] p-2.5">
                                <ClipboardList className="size-5 text-[var(--badge-primary-fg)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{user.practice_sessions_count}</p>
                                <p className="text-sm text-muted-foreground">Practice Sessions</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-[var(--badge-reward-bg)] p-2.5">
                                <FileText className="size-5 text-[var(--badge-reward-fg)]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{user.student_notes_count}</p>
                                <p className="text-sm text-muted-foreground">Notes</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30 reader:bg-blue-900/30">
                                <BookOpen className="size-5 text-blue-700 dark:text-blue-400 reader:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{user.content_submissions_count}</p>
                                <p className="text-sm text-muted-foreground">Submissions</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {profile && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-display text-xl">Student Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Institution</dt>
                                    <dd className="mt-1 text-sm">{profile.institution?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Faculty</dt>
                                    <dd className="mt-1 text-sm">{profile.faculty?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                                    <dd className="mt-1 text-sm">{profile.department?.name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Level</dt>
                                    <dd className="mt-1 text-sm">{profile.level ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Matric Number</dt>
                                    <dd className="mt-1 text-sm">{profile.matric_number ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Enrolled Courses</dt>
                                    <dd className="mt-1 text-sm">{profile.student_courses?.length ?? 0}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
