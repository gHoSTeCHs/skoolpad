import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ErrorBoundary } from '@/components/error-boundary';
import { LayoutErrorFallback } from '@/components/error-boundary/layout-error-fallback';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <ErrorBoundary
                    resetKey={url}
                    fallback={(props) => <LayoutErrorFallback {...props} dashboardUrl="/dashboard" />}
                >
                    {children}
                </ErrorBoundary>
            </AppContent>
        </AppShell>
    );
}
