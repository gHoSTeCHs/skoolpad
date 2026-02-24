import { router, useForm } from '@inertiajs/react';
import { ChevronDown, GraduationCap, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import CurriculumTierController from '@/actions/App/Http/Controllers/Admin/CurriculumTierController';
import EducationLevelController from '@/actions/App/Http/Controllers/Admin/EducationLevelController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSlug } from '@/hooks/use-slug';
import type { CurriculumTier, EducationLevel } from '@/types/models';

interface TiersTabProps {
    tiers: CurriculumTier[];
    systemId: string;
}

export default function TiersTab({ tiers, systemId }: TiersTabProps) {
    const [tierDialogOpen, setTierDialogOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<CurriculumTier | null>(null);
    const [levelDialogOpen, setLevelDialogOpen] = useState(false);
    const [editingLevel, setEditingLevel] = useState<EducationLevel | null>(null);
    const [activeTierId, setActiveTierId] = useState<string | null>(null);

    const { generateSlug, slugManuallyEdited, resetSlugTracking } = useSlug();

    const tierForm = useForm({
        name: '',
        slug: '',
        sort_order: 0,
        is_tertiary: false,
    });

    const levelForm = useForm({
        name: '',
        display_name: '',
        sort_order: 0,
        typical_age_min: '' as string | number,
        typical_age_max: '' as string | number,
    });

    function handleTierNameChange(value: string) {
        tierForm.setData('name', value);
        if (!slugManuallyEdited.current) {
            tierForm.setData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
        }
    }

    function openCreateTier() {
        setEditingTier(null);
        tierForm.reset();
        tierForm.clearErrors();
        resetSlugTracking();
        setTierDialogOpen(true);
    }

    function openEditTier(tier: CurriculumTier) {
        setEditingTier(tier);
        tierForm.setData({
            name: tier.name,
            slug: tier.slug,
            sort_order: tier.sort_order,
            is_tertiary: tier.is_tertiary,
        });
        tierForm.clearErrors();
        resetSlugTracking();
        setTierDialogOpen(true);
    }

    function handleTierSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingTier) {
            tierForm.put(CurriculumTierController.update.url(editingTier.id), {
                onSuccess: () => setTierDialogOpen(false),
            });
        } else {
            tierForm.post(CurriculumTierController.store.url(systemId), {
                onSuccess: () => setTierDialogOpen(false),
            });
        }
    }

    function handleDeleteTier(tier: CurriculumTier) {
        if (confirm(`Delete "${tier.name}"? This will also remove all its education levels.`)) {
            router.delete(CurriculumTierController.destroy.url(tier.id));
        }
    }

    function openCreateLevel(tierId: string) {
        setEditingLevel(null);
        setActiveTierId(tierId);
        levelForm.reset();
        levelForm.clearErrors();
        setLevelDialogOpen(true);
    }

    function openEditLevel(level: EducationLevel) {
        setEditingLevel(level);
        setActiveTierId(level.curriculum_tier_id);
        levelForm.setData({
            name: level.name,
            display_name: level.display_name ?? '',
            sort_order: level.sort_order,
            typical_age_min: level.typical_age_min ?? '',
            typical_age_max: level.typical_age_max ?? '',
        });
        levelForm.clearErrors();
        setLevelDialogOpen(true);
    }

    function handleLevelSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingLevel) {
            levelForm.put(EducationLevelController.update.url(editingLevel.id), {
                onSuccess: () => setLevelDialogOpen(false),
            });
        } else if (activeTierId) {
            levelForm.post(EducationLevelController.store.url(activeTierId), {
                onSuccess: () => setLevelDialogOpen(false),
            });
        }
    }

    function handleDeleteLevel(level: EducationLevel) {
        if (confirm(`Delete "${level.name}"?`)) {
            router.delete(EducationLevelController.destroy.url(level.id));
        }
    }

    function formatAgeRange(level: EducationLevel): string {
        if (level.typical_age_min != null && level.typical_age_max != null) {
            return `${level.typical_age_min}–${level.typical_age_max}`;
        }
        if (level.typical_age_min != null) {
            return `${level.typical_age_min}+`;
        }
        if (level.typical_age_max != null) {
            return `Up to ${level.typical_age_max}`;
        }
        return '—';
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Curriculum Tiers</h3>
                <Button size="sm" onClick={openCreateTier}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Tier
                </Button>
            </div>

            {tiers.length === 0 ? (
                <Card className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <GraduationCap className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">No curriculum tiers yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add tiers to define the structure of this education system.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tiers.map((tier) => (
                        <Card key={tier.id} className="overflow-hidden">
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <div className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                                            <span className="font-medium">{tier.name}</span>
                                            <Badge variant="outline">{tier.slug}</Badge>
                                            {tier.is_tertiary && <Badge variant="secondary">Tertiary</Badge>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted-foreground">
                                                {tier.education_levels_count ?? 0} levels
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditTier(tier);
                                                        }}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTier(tier);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="border-t px-4 py-3">
                                        {tier.education_levels && tier.education_levels.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Display Name</TableHead>
                                                        <TableHead className="text-center">Order</TableHead>
                                                        <TableHead className="text-center">Age Range</TableHead>
                                                        <TableHead className="w-[70px]" />
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {tier.education_levels.map((level) => (
                                                        <TableRow key={level.id}>
                                                            <TableCell className="font-medium">{level.name}</TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {level.display_name || '—'}
                                                            </TableCell>
                                                            <TableCell className="text-center">{level.sort_order}</TableCell>
                                                            <TableCell className="text-center">{formatAgeRange(level)}</TableCell>
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => openEditLevel(level)}>
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            variant="destructive"
                                                                            onClick={() => handleDeleteLevel(level)}
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
                                            <p className="py-4 text-center text-sm text-muted-foreground">
                                                No education levels in this tier yet.
                                            </p>
                                        )}
                                        <div className="mt-3 flex justify-end">
                                            <Button variant="outline" size="sm" onClick={() => openCreateLevel(tier.id)}>
                                                <Plus className="mr-1 h-4 w-4" />
                                                Add Level
                                            </Button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog
                open={tierDialogOpen}
                onOpenChange={(open) => {
                    setTierDialogOpen(open);
                    if (!open) {
                        setEditingTier(null);
                        tierForm.reset();
                        tierForm.clearErrors();
                        resetSlugTracking();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTier ? 'Edit Tier' : 'Add Tier'}</DialogTitle>
                        <DialogDescription>
                            {editingTier
                                ? 'Update the curriculum tier details.'
                                : 'Add a new curriculum tier to this education system.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTierSubmit} className="space-y-4">
                        <FormField label="Name" name="name" error={tierForm.errors.name} required>
                            <Input
                                id="name"
                                value={tierForm.data.name}
                                onChange={(e) => handleTierNameChange(e.target.value)}
                                placeholder="e.g. Senior Secondary"
                            />
                        </FormField>

                        <FormField label="Slug" name="slug" error={tierForm.errors.slug} required={!!editingTier}>
                            <Input
                                id="slug"
                                value={tierForm.data.slug}
                                onChange={(e) => {
                                    slugManuallyEdited.current = true;
                                    tierForm.setData('slug', e.target.value);
                                }}
                                placeholder="e.g. senior-secondary"
                            />
                        </FormField>

                        <FormField label="Sort Order" name="sort_order" error={tierForm.errors.sort_order} required>
                            <Input
                                id="sort_order"
                                type="number"
                                min={0}
                                value={tierForm.data.sort_order}
                                onChange={(e) => tierForm.setData('sort_order', parseInt(e.target.value) || 0)}
                            />
                        </FormField>

                        <FormField label="Tertiary" name="is_tertiary" error={tierForm.errors.is_tertiary}>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_tertiary"
                                    checked={tierForm.data.is_tertiary}
                                    onCheckedChange={(checked) => tierForm.setData('is_tertiary', checked)}
                                />
                                <Label htmlFor="is_tertiary" className="font-normal">
                                    {tierForm.data.is_tertiary ? 'This is a tertiary-level tier' : 'Not a tertiary-level tier'}
                                </Label>
                            </div>
                        </FormField>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={tierForm.processing}>
                                {editingTier ? 'Update Tier' : 'Create Tier'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={levelDialogOpen}
                onOpenChange={(open) => {
                    setLevelDialogOpen(open);
                    if (!open) {
                        setEditingLevel(null);
                        setActiveTierId(null);
                        levelForm.reset();
                        levelForm.clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLevel ? 'Edit Level' : 'Add Level'}</DialogTitle>
                        <DialogDescription>
                            {editingLevel
                                ? 'Update the education level details.'
                                : 'Add a new education level to this tier.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLevelSubmit} className="space-y-4">
                        <FormField label="Name" name="level_name" error={levelForm.errors.name} required>
                            <Input
                                id="level_name"
                                value={levelForm.data.name}
                                onChange={(e) => levelForm.setData('name', e.target.value)}
                                placeholder="e.g. SS1"
                            />
                        </FormField>

                        <FormField
                            label="Display Name"
                            name="display_name"
                            error={levelForm.errors.display_name}
                            description="Optional friendly name shown to students"
                        >
                            <Input
                                id="display_name"
                                value={levelForm.data.display_name}
                                onChange={(e) => levelForm.setData('display_name', e.target.value)}
                                placeholder="e.g. Senior Secondary 1"
                            />
                        </FormField>

                        <FormField label="Sort Order" name="level_sort_order" error={levelForm.errors.sort_order} required>
                            <Input
                                id="level_sort_order"
                                type="number"
                                min={0}
                                value={levelForm.data.sort_order}
                                onChange={(e) => levelForm.setData('sort_order', parseInt(e.target.value) || 0)}
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Min Age"
                                name="typical_age_min"
                                error={levelForm.errors.typical_age_min}
                                description="Optional"
                            >
                                <Input
                                    id="typical_age_min"
                                    type="number"
                                    min={0}
                                    value={levelForm.data.typical_age_min}
                                    onChange={(e) =>
                                        levelForm.setData('typical_age_min', e.target.value === '' ? '' : parseInt(e.target.value))
                                    }
                                    placeholder="e.g. 15"
                                />
                            </FormField>

                            <FormField
                                label="Max Age"
                                name="typical_age_max"
                                error={levelForm.errors.typical_age_max}
                                description="Optional"
                            >
                                <Input
                                    id="typical_age_max"
                                    type="number"
                                    min={0}
                                    value={levelForm.data.typical_age_max}
                                    onChange={(e) =>
                                        levelForm.setData('typical_age_max', e.target.value === '' ? '' : parseInt(e.target.value))
                                    }
                                    placeholder="e.g. 17"
                                />
                            </FormField>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={levelForm.processing}>
                                {editingLevel ? 'Update Level' : 'Create Level'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
