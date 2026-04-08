import { Head, useForm } from '@inertiajs/react';
import { BookOpen, GraduationCap } from 'lucide-react';
import ContentStudioController from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type {
    ContentProjectMode,
    CurriculumSubjectOption,
    DisciplineOption,
    EducationLevelOption,
    EnumOption,
} from '@/types/content-studio';

interface Props {
    modeOptions: EnumOption[];
    educationLevels: EducationLevelOption[];
    curriculumSubjects: CurriculumSubjectOption[];
    disciplines: DisciplineOption[];
}

interface FormData {
    mode: ContentProjectMode | '';
    education_level_id: string;
    curriculum_subject_id: string;
    discipline_id: string;
}

const breadcrumbs = [
    { title: 'Content Studio', href: ContentStudioController.index.url() },
    { title: 'New Project', href: '#' },
];

export default function ContentStudioCreate({ educationLevels, curriculumSubjects, disciplines }: Props) {
    const form = useForm<FormData>({
        mode: '',
        education_level_id: '',
        curriculum_subject_id: '',
        discipline_id: '',
    });

    const isSecondary = form.data.mode === 'secondary';
    const isTertiary = form.data.mode === 'tertiary';
    const modeSelected = isSecondary || isTertiary;

    function handleModeSelect(mode: ContentProjectMode) {
        form.setData({
            mode,
            education_level_id: '',
            curriculum_subject_id: '',
            discipline_id: '',
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(ContentStudioController.store.url());
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="New Content Project" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        New Content Project
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Choose a mode and scope to start building curriculum content.
                    </p>
                </div>

                <div className="mx-auto w-full max-w-2xl">
                    <div className="mb-6">
                        <p className="mb-3 text-sm font-medium text-foreground">
                            Select mode <span className="text-destructive">*</span>
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <ModeCard
                                mode="secondary"
                                label="Secondary"
                                description="Curriculum-driven, top-down. NERDC curriculum, WAEC/NECO questions."
                                icon={<BookOpen className="size-5" />}
                                selected={isSecondary}
                                onClick={() => handleModeSelect('secondary')}
                            />
                            <ModeCard
                                mode="tertiary"
                                label="Tertiary"
                                description="Topic-driven, bottom-up. Universal canonical topics, institution-scoped questions."
                                icon={<GraduationCap className="size-5" />}
                                selected={isTertiary}
                                onClick={() => handleModeSelect('tertiary')}
                            />
                        </div>
                        {form.errors.mode && (
                            <p className="mt-2 text-sm text-destructive">{form.errors.mode}</p>
                        )}
                    </div>

                    {modeSelected && (
                        <FormWrapper
                            onSubmit={handleSubmit}
                            cancelUrl={ContentStudioController.index.url()}
                            submitLabel="Create Project"
                            isSubmitting={form.processing}
                        >
                            {isSecondary && (
                                <>
                                    <FormField
                                        label="Education Level"
                                        name="education_level_id"
                                        error={form.errors.education_level_id}
                                        required
                                    >
                                        <Select
                                            value={form.data.education_level_id}
                                            onValueChange={(value) => form.setData('education_level_id', value)}
                                        >
                                            <SelectTrigger id="education_level_id">
                                                <SelectValue placeholder="Select level (e.g. SS1, JSS3)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {educationLevels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id}>
                                                        {level.display_name ?? level.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>

                                    <FormField
                                        label="Subject"
                                        name="curriculum_subject_id"
                                        error={form.errors.curriculum_subject_id}
                                        required
                                    >
                                        <Select
                                            value={form.data.curriculum_subject_id}
                                            onValueChange={(value) => form.setData('curriculum_subject_id', value)}
                                        >
                                            <SelectTrigger id="curriculum_subject_id">
                                                <SelectValue placeholder="Select subject (e.g. Physics, Biology)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {curriculumSubjects.map((subject) => (
                                                    <SelectItem key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                </>
                            )}

                            {isTertiary && (
                                <FormField
                                    label="Discipline"
                                    name="discipline_id"
                                    error={form.errors.discipline_id}
                                    required
                                >
                                    <Select
                                        value={form.data.discipline_id}
                                        onValueChange={(value) => form.setData('discipline_id', value)}
                                    >
                                        <SelectTrigger id="discipline_id">
                                            <SelectValue placeholder="Select discipline (e.g. Computer Science)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {disciplines.map((discipline) => (
                                                <SelectItem key={discipline.id} value={discipline.id}>
                                                    {discipline.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            )}
                        </FormWrapper>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

interface ModeCardProps {
    mode: ContentProjectMode;
    label: string;
    description: string;
    icon: React.ReactNode;
    selected: boolean;
    onClick: () => void;
}

function ModeCard({ label, description, icon, selected, onClick }: ModeCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all',
                selected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50',
            )}
        >
            <div className={cn(
                'flex size-10 items-center justify-center rounded-lg',
                selected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
            )}>
                {icon}
            </div>
            <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>
        </button>
    );
}
