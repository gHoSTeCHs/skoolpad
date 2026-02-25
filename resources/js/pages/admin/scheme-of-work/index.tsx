import { Head, router, usePage } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SchemeOfWorkController from '@/actions/App/Http/Controllers/Admin/SchemeOfWorkController';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { SharedData } from '@/types';

interface EducationLevel {
    id: string;
    name: string;
    display_name: string | null;
    sort_order: number;
}

interface CurriculumTier {
    id: string;
    name: string;
    sort_order: number;
    education_levels: EducationLevel[];
}

interface CurriculumSubject {
    id: string;
    name: string;
    slug: string;
}

interface StreamOption {
    id: string;
    name: string;
}

interface EducationSystemOption {
    id: string;
    name: string;
    curriculum_tiers: CurriculumTier[];
    curriculum_subjects: CurriculumSubject[];
    streams: StreamOption[];
}

interface TopicOption {
    id: string;
    title: string;
}

interface SchemeItem {
    id?: string;
    week_number: number;
    topic_label: string;
    canonical_topic_id: string | null;
    content_block_id: string | null;
    canonical_topic?: { id: string; title: string } | null;
    content_block?: { id: string; title: string; path: string } | null;
}

interface Props {
    educationSystems: EducationSystemOption[];
    topics: TopicOption[];
}

const breadcrumbs = [{ title: 'Scheme of Work', href: '/admin/scheme-of-work' }];

const TERM_OPTIONS = [
    { value: '1', label: 'Term 1' },
    { value: '2', label: 'Term 2' },
    { value: '3', label: 'Term 3' },
];

