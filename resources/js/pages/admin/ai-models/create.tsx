import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import { AIModelForm } from './partials/ai-model-form';
import type { EnumOption } from '@/types/content-studio';

interface Props {
    adapterTypes: EnumOption[];
}

const breadcrumbs = [
    { title: 'AI Models', href: AIModelController.index.url() },
    { title: 'Add Model', href: '#' },
];

export default function AIModelsCreate({ adapterTypes }: Props) {
    return (
        <FormPageLayout
            title="Add AI Model"
            description="Configure a new AI provider for content generation."
            breadcrumbs={breadcrumbs}
        >
            <AIModelForm adapterTypes={adapterTypes} />
        </FormPageLayout>
    );
}
