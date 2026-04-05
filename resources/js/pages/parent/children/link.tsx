import { Head, Link, router, usePage } from '@inertiajs/react';
import { LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { create, linkChild } from '@/actions/App/Http/Controllers/ParentDashboard/ChildLinkController';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/ParentDashboard/ParentDashboardController';
import ParentLayout from '@/layouts/parent-layout';

export default function LinkChild() {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [inviteCode, setInviteCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(linkChild.url(), {
            invite_code: inviteCode.toUpperCase(),
        }, { onFinish: () => setSubmitting(false) });
    }

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: dashboardIndex.url() },
            { title: 'Link Child', href: '#' },
        ]}>
            <Head title="Link to Existing Student" />

            <div className="mx-auto max-w-lg space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Link to Existing Student</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        If your child already uses Skoolpad, enter their 6-character invite code to connect.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--canopy-50)] dark:bg-[var(--canopy-950)]">
                            <LinkIcon className="size-5 text-[var(--canopy-600)]" />
                        </div>

                        <label htmlFor="invite_code" className="mb-3 block text-sm font-medium text-foreground">
                            Invite Code
                        </label>
                        <input
                            id="invite_code"
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder="ABC123"
                            maxLength={6}
                            autoComplete="off"
                            className="mx-auto block w-48 rounded-lg border border-border bg-card px-4 py-3 text-center font-mono text-2xl uppercase tracking-[0.3em] text-foreground placeholder:text-muted-foreground/40 focus:border-[var(--canopy-400)] focus:outline-none focus:ring-1 focus:ring-[var(--canopy-400)]"
                        />
                        {errors.invite_code && (
                            <p className="mt-2 text-xs text-red-500">{errors.invite_code}</p>
                        )}
                        <p className="mt-3 text-xs text-muted-foreground">
                            Your child can find their invite code in their profile settings.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={inviteCode.length !== 6 || submitting}
                        className="mt-6 w-full rounded-lg bg-[var(--canopy-600)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                    >
                        {submitting ? 'Linking...' : 'Link to Child'}
                    </button>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Don&apos;t have a code?{' '}
                        <Link href={create.url()} className="font-medium text-[var(--canopy-600)] hover:underline">
                            Create a new account instead
                        </Link>
                    </p>
                </form>
            </div>
        </ParentLayout>
    );
}
