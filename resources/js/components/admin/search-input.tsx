import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
    value: string;
    routeUrl: string;
    placeholder?: string;
    queryParams?: Record<string, string | undefined>;
}

export function SearchInput({ value, routeUrl, placeholder = 'Search...', queryParams = {} }: SearchInputProps) {
    const [search, setSearch] = useState(value || '');
    const isInitialMount = useRef(true);

    useEffect(() => {
        setSearch(value || '');
    }, [value]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                routeUrl,
                { ...queryParams, search: search || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="pl-9 pr-9"
            />
            {search && (
                <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
