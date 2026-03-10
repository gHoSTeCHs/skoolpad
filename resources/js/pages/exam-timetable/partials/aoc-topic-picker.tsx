import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AocTopicPickerProps {
    topics: { id: string; title: string }[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export default function AocTopicPicker({ topics, selectedIds, onChange }: AocTopicPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = topics.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

    function handleToggle(topicId: string, checked: boolean) {
        if (checked) {
            onChange([...selectedIds, topicId]);
        } else {
            onChange(selectedIds.filter((id) => id !== topicId));
        }
    }

    if (topics.length === 0) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-accent/50">
                <span className="text-muted-foreground">
                    Area of Concentration (optional)
                    {selectedIds.length > 0 && (
                        <span className="ml-1.5 font-medium text-foreground">{selectedIds.length} selected</span>
                    )}
                </span>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <p className="px-1 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Select specific topics your lecturer asked you to focus on.
            </p>
            <CollapsibleContent className="mt-2 space-y-2">
                <div className="relative">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search topics..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 text-sm"
                    />
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                    {filtered.length === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">No topics found</p>
                    ) : (
                        filtered.map((topic) => (
                            <Label
                                key={topic.id}
                                htmlFor={`aoc-${topic.id}`}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                            >
                                <Checkbox
                                    id={`aoc-${topic.id}`}
                                    checked={selectedIds.includes(topic.id)}
                                    onCheckedChange={(checked) => handleToggle(topic.id, checked === true)}
                                />
                                <span className="line-clamp-1">{topic.title}</span>
                            </Label>
                        ))
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
