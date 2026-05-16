import { StudioTopBar } from './studio-top-bar';
import { SectionsColumn } from './sections-column';
import { QuestionsColumn } from './questions-column';
import { EditorPlaceholder } from './editor-placeholder';
import { InspectorRail } from './inspector-rail';
import { InspectorSheet } from './inspector-sheet';

export function QuestionBuilderV4Shell() {
    return (
        <div className="fixed inset-0 grid grid-cols-[232px_320px_minmax(0,1fr)_52px] grid-rows-[56px_1fr] overflow-hidden bg-background text-foreground">
            <StudioTopBar />
            <SectionsColumn />
            <QuestionsColumn />
            <EditorPlaceholder />
            <InspectorRail />
            <InspectorSheet />
        </div>
    );
}
