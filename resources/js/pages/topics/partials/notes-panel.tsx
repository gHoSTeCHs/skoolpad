import { StickyNote } from 'lucide-react';

export function NotesPanel() {
    return (
        <div className="rounded-lg border border-dashed bg-card/50 p-6 text-center" style={{ borderRadius: 'var(--card-radius)' }}>
            <StickyNote className="mx-auto mb-2 size-8 text-muted-foreground" />
            <h4 className="text-[14px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Notes
            </h4>
            <p className="mt-1 text-[13px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Note-taking will be available in Phase 1.9
            </p>
        </div>
    );
}
