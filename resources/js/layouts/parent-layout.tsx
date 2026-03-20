import ParentLayoutTemplate from '@/layouts/parent/parent-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <ParentLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </ParentLayoutTemplate>
);
