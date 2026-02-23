import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import { UserForm } from './partials/user-form';

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

export default function AdminUserEdit({ user, roles }: Props) {
    const breadcrumbs = [
        { title: 'Users', href: UserController.index.url() },
        { title: user.name, href: UserController.show.url(user.id) },
        { title: 'Edit', href: '#' },
    ];

    return (
        <FormPageLayout
            title="Edit User"
            description="Update user role and active status."
            breadcrumbs={breadcrumbs}
        >
            <UserForm user={user} roles={roles} />
        </FormPageLayout>
    );
}
