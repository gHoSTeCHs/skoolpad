import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { storeChild } from '@/actions/App/Http/Controllers/ParentDashboard/ChildLinkController';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/ParentDashboard/ParentDashboardController';
import ParentLayout from '@/layouts/parent-layout';

export default function AddChild() {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;

    const [form, setForm] = useState({
        child_name: '',
        child_email: '',
        child_password: '',
        child_password_confirmation: '',
        education_level_id: '',
    });
    const [submitting, setSubmitting] = useState(false);

    function update(key: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(storeChild.url(), form, {
            onFinish: () => setSubmitting(false),
        });
    }

    const fields: { key: keyof typeof form; label: string; type: string; placeholder: string; required: boolean }[] = [
        { key: 'child_name', label: "Child's full name", type: 'text', placeholder: 'e.g. Adaeze Okafor', required: true },
        { key: 'child_email', label: "Child's email", type: 'email', placeholder: 'e.g. adaeze@example.com', required: true },
        { key: 'child_password', label: 'Password', type: 'password', placeholder: 'At least 8 characters', required: true },
        { key: 'child_password_confirmation', label: 'Confirm password', type: 'password', placeholder: 'Re-enter password', required: true },
        { key: 'education_level_id', label: 'Education level ID', type: 'text', placeholder: 'Education level UUID', required: true },
    ];

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: dashboardIndex.url() },
            { title: 'Add Child', href: '#' },
        ]}>
            <Head title="Add Child" />

            <div className="mx-auto max-w-lg space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Add Your Child</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create an account for your child so you can track their learning progress.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
                    <div className="space-y-4">
                        {fields.map((field) => (
                            <div key={field.key}>
                                <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium text-foreground">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    id={field.key}
                                    type={field.type}
                                    value={form[field.key]}
                                    onChange={(e) => update(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--canopy-400)] focus:outline-none focus:ring-1 focus:ring-[var(--canopy-400)]"
                                />
                                {errors[field.key] && (
                                    <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 w-full rounded-lg bg-[var(--canopy-600)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                    >
                        {submitting ? 'Creating account...' : 'Create Child Account'}
                    </button>
                </form>
            </div>
        </ParentLayout>
    );
}
