import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuestionNode } from '@/types/questions';

export function LinksTab({ question: _question }: { question: QuestionNode }) {
    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>Topic links</CardTitle>
                    <CardDescription>
                        Canonical-topic links land in Round 4.E. The existing TopicLinker UI from the standalone edit
                        page is being embedded here as a Card with its own Save button.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                        Coming in 4.E
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Content block links</CardTitle>
                    <CardDescription>
                        Block-link picker UI from the standalone edit page is being embedded here in 4.E with its own
                        Save button.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                        Coming in 4.E
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