export default function AdminSchemeOfWork({ educationSystems, topics }: Props) {
    const { flash } = usePage<SharedData>().props;

    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [selectedTierId, setSelectedTierId] = useState<string>('');
    const [selectedLevelId, setSelectedLevelId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedStreamId, setSelectedStreamId] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [levelSubjectId, setLevelSubjectId] = useState<string>('');
    const [items, setItems] = useState<SchemeItem[]>([]);

    const selectedSystem = educationSystems.find((s) => s.id === selectedSystemId);
    const availableTiers = selectedSystem?.curriculum_tiers ?? [];
    const selectedTier = availableTiers.find((t) => t.id === selectedTierId);
    const availableLevels = selectedTier?.education_levels ?? [];
    const availableSubjects = selectedSystem?.curriculum_subjects ?? [];
    const availableStreams = selectedSystem?.streams ?? [];
    const hasStreams = availableStreams.length > 0;

    const canLoad =
        selectedLevelId !== '' &&
        selectedSubjectId !== '' &&
        selectedTerm !== '' &&
        (!hasStreams || selectedStreamId !== '');

    function handleSystemChange(value: string) {
        setSelectedSystemId(value);
        setSelectedTierId('');
        setSelectedLevelId('');
        setSelectedSubjectId('');
        setSelectedStreamId('');
        setSelectedTerm('');
        setIsLoaded(false);
        setItems([]);
    }

    function handleTierChange(value: string) {
        setSelectedTierId(value);
        setSelectedLevelId('');
    }

    function handleLoad() {
        if (!canLoad) return;

        setIsLoading(true);
        setIsLoaded(false);

        fetch(SchemeOfWorkController.load.url(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie
                        .split('; ')
                        .find((row) => row.startsWith('XSRF-TOKEN='))
                        ?.split('=')[1] ?? '',
                ),
            },
            body: JSON.stringify({
                education_level_id: selectedLevelId,
                curriculum_subject_id: selectedSubjectId,
                stream_id: hasStreams ? selectedStreamId : null,
                term: Number(selectedTerm),
            }),
        })
            .then((res) => res.json())
            .then((data: { level_subject_id: string; items: SchemeItem[] }) => {
                setLevelSubjectId(data.level_subject_id);
                setItems(data.items);
                setIsLoaded(true);
            })
            .catch(() => {
                setIsLoaded(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    function handleItemChange(index: number, field: keyof SchemeItem, value: string | null) {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    }

    function handleRemoveItem(index: number) {
        setItems((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((item, i) => ({ ...item, week_number: i + 1 }));
        });
    }

    function handleAddWeek() {
        setItems((prev) => [
            ...prev,
            {
                week_number: prev.length + 1,
                topic_label: '',
                canonical_topic_id: null,
                content_block_id: null,
            },
        ]);
    }

    function handleSave() {
        setIsSaving(true);
        router.put(
            SchemeOfWorkController.update.url(),
            {
                curriculum_subject_level_id: levelSubjectId,
                term: Number(selectedTerm),
                items: items.map((item) => ({
                    week_number: item.week_number,
                    topic_label: item.topic_label,
                    canonical_topic_id: item.canonical_topic_id,
                    content_block_id: item.content_block_id,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Scheme of Work" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Scheme of Work"
                    description="Manage weekly teaching plans for secondary school curriculum."
                />

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Education System</label>
                                <Select value={selectedSystemId} onValueChange={handleSystemChange}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select system" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {educationSystems.map((sys) => (
                                            <SelectItem key={sys.id} value={sys.id}>
                                                {sys.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSystemId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Tier</label>
                                    <Select value={selectedTierId} onValueChange={handleTierChange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select tier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTiers.map((tier) => (
                                                <SelectItem key={tier.id} value={tier.id}>
                                                    {tier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedTierId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Level</label>
                                    <Select
                                        value={selectedLevelId}
                                        onValueChange={setSelectedLevelId}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLevels.map((level) => (
                                                <SelectItem key={level.id} value={level.id}>
                                                    {level.display_name ?? level.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedSystemId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Select
                                        value={selectedSubjectId}
                                        onValueChange={setSelectedSubjectId}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSubjects.map((subject) => (
                                                <SelectItem key={subject.id} value={subject.id}>
                                                    {subject.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {hasStreams && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Stream</label>
                                    <Select
                                        value={selectedStreamId}
                                        onValueChange={setSelectedStreamId}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select stream" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableStreams.map((stream) => (
                                                <SelectItem key={stream.id} value={stream.id}>
                                                    {stream.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedSystemId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Term</label>
                                    <Select
                                        value={selectedTerm}
                                        onValueChange={setSelectedTerm}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Select term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TERM_OPTIONS.map((term) => (
                                                <SelectItem key={term.value} value={term.value}>
                                                    {term.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button onClick={handleLoad} disabled={!canLoad || isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {flash.success && (
                    <div
                        className="flex items-start gap-3 rounded-lg border px-4 py-3"
                        style={{
                            borderColor: 'var(--badge-primary-fg)',
                            backgroundColor: 'var(--badge-primary-bg)',
                        }}
                    >
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0"
                            style={{ color: 'var(--badge-primary-fg)' }}
                        />
                        <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--badge-primary-fg)' }}
                        >
                            {flash.success}
                        </p>
                    </div>
                )}

                {isLoaded && (
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="size-5" />
                                Weekly Plan
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleAddWeek}>
                                <Plus className="size-4" />
                                Add Week
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <CalendarDays className="size-10 text-muted-foreground" />
                                    <p className="mt-3 text-sm font-medium">
                                        No weeks configured
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Click "Add Week" to start building the scheme of work.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Week #</TableHead>
                                            <TableHead>Topic Label</TableHead>
                                            <TableHead className="w-[250px]">
                                                Canonical Topic
                                            </TableHead>
                                            <TableHead className="w-[200px]">
                                                Content Block
                                            </TableHead>
                                            <TableHead className="w-[60px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {item.week_number}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={item.topic_label}
                                                        onChange={(e) =>
                                                            handleItemChange(
                                                                index,
                                                                'topic_label',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Enter topic label"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={item.canonical_topic_id ?? ''}
                                                        onValueChange={(value) =>
                                                            handleItemChange(
                                                                index,
                                                                'canonical_topic_id',
                                                                value === 'none' ? null : value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select topic" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">
                                                                None
                                                            </SelectItem>
                                                            {topics.map((topic) => (
                                                                <SelectItem
                                                                    key={topic.id}
                                                                    value={topic.id}
                                                                >
                                                                    {topic.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {item.content_block?.title ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="size-4 text-destructive" />
                                                        <span className="sr-only">
                                                            Remove week
                                                        </span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            <div className="mt-4 flex justify-end">
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save All'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
