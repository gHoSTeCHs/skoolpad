/** Tiptap document JSON structure */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TiptapJSON = Record<string, any>;

/** Any content that ContentRenderer can handle */
export type RenderableContent = TiptapJSON | string | null;

/** Type guard: true when value is a Tiptap JSON document (object with type === 'doc') */
export function isTiptapJSON(value: unknown): value is TiptapJSON {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        (value as TiptapJSON).type === 'doc'
    );
}
