import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuestionNode } from '@/types/questions';

export function ContextsTab({ question: _question }: { question: QuestionNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Linked contexts</CardTitle>
                <CardDescription>
                    Inline context create + link replaces the modal jump. Lands in Round 4.F. For now use the
                    existing canonical builder's Add Context flow.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                    Coming in 4.F
                </div>
            </CardContent>
        </Card>
    );
}
