import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { SearchModal } from '@/components/search/search-modal';
import { ErrorBoundary } from '@/components/error-boundary';
import { LayoutErrorFallback } from '@/components/error-boundary/layout-error-fallback';
import { SearchProvider, useSearchContext } from '@/contexts/search-context';
import type { AppLayoutProps } from '@/types';

function AppSidebarLayoutInner({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { url } = usePage();
    const { isOpen, close } = useSearchContext();

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
            <SearchModal isOpen={isOpen} onClose={close} />
        </AppShell>
    );
}

export default function AppSidebarLayout(props: AppLayoutProps) {
    return (
        <SearchProvider>
            <AppSidebarLayoutInner {...props} />
        </SearchProvider>
    );
}
