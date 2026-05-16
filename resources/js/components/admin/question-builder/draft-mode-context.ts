import { createContext, useContext } from 'react';

export interface DraftMeta {
    paperId?: string;
    sectionId?: string;
    institutionCourseId?: string | null;
    parentId?: string;
    onCreated: (newQuestionId: string) => void;
}

export const DraftModeContext = createContext<DraftMeta | null>(null);

export function useDraftMeta(): DraftMeta | null {
    return useContext(DraftModeContext);
}
