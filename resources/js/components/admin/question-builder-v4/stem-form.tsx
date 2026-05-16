import { TiptapEditor } from '@/components/shared/tiptap-editor';
import type { QuestionFormBridge } from './question-form';

interface StemFormProps {
    form: QuestionFormBridge;
    questionId: string;
}

export function StemForm({ form, questionId }: StemFormProps) {
    return (
        <TiptapEditor
            value={form.data.content_doc}
            onChange={(json, plain) => {
                form.setField('content', plain);
                form.setField('content_doc', json);
            }}
            placeholder="Write the question prompt as students will read it…"
            diagramOwner={{ kind: 'question', id: questionId }}
        />
    );
}
