import { Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AvailableTopic, TopicPrerequisite } from '@/types/topics';

interface PrerequisiteManagerProps {
    topicId: string;
    disciplineTopics: AvailableTopic[];
    currentPrerequisites: TopicPrerequisite[];
    onChange: (prerequisites: TopicPrerequisite[]) => void;
}

export function PrerequisiteManager({
    disciplineTopics,
    currentPrerequisites,
    onChange,
}: PrerequisiteManagerProps) {
    const [search, setSearch] = useState('');

    const prerequisiteIds = useMemo(
        () => new Set(currentPrerequisites.map((p) => p.id)),
        [currentPrerequisites],
    );

    const filteredTopics = useMemo(() => {
        if (!search.trim()) return disciplineTopics;
        const query = search.toLowerCase();
        return disciplineTopics.filter((t) =>
            t.title.toLowerCase().includes(query),
        );
    }, [disciplineTopics, search]);

    function handleAdd(topic: AvailableTopic) {
        onChange([
            ...currentPrerequisites,
            { id: topic.id, title: topic.title, is_hard_prerequisite: true },
        ]);
    }

    function handleRemove(id: string) {
        onChange(currentPrerequisites.filter((p) => p.id !== id));
    }

    function handleToggle(id: string) {
        onChange(
            currentPrerequisites.map((p) =>
                p.id === id
                    ? { ...p, is_hard_prerequisite: !p.is_hard_prerequisite }
                    : p,
            ),
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentPrerequisites.length > 0 && (
                    <div className="space-y-3">
                        <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                            Current Prerequisites
                        </Label>
                        <div className="space-y-2">
                            {currentPrerequisites.map((prereq) => (
                                <div
                                    key={prereq.id}
                                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                                >
                                    <span className="mr-3 min-w-0 flex-1 truncate text-sm font-medium">
                                        {prereq.title}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={
                                                    prereq.is_hard_prerequisite
                                                }
                                                onCheckedChange={() =>
                                                    handleToggle(prereq.id)
                                                }
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {prereq.is_hard_prerequisite
                                                    ? 'Hard'
                                                    : 'Soft'}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                handleRemove(prereq.id)
                                            }
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                        Add Prerequisites
                    </Label>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search topics in this discipline..."
                            className="pl-9"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                        {filteredTopics.length === 0 ? (
                            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                No topics found.
                            </p>
                        ) : (
                            filteredTopics.map((topic) => {
                                const isAdded = prerequisiteIds.has(topic.id);
                                return (
                                    <div
                                        key={topic.id}
                                        className="flex items-center justify-between border-b border-border px-3 py-2 last:border-b-0"
                                    >
                                        <span className="min-w-0 flex-1 truncate text-sm">
                                            {topic.title}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={isAdded}
                                            onClick={() => handleAdd(topic)}
                                            className="ml-2 shrink-0"
                                        >
                                            <Plus className="size-4" />
                                            {isAdded ? 'Added' : 'Add'}
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
