export function AppErrorFallback() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
                <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--canopy-400)] to-[var(--canopy-600)]">
                    <span className="font-display text-[20px] font-[800] leading-none text-white">
                        S
                    </span>
                </div>

                <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
                    Something went wrong
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    We're sorry — an unexpected error occurred. Please reload and try again.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Reload Application
                </button>
            </div>
        </div>
    );
}
