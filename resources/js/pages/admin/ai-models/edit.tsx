import AIModelController from '@/actions/App/Http/Controllers/Admin/AIModelController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import { AIModelForm } from './partials/ai-model-form';
import type { AIModel, EnumOption } from '@/types/content-studio';

interface Props {
    aiModel: AIModel;
    adapterTypes: EnumOption[];
}

const breadcrumbs = [
    { title: 'AI Models', href: AIModelController.index.url() },
    { title: 'Edit', href: '#' },
];

export default function AIModelsEdit({ aiModel, adapterTypes }: Props) {
    return (
        <FormPageLayout
            title={`Edit ${aiModel.name}`}
            description="Update AI model configuration."
            breadcrumbs={breadcrumbs}
        >
            <AIModelForm aiModel={aiModel} adapterTypes={adapterTypes} />
        </FormPageLayout>
    );
}
