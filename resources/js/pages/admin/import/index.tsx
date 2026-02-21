import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Loader2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import {
    importTopics,
    importCourseMappings,
    importCourseOfferings,
    importQuestions,
    history,
} from '@/actions/App/Http/Controllers/Admin/BulkImportController';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { ImportType } from '@/types/import';

const breadcrumbs = [{ title: 'Bulk Import', href: '/admin/import' }];

const tabConfig: { type: ImportType; label: string }[] = [
    { type: 'topics', label: 'Topics' },
    { type: 'course_mappings', label: 'Course Mappings' },
    { type: 'course_offerings', label: 'Course Offerings' },
    { type: 'questions', label: 'Questions' },
];

const tabData: Record<
    ImportType,
    {
        description: string;
        csvHeader: string;
        csvExample: string;
        endpointUrl: string;
    }
> = {
    topics: {
        description:
            'Import canonical topics in bulk. Each row creates a new topic under the specified discipline with content, difficulty level, and estimated reading time.',
        csvHeader:
            'discipline_slug,title,difficulty_level,content_markdown,summary,estimated_read_minutes',
        csvExample:
            'science,photosynthesis-basics,beginner,"Full content here","Brief summary",8',
        endpointUrl: importTopics.url(),
    },
    course_mappings: {
        description:
            'Map existing topics to institution courses. Links a canonical topic to a specific course, defining the sequence and weight for curriculum ordering.',
        csvHeader:
            'institution_abbreviation,course_code,topic_slug,discipline_slug,sequence_order,weight',
        csvExample: 'UNILAG,BIO101,photosynthesis-basics,science,1,1.0',
        endpointUrl: importCourseMappings.url(),
    },
    course_offerings: {
        description:
            'Define which departments offer each course. Sets a course as compulsory or elective for a specific department within an institution.',
        csvHeader:
            'institution_abbreviation,course_code,department_abbreviation,is_compulsory',
        csvExample: 'UNILAG,BIO101,BCH,true',
        endpointUrl: importCourseOfferings.url(),
    },
    questions: {
        description:
            'Import past exam questions in bulk. Creates questions with MCQ options, topic links, and answer explanations. Questions are imported as draft by default.',
        csvHeader:
            'institution_abbreviation,course_code,question_type,content,year,semester,difficulty,option_a,option_b,option_c,option_d,option_e,correct_option,topic_slug,quick_answer,standard_answer',
        csvExample:
            'MOUAU,CSC201,mcq,"What is the time complexity of binary search?",2023,first,medium,O(1),O(log n),O(n),O(n log n),,B,binary-search,"O(log n)","Binary search divides the array in half each step..."',
        endpointUrl: importQuestions.url(),
    },
};

interface ImportTabProps {
    importType: ImportType;
    description: string;
    csvHeader: string;
    csvExample: string;
    endpointUrl: string;
}

