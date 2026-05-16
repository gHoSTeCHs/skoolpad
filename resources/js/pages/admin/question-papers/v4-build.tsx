import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    QuestionBuilderV4Provider,
    useBuilderV4Store,
} from '@/components/admin/question-builder-v4/store/provider';
import { QuestionBuilderV4Shell } from '@/components/admin/question-builder-v4/shell';
import type { QuestionEnumOptions, QuestionPaper } from '@/types/questions';

interface Props {
    paper: QuestionPaper;
    enum_options: QuestionEnumOptions;
}

export default function V4Build({ paper }: Props) {
    return (
        <QuestionBuilderV4Provider paper={paper}>
            <PaperSync paper={paper} />
            <Head title={`Build (v4): ${paper.title}`} />
            <QuestionBuilderV4Shell />
        </QuestionBuilderV4Provider>
    );
}

/**
 * Pushes the latest paper prop into the zustand store on every Inertia partial
 * reload. Without this, the store retains the initial paper snapshot and
 * downstream reads (rail badge counts, inspector contents, etc.) go stale
 * after server-side mutations.
 */
function PaperSync({ paper }: { paper: QuestionPaper }) {
    const setPaper = useBuilderV4Store((s) => s.setPaper);
    useEffect(() => {
        setPaper(paper);
    }, [paper, setPaper]);
    return null;
}
