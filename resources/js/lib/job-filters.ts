export function normalizeJobFilterToken(value: string | null | undefined): string {
    return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function employmentTypeMatches(
    storedType: string | null | undefined,
    selectedTypes: string[],
): boolean {
    if (selectedTypes.length === 0) {
        return true;
    }

    const stored = normalizeJobFilterToken(storedType);

    if (!stored) {
        return false;
    }

    return selectedTypes.some(
        (type) => normalizeJobFilterToken(type) === stored,
    );
}

export function categoryTranslationKey(category: string): string {
    return `category.${category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}
