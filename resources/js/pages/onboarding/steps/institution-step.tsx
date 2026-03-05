import { Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import OnboardingController from '@/actions/App/Http/Controllers/Student/OnboardingController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { InstitutionSearchResult } from '@/types/onboarding';

interface InstitutionStepProps {
    value: string;
    selectedInstitution: InstitutionSearchResult | null;
    onSelect: (institution: InstitutionSearchResult) => void;
    onNext: () => void;
    onBack?: () => void;
}

export default function InstitutionStep({ value, selectedInstitution, onSelect, onNext }: InstitutionStepProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<InstitutionSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    const search = useCallback(async (term: string) => {
        if (term.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(OnboardingController.searchInstitutions.url({ query: { q: term } }));
            const data = await response.json();
            setResults(data);
            setShowResults(true);
        } finally {
            setLoading(false);
        }
    }, []);

    function handleInputChange(term: string) {
        setQuery(term);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(term), 300);
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Select your institution</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Search for your university, polytechnic, or college.
                </p>
            </div>

            <div ref={containerRef} className="relative">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => results.length > 0 && setShowResults(true)}
                        placeholder="Search institutions..."
                        className="pl-10"
                    />
                    {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>

                {showResults && results.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
                        {results.map((inst) => (
                            <button
                                key={inst.id}
                                type="button"
                                onClick={() => {
                                    onSelect(inst);
                                    setQuery(inst.name);
                                    setShowResults(false);
                                }}
                                className={cn(
                                    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                                    value === inst.id && 'bg-accent',
                                )}
                            >
                                <span className="font-medium">{inst.name}</span>
                                <span className="text-muted-foreground">({inst.abbreviation})</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedInstitution && (
                <div className="rounded-lg border bg-accent/50 p-4">
                    <p className="text-sm font-medium">{selectedInstitution.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedInstitution.abbreviation}</p>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={onNext} disabled={!value}>
                    Continue
                </Button>
            </div>
        </div>
    );
}
