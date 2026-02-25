const BLOCK_TYPE_EMOJIS: Record<string, string> = {
    container: '\uD83D\uDCC1',
    text: '\uD83D\uDCC4',
    code: '\uD83D\uDCBB',
    diagram: '\uD83D\uDCC8',
    example: '\uD83D\uDCA1',
    exercise: '\uD83C\uDFAF',
    quiz: '\u2753',
    reference: '\uD83D\uDD17',
    comparison: '\u2696\uFE0F',
};

export default function BlockTypeIcon({ type, className }: { type: string; className?: string }) {
    return <span className={className ?? 'text-[12px]'}>{BLOCK_TYPE_EMOJIS[type] ?? '\uD83D\uDCC4'}</span>;
}
