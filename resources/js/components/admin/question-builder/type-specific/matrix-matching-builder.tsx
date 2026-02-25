import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MatrixMatchingConfig } from '@/types/questions';

interface Props {
    value: MatrixMatchingConfig | null;
    onChange: (config: MatrixMatchingConfig) => void;
}

function getDefaults(): MatrixMatchingConfig {
    return {
        left: ['', ''],
        right: ['', ''],
        mapping: {},
    };
}

export default function MatrixMatchingBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function updateLeft(items: string[]) {
        const mapping = cleanMapping(config.mapping, items.length, config.right.length);
        onChange({ ...config, left: items, mapping });
    }

    function updateRight(items: string[]) {
        const mapping = cleanMapping(config.mapping, config.left.length, items.length);
        onChange({ ...config, right: items, mapping });
    }

    /**
     * Remove mapping entries that reference out-of-bounds indices
     * after items are added or removed.
     */
    function cleanMapping(
        mapping: Record<number, number[]>,
        leftCount: number,
        rightCount: number,
    ): Record<number, number[]> {
        const cleaned: Record<number, number[]> = {};
        for (const [key, values] of Object.entries(mapping)) {
            const leftIdx = Number(key);
            if (leftIdx < leftCount) {
                const filtered = values.filter((v) => v < rightCount);
                if (filtered.length > 0) {
                    cleaned[leftIdx] = filtered;
                }
            }
        }
        return cleaned;
    }

    function addLeftItem() {
        updateLeft([...config.left, '']);
    }

    function removeLeftItem(index: number) {
        if (config.left.length <= 2) return;
        const items = config.left.filter((_, i) => i !== index);
        const remapped: Record<number, number[]> = {};
        for (const [key, values] of Object.entries(config.mapping)) {
            const oldIdx = Number(key);
            if (oldIdx < index) {
                remapped[oldIdx] = values;
            } else if (oldIdx > index) {
                remapped[oldIdx - 1] = values;
            }
        }
        onChange({ ...config, left: items, mapping: cleanMapping(remapped, items.length, config.right.length) });
    }

    function updateLeftText(index: number, text: string) {
        const items = config.left.map((item, i) => (i === index ? text : item));
        onChange({ ...config, left: items });
    }

    function addRightItem() {
        updateRight([...config.right, '']);
    }

    function removeRightItem(index: number) {
        if (config.right.length <= 2) return;
        const items = config.right.filter((_, i) => i !== index);
        const remapped: Record<number, number[]> = {};
        for (const [key, values] of Object.entries(config.mapping)) {
            remapped[Number(key)] = values
                .filter((v) => v !== index)
                .map((v) => (v > index ? v - 1 : v));
        }
        onChange({ ...config, right: items, mapping: cleanMapping(remapped, config.left.length, items.length) });
    }

    function updateRightText(index: number, text: string) {
        const items = config.right.map((item, i) => (i === index ? text : item));
        onChange({ ...config, right: items });
    }

    function toggleMapping(leftIdx: number, rightIdx: number) {
        const current = config.mapping[leftIdx] ?? [];
        const exists = current.includes(rightIdx);
        const updated = exists
            ? current.filter((v) => v !== rightIdx)
            : [...current, rightIdx];
        const mapping = { ...config.mapping };
        if (updated.length > 0) {
            mapping[leftIdx] = updated;
        } else {
            delete mapping[leftIdx];
        }
        onChange({ ...config, mapping });
    }

    function isMapped(leftIdx: number, rightIdx: number): boolean {
        return (config.mapping[leftIdx] ?? []).includes(rightIdx);
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Left Items</Label>
                    {config.left.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={item}
                                onChange={(e) => updateLeftText(index, e.target.value)}
                                placeholder={`Left ${index + 1}`}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeLeftItem(index)}
                                disabled={config.left.length <= 2}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addLeftItem}>
                        <Plus className="size-4" />
                        Add Left
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label>Right Items</Label>
                    {config.right.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={item}
                                onChange={(e) => updateRightText(index, e.target.value)}
                                placeholder={`Right ${index + 1}`}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeRightItem(index)}
                                disabled={config.right.length <= 2}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addRightItem}>
                        <Plus className="size-4" />
                        Add Right
                    </Button>
                </div>
            </div>

            {config.left.length > 0 && config.right.length > 0 && (
                <div className="space-y-2">
                    <Label>Mapping Grid</Label>
                    <div className="overflow-x-auto">
                        <table className="border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="border p-2" />
                                    {config.right.map((item, idx) => (
                                        <th key={idx} className="border p-2 font-medium">
                                            {item || `R${idx + 1}`}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {config.left.map((item, leftIdx) => (
                                    <tr key={leftIdx}>
                                        <td className="border p-2 font-medium">{item || `L${leftIdx + 1}`}</td>
                                        {config.right.map((_, rightIdx) => (
                                            <td key={rightIdx} className="border p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isMapped(leftIdx, rightIdx)}
                                                    onChange={() => toggleMapping(leftIdx, rightIdx)}
                                                    className="accent-primary size-4"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
