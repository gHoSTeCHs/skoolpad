import { router, useForm } from '@inertiajs/react';
import { ClipboardCheck, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AssessmentTypeController from '@/actions/App/Http/Controllers/Admin/AssessmentTypeController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSlug } from '@/hooks/use-slug';
import type { AssessmentTypeModel, CurriculumTier } from '@/types/models';

interface AssessmentsTabProps {
    assessments: AssessmentTypeModel[];
    tiers: CurriculumTier[];
    gradingScales: { id: string; name: string }[];
    systemId: string;
}

export default function AssessmentsTab({ assessments, tiers, gradingScales, systemId }: AssessmentsTabProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<AssessmentTypeModel | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AssessmentTypeModel | null>(null);
    const { generateSlug, slugManuallyEdited, resetSlugTracking } = useSlug();

    const form = useForm({
        name: '',
        slug: '',
        tier_id: '' as string | null,
        is_exit_exam: false,
        is_entrance_exam: false,
        grading_scale_id: '' as string | null,
    });

    function handleNameChange(value: string) {
        form.setData('name', value);
        if (!slugManuallyEdited.current) {
            form.setData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
        }
    }

    function openCreate() {
        setEditing(null);
        resetSlugTracking();
        form.reset();
        form.clearErrors();
        setDialogOpen(true);
    }

    function openEdit(assessment: AssessmentTypeModel) {
        setEditing(assessment);
        slugManuallyEdited.current = true;
        form.setData({
            name: assessment.name,
            slug: assessment.slug,
            tier_id: assessment.tier_id ?? '',
            is_exit_exam: assessment.is_exit_exam,
            is_entrance_exam: assessment.is_entrance_exam,
            grading_scale_id: assessment.grading_scale_id ?? '',
        });
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const data = {
            ...form.data,
            tier_id: form.data.tier_id || null,
            grading_scale_id: form.data.grading_scale_id || null,
        };

        if (editing) {
            form.transform(() => data).put(AssessmentTypeController.update.url(editing.id), {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.transform(() => data).post(AssessmentTypeController.store.url(systemId), {
                onSuccess: () => setDialogOpen(false),
            });
        }
    }

    function handleDelete(assessment: AssessmentTypeModel) {
        router.delete(AssessmentTypeController.destroy.url(assessment.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Assessment Types</h3>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-1 size-4" />
                    Add Assessment
                </Button>
            </div>

            <Card>
                {assessments.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Exam Type</TableHead>
                                <TableHead>Grading Scale</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assessments.map((assessment) => (
                                <TableRow key={assessment.id}>
                                    <TableCell className="font-medium">{assessment.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{assessment.slug}</TableCell>
                                    <TableCell>
                                        {assessment.tier ? assessment.tier.name : <span className="text-muted-foreground">&mdash;</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {assessment.is_exit_exam && <Badge variant="secondary">Exit</Badge>}
                                            {assessment.is_entrance_exam && <Badge variant="outline">Entrance</Badge>}
                                            {!assessment.is_exit_exam && !assessment.is_entrance_exam && (
                                                <span className="text-muted-foreground">&mdash;</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {assessment.grading_scale ? (
                                            assessment.grading_scale.name
                                        ) : (
                                            <span className="text-muted-foreground">&mdash;</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontal className="size-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(assessment)}>
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => setDeleteTarget(assessment)}
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ClipboardCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">No assessment types yet</p>
                        <p className="text-xs text-muted-foreground/70">Add assessment types to this education system.</p>
                    </div>
                )}
            </Card>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEditing(null);
                        resetSlugTracking();
                        form.reset();
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Assessment Type' : 'Add Assessment Type'}</DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Update the details for this assessment type.'
                                : 'Create a new assessment type for this education system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Name" name="name" error={form.errors.name} required>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. WAEC SSCE"
                            />
                        </FormField>

                        <FormField label="Slug" name="slug" error={form.errors.slug}>
                            <Input
                                id="slug"
                                value={form.data.slug}
                                onChange={(e) => {
                                    slugManuallyEdited.current = true;
                                    form.setData('slug', e.target.value);
                                }}
                                placeholder="e.g. waec-ssce"
                            />
                        </FormField>

                        <FormField label="Curriculum Tier" name="tier_id" error={form.errors.tier_id}>
                            <Select
                                value={form.data.tier_id ?? ''}
                                onValueChange={(value) => form.setData('tier_id', value === 'none' ? '' : value)}
                            >
                                <SelectTrigger id="tier_id">
                                    <SelectValue placeholder="Select tier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {tiers.map((tier) => (
                                        <SelectItem key={tier.id} value={tier.id}>
                                            {tier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Exit Exam" name="is_exit_exam" error={form.errors.is_exit_exam}>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_exit_exam"
                                    checked={form.data.is_exit_exam}
                                    onCheckedChange={(checked) => form.setData('is_exit_exam', !!checked)}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {form.data.is_exit_exam ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </FormField>

                        <FormField label="Entrance Exam" name="is_entrance_exam" error={form.errors.is_entrance_exam}>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_entrance_exam"
                                    checked={form.data.is_entrance_exam}
                                    onCheckedChange={(checked) => form.setData('is_entrance_exam', !!checked)}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {form.data.is_entrance_exam ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </FormField>

                        <FormField label="Grading Scale" name="grading_scale_id" error={form.errors.grading_scale_id}>
                            <Select
                                value={form.data.grading_scale_id ?? ''}
                                onValueChange={(value) => form.setData('grading_scale_id', value === 'none' ? '' : value)}
                            >
                                <SelectTrigger id="grading_scale_id">
                                    <SelectValue placeholder="Select grading scale..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {gradingScales.map((scale) => (
                                        <SelectItem key={scale.id} value={scale.id}>
                                            {scale.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.processing}>
                                {editing ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Assessment Type</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
