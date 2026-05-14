const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2628000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
];

export function relativeTimeFromNow(iso: string | null | undefined): string {
    if (!iso) return '';
    const ts = Date.parse(iso);
    if (Number.isNaN(ts)) return '';

    const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const diffSec = (ts - Date.now()) / 1000;

    for (const [unit, secs] of UNITS) {
        if (Math.abs(diffSec) >= secs || unit === 'second') {
            return fmt.format(Math.round(diffSec / secs), unit);
        }
    }
    return '';
}
