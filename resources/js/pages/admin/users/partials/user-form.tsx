import { useForm } from '@inertiajs/react';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
    };
    roles: EnumOption[];
}

export function UserForm({ user, roles }: Props) {
    const form = useForm({
        role: user.role,
        is_active: user.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(UserController.update.url(user.id));
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={UserController.index.url()}
            submitLabel="Update User"
            isSubmitting={form.processing}
        >
            <div className="space-y-1">
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>

            <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <FormField label="Role" name="role" error={form.errors.role} required>
                <Select
                    value={form.data.role}
                    onValueChange={(value) => form.setData('role', value)}
                >
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                                {role.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label="Active" name="is_active" error={form.errors.is_active}>
                <Switch
                    id="is_active"
                    checked={form.data.is_active}
                    onCheckedChange={(checked) => form.setData('is_active', checked)}
                />
            </FormField>
        </FormWrapper>
    );
}
