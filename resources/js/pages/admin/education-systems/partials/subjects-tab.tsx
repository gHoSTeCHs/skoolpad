import { router, useForm } from '@inertiajs/react';
import { BookOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CurriculumSubjectController from '@/actions/App/Http/Controllers/Admin/CurriculumSubjectController';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSlug } from '@/hooks/use-slug';
import type { CurriculumSubject } from '@/types/models';

interface SubjectsTabProps {
    subjects: CurriculumSubject[];
    disciplines: { id: string; name: string }[];
    systemId: string;
}

export default function SubjectsTab({ subjects, disciplines, systemId }: SubjectsTabProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<CurriculumSubject | null>(null);
    const [deleting, setDeleting] = useState<CurriculumSubject | null>(null);
    const { generateSlug, slugManuallyEdited, resetSlugTracking } = useSlug();

    const form = useForm({
        name: '',
        slug: '',
        discipline_id: '',
    });

    function handleNameChange(value: string) {
        form.setData('name', value);
        if (!slugManuallyEdited.current) {
            form.setData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(CurriculumSubjectController.update.url(editing.id), {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.post(CurriculumSubjectController.store.url(systemId), {
                onSuccess: () => setDialogOpen(false),
            });
        }
    }

    function openCreate() {
        setEditing(null);
        resetSlugTracking();
        form.reset();
        form.clearErrors();
        setDialogOpen(true);
    }

    function openEdit(subject: CurriculumSubject) {
        setEditing(subject);
        slugManuallyEdited.current = true;
        form.setData({
            name: subject.name,
            slug: subject.slug,
            discipline_id: subject.discipline_id,
        });
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleting) {
            return;
        }

        router.delete(CurriculumSubjectController.destroy.url(deleting.id), {
            onSuccess: () => setDeleting(null),
        });
    }

    return (
        <>
            <Card>
                <div className="flex items-center justify-between px-6">
                    <div>
                        <h3 className="text-lg font-semibold">Curriculum Subjects</h3>
                        <p className="text-sm text-muted-foreground">
                            Subjects available within this education system.
                        </p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Subject
                    </Button>
                </div>

                {subjects.length > 0 ? (
                    <div className="px-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Discipline</TableHead>
                                    <TableHead className="w-[70px]">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((subject) => (
                                    <TableRow key={subject.id}>
                                        <TableCell className="font-medium">{subject.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{subject.slug}</Badge>
                                        </TableCell>
                                        <TableCell>{subject.discipline?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(subject)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleting(subject)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">No subjects yet</p>
                        <p className="text-xs text-muted-foreground/70">
                            Add curriculum subjects to this education system.
                        </p>
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
                        <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Update the curriculum subject details.'
                                : 'Add a new curriculum subject to this education system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Name" name="name" error={form.errors.name} required>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. Mathematics"
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
                                placeholder="e.g. mathematics"
                            />
                        </FormField>

                        <FormField label="Discipline" name="discipline_id" error={form.errors.discipline_id} required>
                            <Select
                                value={form.data.discipline_id}
                                onValueChange={(value) => form.setData('discipline_id', value)}
                            >
                                <SelectTrigger id="discipline_id">
                                    <SelectValue placeholder="Select discipline..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {disciplines.map((discipline) => (
                                        <SelectItem key={discipline.id} value={discipline.id}>
                                            {discipline.name}
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
                                {editing ? 'Update Subject' : 'Create Subject'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Subject</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleting?.name}</strong>? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
