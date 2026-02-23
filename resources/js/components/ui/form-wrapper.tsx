import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface FormWrapperProps {
    onSubmit: (e: React.FormEvent) => void;
    cancelUrl: string;
    submitLabel: string;
    isSubmitting?: boolean;
    children: React.ReactNode;
}

export function FormWrapper({ onSubmit, cancelUrl, submitLabel, isSubmitting, children }: FormWrapperProps) {
    return (
        <form onSubmit={onSubmit}>
            <Card>
                <CardContent className="space-y-6">{children}</CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-6">
                    <Button variant="outline" asChild>
                        <Link href={cancelUrl}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {submitLabel}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
