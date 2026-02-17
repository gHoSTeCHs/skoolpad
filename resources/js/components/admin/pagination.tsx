import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginatedData } from '@/types/models';

interface PaginationProps {
    meta: PaginatedData<unknown>['meta'];
    links: PaginatedData<unknown>['links'];
}

function buildPageUrl(links: PaginationProps['links'], page: number): string | null {
    const source = links.next ?? links.prev;
    if (!source) return null;

    try {
        const url = new URL(source, window.location.origin);
        url.searchParams.set('page', String(page));
        return url.pathname + url.search;
    } catch {
        return null;
    }
}

function getPageNumbers(current: number, last: number): (number | 'ellipsis')[] {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (current > 3) {
        pages.push('ellipsis');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < last - 2) {
        pages.push('ellipsis');
    }

    pages.push(last);

    return pages;
}

function PageButton({ page, current, links }: { page: number; current: number; links: PaginationProps['links'] }) {
    const isCurrent = page === current;
    const url = buildPageUrl(links, page);

    if (isCurrent) {
        return (
            <Button variant="default" size="icon" className="size-8 text-xs">
                {page}
            </Button>
        );
    }

    if (!url) return null;

    return (
        <Button variant="outline" size="icon" className="size-8 text-xs" asChild>
            <Link href={url}>{page}</Link>
        </Button>
    );
}

export function Pagination({ meta, links }: PaginationProps) {
    if (meta.last_page <= 1) {
        return null;
    }

    const from = (meta.current_page - 1) * meta.per_page + 1;
    const to = Math.min(meta.current_page * meta.per_page, meta.total);
    const pages = getPageNumbers(meta.current_page, meta.last_page);

    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {meta.total} results
            </p>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="size-8" disabled={!links.prev} asChild={!!links.prev}>
                    {links.prev ? (
                        <Link href={links.prev}>
                            <ChevronLeft className="size-4" />
                        </Link>
                    ) : (
                        <span><ChevronLeft className="size-4" /></span>
                    )}
                </Button>

                {pages.map((page, index) => {
                    if (page === 'ellipsis') {
                        return (
                            <span key={`ellipsis-${index}`} className="flex size-8 items-center justify-center text-muted-foreground">
                                <MoreHorizontal className="size-4" />
                            </span>
                        );
                    }
                    return <PageButton key={page} page={page} current={meta.current_page} links={links} />;
                })}

                <Button variant="outline" size="icon" className="size-8" disabled={!links.next} asChild={!!links.next}>
                    {links.next ? (
                        <Link href={links.next}>
                            <ChevronRight className="size-4" />
                        </Link>
                    ) : (
                        <span><ChevronRight className="size-4" /></span>
                    )}
                </Button>
            </div>
        </div>
    );
}
