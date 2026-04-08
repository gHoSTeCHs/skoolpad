import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, History, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { GenerationLogEntry } from '@/types/content-studio';

interface GenerationLogPanelProps {
    logs: GenerationLogEntry[];
}

const PROMPT_TYPE_STYLES: Record<string, string> = {
    research: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    structure: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    content: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 reader:bg-purple-900/40 reader:text-purple-300',
    questions: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 reader:bg-orange-900/40 reader:text-orange-300',
    explanations: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 reader:bg-teal-900/40 reader:text-teal-300',
};

function formatCost(cents: number | null): string {
    if (cents === null || cents === 0) return '—';
    if (cents < 1) return '<$0.01';
    return `$${(cents / 100).toFixed(2)}`;
}

export function GenerationLogPanel({ logs }: GenerationLogPanelProps) {
    const [expanded, setExpanded] = useState(false);

    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border bg-card/50">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-4 py-2.5"
            >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <History className="size-4" />
                    Generation Log
                    <Badge variant="outline" className="text-xs">{logs.length}</Badge>
                </div>
                {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
            {expanded && (
                <div className="border-t">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Type</th>
                                    <th className="px-4 py-2 font-medium">Model</th>
                                    <th className="px-4 py-2 font-medium text-right">Tokens</th>
                                    <th className="px-4 py-2 font-medium text-right">Cost</th>
                                    <th className="px-4 py-2 font-medium text-center">Valid</th>
                                    <th className="px-4 py-2 font-medium text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b last:border-b-0">
                                        <td className="px-4 py-2">
                                            <Badge variant="secondary" className={PROMPT_TYPE_STYLES[log.prompt_type] ?? ''}>
                                                {log.prompt_type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                                            {log.model_used || '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-xs">
                                            {log.tokens_used.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-xs">
                                            {formatCost(log.estimated_cost_cents)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {log.is_valid ? (
                                                <Check className="mx-auto size-4 text-[var(--success)]" />
                                            ) : (
                                                <X className="mx-auto size-4 text-destructive" />
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                                            {formatDate(log.created_at)}
                                        </td>
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
