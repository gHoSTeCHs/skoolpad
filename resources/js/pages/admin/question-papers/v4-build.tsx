import { Head } from '@inertiajs/react';
import { QuestionBuilderV4Provider } from '@/components/admin/question-builder-v4/store/provider';
import { QuestionBuilderV4Shell } from '@/components/admin/question-builder-v4/shell';
import type { QuestionEnumOptions, QuestionPaper } from '@/types/questions';

interface Props {
    paper: QuestionPaper;
    enum_options: QuestionEnumOptions;
}

export default function V4Build({ paper }: Props) {
    return (
        <QuestionBuilderV4Provider paper={paper}>
            <Head title={`Build (v4): ${paper.title}`} />
            <QuestionBuilderV4Shell />
        </QuestionBuilderV4Provider>
    );
}
