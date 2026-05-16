import { DiscardDialog } from './discard-dialog';
import { EditorColumn } from './editor-column';
import { InspectorRail } from './inspector-rail';
import { InspectorSheet } from './inspector-sheet';
import { QuestionsColumn } from './questions-column';
import { SectionsColumn } from './sections-column';
import { StudioTopBar } from './studio-top-bar';

export function QuestionBuilderV4Shell() {
    return (
        <div className="fixed inset-0 grid grid-cols-[232px_320px_minmax(0,1fr)_52px] grid-rows-[56px_1fr] overflow-hidden bg-background text-foreground">
            <StudioTopBar />
            <SectionsColumn />
            <QuestionsColumn />
            <EditorColumn />
            <InspectorRail />
            <InspectorSheet />
            <DiscardDialog />
        </div>
    );
}
