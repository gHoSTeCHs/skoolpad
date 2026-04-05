import { Head, router } from '@inertiajs/react';
import { Bell, Clock, Settings } from 'lucide-react';
import { useState } from 'react';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/ParentDashboard/ParentDashboardController';
import { updateNotifications, updateStudyDuration } from '@/actions/App/Http/Controllers/ParentDashboard/ParentSettingsController';
import ParentLayout from '@/layouts/parent-layout';
import type { ChildSettingConfig, NotificationPreferences } from '@/types/parent';

interface ParentSettingsProps {
    notification_preferences: NotificationPreferences;
    children_settings: ChildSettingConfig[];
}

export default function ParentSettings({ notification_preferences, children_settings }: ParentSettingsProps) {
    const [channels, setChannels] = useState<string[]>(notification_preferences.alert_channels ?? []);
    const [savingNotifications, setSavingNotifications] = useState(false);

    const [childDurations, setChildDurations] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        children_settings.forEach((c) => {
            initial[c.link_id] = c.study_goal_minutes ?? 30;
        });
        return initial;
    });
    const [savingChild, setSavingChild] = useState<string | null>(null);

    function toggleChannel(channel: string) {
        setChannels((prev) =>
            prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
        );
    }

    function saveNotifications() {
        setSavingNotifications(true);
        router.put(updateNotifications.url(), { alert_channels: channels }, {
            preserveScroll: true,
            onFinish: () => setSavingNotifications(false),
        });
    }

    function saveChildDuration(linkId: string) {
        setSavingChild(linkId);
        router.put(updateStudyDuration.url(linkId), {
            study_goal_minutes: childDurations[linkId],
        }, {
            preserveScroll: true,
            onFinish: () => setSavingChild(null),
        });
    }

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: dashboardIndex.url() },
            { title: 'Settings', href: '#' },
        ]}>
            <Head title="Parent Settings" />

            <div className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your notification preferences and per-child study configuration.
                    </p>
                </div>

                {/* Notification Preferences */}
                <section className="rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Bell className="size-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold text-foreground">Alert Channels</h2>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Choose how you want to receive notifications about your child&apos;s progress.
                        </p>
                    </div>
                    <div className="divide-y divide-border">
                        {[
                            { key: 'email', label: 'Email notifications', description: 'Weekly reports and exam alerts via email' },
                            { key: 'in_app', label: 'In-app notifications', description: 'Alerts within the Skoolpad dashboard' },
                        ].map((channel) => (
                            <label key={channel.key} className="flex cursor-pointer items-center justify-between px-5 py-4 transition-colors hover:bg-muted">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{channel.label}</p>
                                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={channels.includes(channel.key)}
                                    onChange={() => toggleChannel(channel.key)}
                                    className="size-4 rounded border-border text-[var(--canopy-600)] focus:ring-[var(--canopy-500)]"
                                />
                            </label>
                        ))}
                    </div>
                    <div className="border-t border-border px-5 py-3">
                        <button
                            type="button"
                            onClick={saveNotifications}
                            disabled={savingNotifications}
                            className="rounded-md bg-[var(--canopy-600)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                        >
                            {savingNotifications ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </div>
                </section>

                {/* Per-child Settings */}
                {children_settings.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <Settings className="size-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold text-foreground">Children</h2>
                        </div>
                        <div className="space-y-4">
                            {children_settings.map((child) => (
                                <div key={child.link_id} className="rounded-xl border border-border bg-card">
                                    <div className="border-b border-border px-5 py-4">
                                        <p className="text-sm font-semibold text-foreground">
                                            {child.child_name ?? 'Child'}
                                        </p>
                                        {child.current_term && (
                                            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                                                {child.current_term} term
                                                {child.term_start_date && ` · Started ${child.term_start_date}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="size-4 shrink-0 text-muted-foreground" />
                                            <label className="flex flex-1 items-center justify-between">
                                                <span className="text-sm text-foreground">Daily study goal</span>
                                                <select
                                                    value={childDurations[child.link_id] ?? 30}
                                                    onChange={(e) => setChildDurations((prev) => ({
                                                        ...prev,
                                                        [child.link_id]: Number(e.target.value),
                                                    }))}
                                                    className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-[var(--canopy-400)] focus:outline-none focus:ring-1 focus:ring-[var(--canopy-400)]"
                                                >
                                                    <option value={15}>15 minutes</option>
                                                    <option value={30}>30 minutes</option>
                                                    <option value={45}>45 minutes</option>
                                                    <option value={60}>60 minutes</option>
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="border-t border-border px-5 py-3">
                                        <button
                                            type="button"
                                            onClick={() => saveChildDuration(child.link_id)}
                                            disabled={savingChild === child.link_id}
                                            className="rounded-md bg-[var(--canopy-600)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                                        >
                                            {savingChild === child.link_id ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </ParentLayout>
    );
}
