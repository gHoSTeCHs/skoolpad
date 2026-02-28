import { router, useForm } from '@inertiajs/react';
import { CalendarDays, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CalendarTermController from '@/actions/App/Http/Controllers/Admin/CalendarTermController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { CalendarTermModel } from '@/types/models';

interface Props {
    institutionId: string;
    terms: CalendarTermModel[];
}

export default function CalendarTermsTab({ institutionId, terms }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<CalendarTermModel | null>(null);

    const form = useForm({
        academic_year: '',
        name: '',
        start_date: '',
        end_date: '',
        sort_order: 1,
    });

    function openCreate() {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setDialogOpen(true);
    }

    function openEdit(term: CalendarTermModel) {
        setEditing(term);
        form.setData({
            academic_year: term.academic_year,
            name: term.name,
            start_date: term.start_date.split('T')[0],
            end_date: term.end_date.split('T')[0],
            sort_order: term.sort_order,
        });
        form.clearErrors();
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(CalendarTermController.update.url(editing.id), {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.post(CalendarTermController.store.url(institutionId), {
                onSuccess: () => setDialogOpen(false),
            });
        }
    }

    function handleDelete(term: CalendarTermModel) {
        if (confirm(`Delete "${term.name} (${term.academic_year})"?`)) {
            router.delete(CalendarTermController.destroy.url(term.id));
        }
    }

    const grouped = terms.reduce<Record<string, CalendarTermModel[]>>((acc, term) => {
        if (!acc[term.academic_year]) acc[term.academic_year] = [];
        acc[term.academic_year].push(term);
        return acc;
    }, {});

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Calendar Terms</CardTitle>
                <Button size="sm" variant="outline" onClick={openCreate}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Term
                </Button>
            </CardHeader>
            <CardContent>
                {terms.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No calendar terms defined yet.</p>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([year, yearTerms]) => (
                            <div key={year}>
                                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{year}</h3>
                                <div className="divide-y rounded-md border">
                                    {yearTerms.map((term) => (
                                        <div key={term.id} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{term.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(term.start_date).toLocaleDateString()} – {new Date(term.end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(term); }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(term); }}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setEditing(null);
                        form.reset();
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Calendar Term' : 'Add Calendar Term'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Academic Year" name="academic_year" error={form.errors.academic_year} required>
                            <Input
                                id="academic_year"
                                value={form.data.academic_year}
                                onChange={(e) => form.setData('academic_year', e.target.value)}
                                placeholder="e.g. 2025/2026"
                            />
                        </FormField>
                        <FormField label="Name" name="name" error={form.errors.name} required>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. First Semester"
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Start Date" name="start_date" error={form.errors.start_date} required>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(e) => form.setData('start_date', e.target.value)}
                                />
                            </FormField>
                            <FormField label="End Date" name="end_date" error={form.errors.end_date} required>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={form.data.end_date}
                                    onChange={(e) => form.setData('end_date', e.target.value)}
                                />
                            </FormField>
                        </div>
                        <FormField label="Sort Order" name="sort_order" error={form.errors.sort_order} required>
                            <Input
                                id="sort_order"
                                type="number"
                                min={1}
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', parseInt(e.target.value) || 1)}
                            />
                        </FormField>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing}>
                                {editing ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
