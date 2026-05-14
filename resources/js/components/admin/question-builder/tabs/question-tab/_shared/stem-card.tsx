'use no memo';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import InputError from '@/components/input-error';
import type { TiptapJSON } from '@/types/tiptap';

interface StemCardProps {
    title?: string;
    description?: string;
    placeholder?: string;
    valueDoc: TiptapJSON | null;
    error?: string;
    onChange: (json: TiptapJSON | null, plain: string) => void;
}

async function defaultImageUpload(_file: File): Promise<string> {
    return '/placeholder-image.png';
}

export function StemCard({
    title = 'Stem',
    description = 'The question prompt as the student will read it.',
    placeholder = 'Write the prompt here…',
    valueDoc,
    error,
    onChange,
}: StemCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="stem">Stem</Label>
                    <TiptapEditor
                        value={valueDoc}
                        onChange={onChange}
                        onImageUpload={defaultImageUpload}
                        placeholder={placeholder}
                    />
                    <InputError message={error} />
                </div>
            </CardContent>
        </Card>
    );
}
