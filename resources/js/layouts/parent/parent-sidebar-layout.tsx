import { usePage } from '@inertiajs/react';
import { ParentSidebar } from '@/components/parent-sidebar';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ErrorBoundary } from '@/components/error-boundary';
import { LayoutErrorFallback } from '@/components/error-boundary/layout-error-fallback';
import type { AppLayoutProps } from '@/types';

export default function ParentSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();

    return (
        <AppShell variant="sidebar">
            <ParentSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <ErrorBoundary
                    resetKey={url}
                    fallback={(props) => <LayoutErrorFallback {...props} dashboardUrl="/parent/dashboard" />}
                >
                    {children}
                </ErrorBoundary>
            </AppContent>
        </AppShell>
    );
}
