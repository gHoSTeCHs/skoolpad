import { router } from '@inertiajs/react';
import { Check, Globe, Plus, X } from 'lucide-react';
import { useState } from 'react';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    institutionId: string;
    attached: { id: string; name: string }[];
    available: { id: string; name: string }[];
}

export default function EducationSystemsTab({ institutionId, attached, available }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSystemId, setSelectedSystemId] = useState('');

    const attachedIds = new Set(attached.map((s) => s.id));
    const unattached = available.filter((s) => !attachedIds.has(s.id));

    function handleAttach() {
        if (!selectedSystemId) return;
        router.post(
            InstitutionController.attachEducationSystem.url(institutionId),
            { education_system_id: selectedSystemId },
            { onSuccess: () => { setDialogOpen(false); setSelectedSystemId(''); } },
        );
    }

    function handleDetach(systemId: string) {
        if (!confirm('Remove this education system from the institution?')) return;
        router.delete(InstitutionController.detachEducationSystem.url({ institution: institutionId, education_system: systemId }));
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Education Systems</CardTitle>
                {unattached.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {attached.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No education systems linked yet.</p>
                ) : (
                    <div className="divide-y">
                        {attached.map((system) => (
                            <div key={system.id} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{system.name}</span>
                                    <Badge variant="outline" className="gap-1 text-xs">
                                        <Check className="h-3 w-3" />
                                        Active
                                    </Badge>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDetach(system.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedSystemId(''); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Education System</DialogTitle>
                    </DialogHeader>
                    <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select education system..." />
                        </SelectTrigger>
                        <SelectContent>
                            {unattached.map((system) => (
                                <SelectItem key={system.id} value={system.id}>
                                    {system.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAttach} disabled={!selectedSystemId}>Add</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
