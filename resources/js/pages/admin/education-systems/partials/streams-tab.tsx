import { router, useForm } from '@inertiajs/react';
import { GitBranch, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import StreamController from '@/actions/App/Http/Controllers/Admin/StreamController';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { CurriculumTier, Stream } from '@/types/models';

interface StreamsTabProps {
    streams: Stream[];
    tiers: CurriculumTier[];
    systemId: string;
}

export default function StreamsTab({ streams, tiers, systemId }: StreamsTabProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Stream | null>(null);

    const form = useForm({
        name: '',
        applies_from_tier_id: '',
    });

    function openCreate() {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setDialogOpen(true);
    }

    function openEdit(stream: Stream) {
        setEditing(stream);
        form.setData({
            name: stream.name,
            applies_from_tier_id: stream.applies_from_tier_id,
        });
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            form.put(StreamController.update.url(editing.id), {
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.post(StreamController.store.url(systemId), {
                onSuccess: () => setDialogOpen(false),
            });
        }
    }

    function handleDelete(stream: Stream) {
        if (confirm(`Delete stream "${stream.name}"?`)) {
            router.delete(StreamController.destroy.url(stream.id));
        }
    }

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Streams</h3>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Stream
                </Button>
            </div>

            <Card>
                {streams.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Applies From Tier</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {streams.map((stream) => (
                                <TableRow key={stream.id}>
                                    <TableCell className="font-medium">{stream.name}</TableCell>
                                    <TableCell>{stream.applies_from_tier?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(stream)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => handleDelete(stream)}
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <GitBranch className="mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">No streams yet</p>
                        <p className="text-xs text-muted-foreground/70">
                            Add streams to define specialization paths.
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
                        form.reset();
                        form.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Stream' : 'Add Stream'}</DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Update the stream details below.'
                                : 'Create a new stream for this education system.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Name" name="name" error={form.errors.name} required>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Science"
                            />
                        </FormField>

                        <FormField
                            label="Applies From Tier"
                            name="applies_from_tier_id"
                            error={form.errors.applies_from_tier_id}
                            required
                        >
                            <Select
                                value={form.data.applies_from_tier_id}
                                onValueChange={(value) => form.setData('applies_from_tier_id', value)}
                            >
                                <SelectTrigger id="applies_from_tier_id">
                                    <SelectValue placeholder="Select tier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiers.map((tier) => (
                                        <SelectItem key={tier.id} value={tier.id}>
                                            {tier.name}
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
        </>
    );
}
