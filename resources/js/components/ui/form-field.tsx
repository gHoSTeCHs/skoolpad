import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
    label: string;
    name: string;
    error?: string;
    description?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function FormField({ label, name, error, description, required, children, className }: FormFieldProps) {
    return (
        <div className={className ?? 'space-y-2'}>
            <Label htmlFor={name}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {children}
            <InputError message={error} />
        </div>
    );
}