function ImportTab({
    importType,
    description,
    csvHeader,
    csvExample,
    endpointUrl,
}: ImportTabProps) {
    const { flash } = usePage<SharedData>().props;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [defaultStatus, setDefaultStatus] = useState<string>('draft');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sampleCsvContent = `${csvHeader}\n${csvExample}`;
    const sampleCsvUri = `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsvContent)}`;

    function handleFileSelect(file: File | undefined) {
        if (!file) return;
        setSelectedFile(file);
    }

    function handleRemoveFile() {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
            handleFileSelect(file);
        }
    }, []);

    function handleSubmit() {
        if (!selectedFile) return;

        const data: Record<string, File | string> = { file: selectedFile };
        if (importType === 'questions') {
            data.default_status = defaultStatus;
        }

        router.post(endpointUrl, data, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setIsUploading(true),
            onFinish: () => {
                setIsUploading(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    }

    return (
        <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{description}</p>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">
                    CSV Format
                </h3>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    {csvHeader}
                    {'\n'}
                    {csvExample}
                </pre>
                <a
                    href={sampleCsvUri}
                    download={`${importType}-sample.csv`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                    <Download className="size-3.5" />
                    Download sample CSV
                </a>
            </div>

            {importType === 'questions' && (
                <div className="space-y-2">
                    <label
                        htmlFor="default-status"
                        className="text-sm font-medium text-foreground"
                    >
                        Default Status
                    </label>
                    <select
                        id="default-status"
                        value={defaultStatus}
                        onChange={(e) => setDefaultStatus(e.target.value)}
                        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                        Published status requires publish permissions. Draft
                        questions can be reviewed before publishing.
                    </p>
                </div>
            )}

            <div
                role="button"
                tabIndex={0}
                className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
                    isDragOver
                        ? 'border-primary bg-primary/5'
                        : selectedFile
                          ? 'border-border bg-muted/20'
                          : 'border-border hover:border-muted-foreground/40 hover:bg-muted/20',
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!selectedFile) fileInputRef.current?.click();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {selectedFile ? (
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet className="size-5 text-primary" />
                        <span className="text-sm font-medium">
                            {selectedFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
                            }}
                            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className="mb-2 size-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">
                            Drag & drop or click to browse
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            CSV files only, up to 5 MB
                        </p>
                    </>
                )}
            </div>

            <Button
                onClick={handleSubmit}
                disabled={!selectedFile || isUploading}
            >
                {isUploading ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload className="size-4" />
                        Upload & Validate
                    </>
                )}
            </Button>

            {flash.success && (
                <div
                    className="flex items-start gap-3 rounded-lg border px-4 py-3"
                    style={{
                        borderColor: 'var(--badge-primary-fg)',
                        backgroundColor: 'var(--badge-primary-bg)',
                    }}
                >
                    <CheckCircle2
                        className="mt-0.5 size-4 shrink-0"
                        style={{ color: 'var(--badge-primary-fg)' }}
                    />
                    <div className="space-y-1">
                        <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--badge-primary-fg)' }}
                        >
                            {flash.success}
                        </p>
                        <Link
                            href={history.url()}
                            className="text-xs font-medium underline"
                            style={{ color: 'var(--badge-primary-fg)' }}
                        >
                            View import history
                        </Link>
                    </div>
                </div>
            )}

            {flash.importErrors && flash.importErrors.length > 0 && (
                <div
                    className="rounded-lg border px-4 py-3"
                    style={{
                        borderColor: 'var(--badge-danger-fg)',
                        backgroundColor: 'var(--badge-danger-bg)',
                    }}
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle
                            className="size-4 shrink-0"
                            style={{ color: 'var(--badge-danger-fg)' }}
                        />
                        <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--badge-danger-fg)' }}
                        >
                            {flash.importErrors.length} validation{' '}
                            {flash.importErrors.length === 1
                                ? 'error'
                                : 'errors'}{' '}
                            found
                        </p>
                    </div>
                    <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto pl-6">
                        {flash.importErrors.map((error, idx) => (
                            <li
                                key={idx}
                                className="text-xs"
                                style={{ color: 'var(--badge-danger-fg)' }}
                            >
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function BulkImport() {
    const [activeTab, setActiveTab] = useState<ImportType>('topics');
    const active = tabData[activeTab];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Bulk Import" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Bulk Import"
                    action={{ label: 'Import History', href: history.url() }}
                />

                <Card className="p-0">
                    <div className="border-b">
                        <nav className="flex">
                            {tabConfig.map((tab) => (
                                <button
                                    key={tab.type}
                                    type="button"
                                    onClick={() => setActiveTab(tab.type)}
                                    className={cn(
                                        'relative px-5 py-3 text-sm font-medium transition-colors',
                                        activeTab === tab.type
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {tab.label}
                                    {activeTab === tab.type && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <CardContent className="pt-5 pb-6">
                        <ImportTab
                            key={activeTab}
                            importType={activeTab}
                            description={active.description}
                            csvHeader={active.csvHeader}
                            csvExample={active.csvExample}
                            endpointUrl={active.endpointUrl}
                        />
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
