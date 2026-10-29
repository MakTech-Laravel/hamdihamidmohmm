/**
 * Alternating row background for employer portal lists.
 * Even index: white; odd index: soft employer tint.
 */
export function employerListRowBg(index: number): string {
    return index % 2 === 0 ? 'bg-white' : 'bg-[#f8faff]';
}
