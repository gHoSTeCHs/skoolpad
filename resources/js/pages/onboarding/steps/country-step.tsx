import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CountryResult } from '@/types/onboarding';

interface CountryStepProps {
    value: string;
    countries: CountryResult[];
    schoolName: string;
    stateOrRegion: string;
    onSelect: (countryId: string) => void;
    onSchoolNameChange: (value: string) => void;
    onStateOrRegionChange: (value: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function CountryStep({
    value,
    countries,
    schoolName,
    stateOrRegion,
    onSelect,
    onSchoolNameChange,
    onStateOrRegionChange,
    onNext,
    onBack,
}: CountryStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Which country are you studying in?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    We&apos;ll show you the education systems available in your country.
                </p>
            </div>

            <Select value={value} onValueChange={onSelect}>
                <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                    {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                            {country.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="school_name">What school do you attend? (optional)</Label>
                    <Input
                        id="school_name"
                        value={schoolName}
                        onChange={(e) => onSchoolNameChange(e.target.value)}
                        placeholder="e.g. Kings College Lagos"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state_or_region">What state are you in? (optional)</Label>
                    <Input
                        id="state_or_region"
                        value={stateOrRegion}
                        onChange={(e) => onStateOrRegionChange(e.target.value)}
                        placeholder="e.g. Lagos"
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={!value}>Continue</Button>
            </div>
        </div>
    );
}
