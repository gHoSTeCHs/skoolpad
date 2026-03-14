import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { CgpaSimulation } from '@/types/cgpa';
import { router } from '@inertiajs/react';
import { destroy } from '@/actions/App/Http/Controllers/Student/CgpaSimulatorController';
import { BookOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SimulationListProps {
    simulations: CgpaSimulation[];
    onLoad: (simulation: CgpaSimulation) => void;
}

export function SimulationList({ simulations, onLoad }: SimulationListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    function handleDelete(id: string) {
        router.delete(destroy(id).url, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    }

    if (simulations.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="size-4 text-muted-foreground" />
                    Saved Simulations
                    <Badge variant="secondary" className="ml-auto">
                        {simulations.length}/10
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {simulations.map((sim) => (
                    <div
                        key={sim.id}
                        className="group flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                    >
                        <button
                            type="button"
                            onClick={() => onLoad(sim)}
                            className="flex-1 text-left"
                        >
                            <p
                                className="text-sm font-medium"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                {sim.name || 'Untitled Simulation'}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                <span
                                    className="text-lg font-bold"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {sim.projected_cgpa.toFixed(2)}
                                </span>
                                {sim.classification && (
                                    <Badge variant="outline" className="text-xs">
                                        {sim.classification}
                                    </Badge>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {new Date(sim.updated_at).toLocaleDateString('en-NG', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                        </button>

                        <Dialog
                            open={deletingId === sim.id}
                            onOpenChange={(open) => setDeletingId(open ? sim.id : null)}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0 text-muted-foreground transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                                    aria-label="Delete simulation"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Simulation</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete &quot;{sim.name || 'Untitled Simulation'}&quot;?
                                        This cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button variant="destructive" onClick={() => handleDelete(sim.id)}>
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
