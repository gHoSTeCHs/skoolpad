/**
 * Converts a string into a URL-friendly slug following Laravel's Str::slug() behavior.
 *
 * Applies a 6-step transformation:
 * 1. Convert to lowercase
 * 2. Trim leading/trailing whitespace
 * 3. Remove special characters (keep word characters, spaces, hyphens)
 * 4. Replace spaces and underscores with hyphens
 * 5. Collapse consecutive hyphens into single hyphens
 * 6. Remove leading and trailing hyphens
 *
 * @param value - The input string to slugify
 * @returns A URL-safe slug string
 *
 * @example
 * slugify('Hello World') // 'hello-world'
 * slugify('  Spaced  ') // 'spaced'
 * slugify('Multi---dash') // 'multi-dash'
 * slugify('Under_score') // 'under-score'
 * slugify('Special@#$') // 'special'
 */
export function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Validates whether a string conforms to valid slug format.
 *
 * A valid slug:
 * - Contains only lowercase letters, numbers, and hyphens
 * - Has no consecutive hyphens
 * - Has no leading or trailing hyphens
 *
 * @param value - The string to validate
 * @returns True if the string is a valid slug, false otherwise
 *
 * @example
 * isValidSlug('hello-world') // true
 * isValidSlug('hello--world') // false (consecutive hyphens)
 * isValidSlug('-hello') // false (leading hyphen)
 * isValidSlug('Hello-World') // false (uppercase)
 */
export function isValidSlug(value: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
