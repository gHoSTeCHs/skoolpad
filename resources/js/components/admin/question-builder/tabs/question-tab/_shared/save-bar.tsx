import { Button } from '@/components/ui/button';

interface SaveBarProps {
    isDirty: boolean;
    processing: boolean;
    recentlySuccessful: boolean;
}

export function SaveBar({ isDirty, processing, recentlySuccessful }: SaveBarProps) {
    return (
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-2)] pt-4">
            {recentlySuccessful && (
                <span className="text-xs text-muted-foreground">Saved</span>
            )}
            <Button type="submit" disabled={processing || !isDirty}>
                {processing ? 'Saving…' : 'Save question'}
            </Button>
        </div>
    );
}
