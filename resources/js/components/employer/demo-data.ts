export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function firstName(name: string): string {
    return name.split(' ')[0] || name;
}

export const EMPLOYER_QUICK_ACTIONS = [
    { icon: '📝', label: 'Post Job', href: '/employer/jobs' },
    { icon: '📋', label: 'Review Applications', href: '/employer/applications' },
    { icon: '🏢', label: 'Organization Profile', href: '/employer/profile' },
    { icon: '💳', label: 'Manage Billing', href: '/employer/packages' },
] as const;
