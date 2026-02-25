import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OrderingConfig } from '@/types/questions';

interface Props {
    value: OrderingConfig | null;
    onChange: (config: OrderingConfig) => void;
}

function getDefaults(): OrderingConfig {
    return {
        items: ['', ''],
        correct_order: [1, 2],
    };
}

export default function OrderingBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function addItem() {
        const items = [...config.items, ''];
        const correct_order = [...config.correct_order, items.length];
        onChange({ ...config, items, correct_order });
    }

    function removeItem(index: number) {
        if (config.items.length <= 2) return;
        const items = config.items.filter((_, i) => i !== index);
        const removedOrder = config.correct_order[index];
        const correct_order = config.correct_order
            .filter((_, i) => i !== index)
            .map((o) => (o > removedOrder ? o - 1 : o));
        onChange({ ...config, items, correct_order });
    }

    function updateText(index: number, text: string) {
        const items = config.items.map((item, i) => (i === index ? text : item));
        onChange({ ...config, items });
    }

    function updateOrder(index: number, order: number) {
        const correct_order = config.correct_order.map((o, i) => (i === index ? order : o));
        onChange({ ...config, correct_order });
    }

    return (
        <div className="space-y-4">
            <Label>Items &amp; Correct Order</Label>

            {config.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium">
                        {index + 1}
                    </div>

                    <Input
                        value={item}
                        onChange={(e) => updateText(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1"
                    />

                    <div className="w-20 shrink-0">
                        <Input
                            type="number"
                            min={1}
                            max={config.items.length}
                            value={config.correct_order[index] ?? index + 1}
                            onChange={(e) => updateOrder(index, parseInt(e.target.value, 10) || 1)}
                            placeholder="Order"
                        />
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                        disabled={config.items.length <= 2}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Remove item {index + 1}</span>
                    </Button>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-4" />
                Add Item
            </Button>
        </div>
    );
}
