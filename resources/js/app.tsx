import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { ErrorBoundary } from './components/error-boundary';
import { AppErrorFallback } from './components/error-boundary/app-error-fallback';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el, {
            onCaughtError: (error, errorInfo) => console.error('[ErrorBoundary caught]', error, errorInfo),
            onUncaughtError: (error, errorInfo) => console.error('[Uncaught]', error, errorInfo),
        });

        root.render(
            <StrictMode>
                <ErrorBoundary fallback={<AppErrorFallback />}>
                    <App {...props} />
                </ErrorBoundary>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
