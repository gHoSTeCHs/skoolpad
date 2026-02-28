import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, Globe, Pencil } from 'lucide-react';
import { useState } from 'react';

import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import type { CalendarTermModel, Institution } from '@/types/models';

import CalendarTermsTab from './partials/calendar-terms-tab';
import EducationSystemsTab from './partials/education-systems-tab';

interface InstitutionDetail extends Institution {
    country?: { id: string; name: string };
    institution_type_model?: { id: string; name: string };
    education_systems?: { id: string; name: string }[];
    calendar_terms?: CalendarTermModel[];
}

type TabKey = 'education-systems' | 'calendar-terms';

interface Props {
    institution: InstitutionDetail;
    educationSystems: { id: string; name: string }[];
}

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'education-systems', label: 'Education Systems', icon: Globe },
    { key: 'calendar-terms', label: 'Calendar Terms', icon: CalendarDays },
];

export default function AdminInstitutionShow({ institution, educationSystems }: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('education-systems');

    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: '#' },
    ];

    const stats = [
        { label: 'Education Systems', value: institution.education_systems?.length ?? 0, icon: Globe },
        { label: 'Calendar Terms', value: institution.calendar_terms?.length ?? 0, icon: CalendarDays },
        { label: 'Faculties', value: institution.faculties_count ?? 0, icon: Building2 },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={institution.name} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                {institution.name}
                            </h1>
                            {institution.abbreviation && <Badge variant="secondary">{institution.abbreviation}</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {institution.country && <span>{institution.country.name}</span>}
                            {institution.institution_type_model && (
                                <>
                                    <span>&middot;</span>
                                    <span>{institution.institution_type_model.name}</span>
                                </>
                            )}
                            {institution.state && (
                                <>
                                    <span>&middot;</span>
                                    <span>{institution.state}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={InstitutionController.edit.url(institution.id)}>
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="flex items-center gap-3 px-4 py-3">
                            <stat.icon className="h-5 w-5 shrink-0 text-primary" />
                            <div>
                                <p className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>
                                    {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    {stat.label}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="flex gap-1 border-b">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'education-systems' && (
                    <EducationSystemsTab
                        institutionId={institution.id}
                        attached={institution.education_systems ?? []}
                        available={educationSystems}
                    />
                )}
                {activeTab === 'calendar-terms' && (
                    <CalendarTermsTab
                        institutionId={institution.id}
                        terms={institution.calendar_terms ?? []}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
