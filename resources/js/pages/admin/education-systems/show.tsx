import { Head, Link } from '@inertiajs/react';
import { BookOpen, ClipboardCheck, GitBranch, GraduationCap, Layers, Pencil } from 'lucide-react';
import { useState } from 'react';

import EducationSystemController from '@/actions/App/Http/Controllers/Admin/EducationSystemController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import type { AssessmentTypeModel, CurriculumSubject, CurriculumTier, EducationSystem, Stream } from '@/types/models';

import AssessmentsTab from './partials/assessments-tab';
import StreamsTab from './partials/streams-tab';
import SubjectsTab from './partials/subjects-tab';
import TiersTab from './partials/tiers-tab';

interface EducationSystemDetail extends EducationSystem {
    curriculum_tiers: CurriculumTier[];
    streams: Stream[];
    curriculum_subjects: CurriculumSubject[];
    assessment_types: AssessmentTypeModel[];
}

type TabKey = 'structure' | 'streams' | 'subjects' | 'assessments';

interface Props {
    educationSystem: EducationSystemDetail;
    disciplines: { id: string; name: string }[];
    gradingScales: { id: string; name: string }[];
}

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'structure', label: 'Structure', icon: Layers },
    { key: 'streams', label: 'Streams', icon: GitBranch },
    { key: 'subjects', label: 'Subjects', icon: BookOpen },
    { key: 'assessments', label: 'Assessments', icon: ClipboardCheck },
];

export default function AdminEducationSystemShow({ educationSystem, disciplines, gradingScales }: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('structure');

    const breadcrumbs = [
        { title: 'Education Systems', href: EducationSystemController.index.url() },
        { title: educationSystem.name, href: '#' },
    ];

    const totalLevels = educationSystem.curriculum_tiers.reduce(
        (sum, tier) => sum + (tier.education_levels?.length ?? 0),
        0,
    );

    const stats = [
        { label: 'Tiers', value: educationSystem.curriculum_tiers.length, icon: Layers },
        { label: 'Levels', value: totalLevels, icon: GraduationCap },
        { label: 'Streams', value: educationSystem.streams.length, icon: GitBranch },
        { label: 'Subjects', value: educationSystem.curriculum_subjects.length, icon: BookOpen },
        { label: 'Assessments', value: educationSystem.assessment_types.length, icon: ClipboardCheck },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={educationSystem.name} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                {educationSystem.name}
                            </h1>
                            <Badge variant="secondary">{educationSystem.system_type}</Badge>
                        </div>
                        {educationSystem.country && (
                            <p className="text-sm text-muted-foreground">
                                {educationSystem.country.name} ({educationSystem.country.code})
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">Slug: {educationSystem.slug}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={EducationSystemController.edit.url(educationSystem.id)}>
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Edit System
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

                {activeTab === 'structure' && (
                    <TiersTab tiers={educationSystem.curriculum_tiers} systemId={educationSystem.id} />
                )}
                {activeTab === 'streams' && (
                    <StreamsTab
                        streams={educationSystem.streams}
                        tiers={educationSystem.curriculum_tiers}
                        systemId={educationSystem.id}
                    />
                )}
                {activeTab === 'subjects' && (
                    <SubjectsTab
                        subjects={educationSystem.curriculum_subjects}
                        disciplines={disciplines}
                        systemId={educationSystem.id}
                    />
                )}
                {activeTab === 'assessments' && (
                    <AssessmentsTab
                        assessments={educationSystem.assessment_types}
                        tiers={educationSystem.curriculum_tiers}
                        gradingScales={gradingScales}
                        systemId={educationSystem.id}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
