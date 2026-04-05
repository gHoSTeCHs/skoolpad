import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/ParentDashboard/ParentOnboardingController';

export default function ParentOnboarding() {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [relationship, setRelationship] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(store.url(), {
            relationship,
            phone_number: phoneNumber || null,
        }, { onFinish: () => setSubmitting(false) });
    }

    return (
        <>
            <Head title="Parent Onboarding" />

            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)]">
                            <span className="font-display text-lg font-extrabold text-white">S</span>
                        </div>
                        <h1 className="font-display text-2xl font-bold text-foreground">Welcome to Skoolpad</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Set up your parent profile to get started</p>
                    </div>

                    {/* Form card */}
                    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="space-y-5">
                            {/* Relationship */}
                            <div>
                                <label htmlFor="relationship" className="mb-1.5 block text-sm font-medium text-foreground">
                                    I am the child&apos;s <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="relationship"
                                    value={relationship}
                                    onChange={(e) => setRelationship(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-[var(--canopy-400)] focus:outline-none focus:ring-1 focus:ring-[var(--canopy-400)]"
                                >
                                    <option value="">Select relationship</option>
                                    <option value="mother">Mother</option>
                                    <option value="father">Father</option>
                                    <option value="guardian">Guardian</option>
                                </select>
                                {errors.relationship && (
                                    <p className="mt-1 text-xs text-red-500">{errors.relationship}</p>
                                )}
                            </div>

                            {/* Phone number */}
                            <div>
                                <label htmlFor="phone_number" className="mb-1.5 block text-sm font-medium text-foreground">
                                    Phone number <span className="text-xs text-muted-foreground">(optional)</span>
                                </label>
                                <input
                                    id="phone_number"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="e.g. 08012345678"
                                    maxLength={20}
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--canopy-400)] focus:outline-none focus:ring-1 focus:ring-[var(--canopy-400)]"
                                />
                                {errors.phone_number && (
                                    <p className="mt-1 text-xs text-red-500">{errors.phone_number}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!relationship || submitting}
                            className="mt-6 w-full rounded-lg bg-[var(--canopy-600)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                        >
                            {submitting ? 'Setting up...' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
