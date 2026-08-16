export type ApplicationStatus =
    | 'Applied'
    | 'Under Review'
    | 'Shortlisted'
    | 'Interview'
    | 'Rejected'
    | 'Offer'
    | 'Hired'
    | 'Withdrawn';

export type NotificationCategory =
    | 'Interview'
    | 'Application'
    | 'Recommendation'
    | 'System';

export const PROFILE_COMPLETION = 72;

export const PROFILE_SECTIONS = [
    { id: 'personal', label: 'Personal Information', complete: true },
    { id: 'professional', label: 'Professional Information', complete: true },
    { id: 'education', label: 'Education', complete: true },
    { id: 'experience', label: 'Work Experience', complete: false },
    { id: 'skills', label: 'Skills', complete: true },
    { id: 'resume', label: 'Resume', complete: true },
    { id: 'languages', label: 'Languages', complete: true },
    { id: 'certifications', label: 'Certifications', complete: false },
] as const;

export const APPLICATIONS = [
    {
        id: 1,
        initials: 'TC',
        title: 'Senior Frontend Developer',
        company: 'TechCorp Solutions',
        location: 'Riyadh, SA',
        appliedAt: 'Aug 3, 2026',
        salary: 'SAR 15,000 - 20,000',
        type: 'Full Time',
        status: 'Interview' as ApplicationStatus,
        progress: 4,
        resume: 'Ahmed_CV_2026.pdf',
        timeline: [
            { label: 'Applied', date: 'Aug 3, 2026', state: 'done' as const },
            { label: 'Under Review', date: 'Aug 4, 2026', state: 'done' as const },
            { label: 'Shortlisted', date: 'Aug 5, 2026', state: 'done' as const },
            { label: 'Interview', date: 'Aug 7, 2026', state: 'current' as const },
            { label: 'Offer', date: null, state: 'pending' as const },
            { label: 'Hired', date: null, state: 'pending' as const },
        ],
    },
    {
        id: 2,
        initials: 'PC',
        title: 'UX/UI Designer',
        company: 'PixelCraft Studio',
        location: 'Remote',
        appliedAt: 'Jul 28, 2026',
        salary: 'SAR 12,000 - 16,000',
        type: 'Full Time',
        status: 'Under Review' as ApplicationStatus,
        progress: 2,
        resume: 'Ahmed_CV_2026.pdf',
        timeline: [
            { label: 'Applied', date: 'Jul 28, 2026', state: 'done' as const },
            { label: 'Under Review', date: 'Jul 30, 2026', state: 'current' as const },
            { label: 'Shortlisted', date: null, state: 'pending' as const },
            { label: 'Interview', date: null, state: 'pending' as const },
            { label: 'Offer', date: null, state: 'pending' as const },
            { label: 'Hired', date: null, state: 'pending' as const },
        ],
    },
    {
        id: 3,
        initials: 'IA',
        title: 'Data Scientist',
        company: 'Insight Analytics',
        location: 'Riyadh, SA',
        appliedAt: 'Jul 20, 2026',
        salary: 'SAR 18,000 - 25,000',
        type: 'Full Time',
        status: 'Rejected' as ApplicationStatus,
        progress: 2,
        resume: 'Ahmed_CV_2026.pdf',
        timeline: [
            { label: 'Applied', date: 'Jul 20, 2026', state: 'done' as const },
            { label: 'Under Review', date: 'Jul 22, 2026', state: 'done' as const },
            { label: 'Shortlisted', date: null, state: 'pending' as const },
            { label: 'Interview', date: null, state: 'pending' as const },
            { label: 'Offer', date: null, state: 'pending' as const },
            { label: 'Hired', date: null, state: 'pending' as const },
        ],
    },
    {
        id: 4,
        initials: 'GF',
        title: 'Financial Analyst',
        company: 'Gulf Finance Group',
        location: 'Dubai, UAE',
        appliedAt: 'Aug 1, 2026',
        salary: 'SAR 14,000 - 18,000',
        type: 'Full Time',
        status: 'Shortlisted' as ApplicationStatus,
        progress: 3,
        resume: 'Ahmed_CV_2026.pdf',
        timeline: [
            { label: 'Applied', date: 'Aug 1, 2026', state: 'done' as const },
            { label: 'Under Review', date: 'Aug 2, 2026', state: 'done' as const },
            { label: 'Shortlisted', date: 'Aug 4, 2026', state: 'current' as const },
            { label: 'Interview', date: null, state: 'pending' as const },
            { label: 'Offer', date: null, state: 'pending' as const },
            { label: 'Hired', date: null, state: 'pending' as const },
        ],
    },
    {
        id: 5,
        initials: 'BH',
        title: 'Marketing Manager',
        company: 'BrandHouse Agency',
        location: 'Jeddah, SA',
        appliedAt: 'Aug 5, 2026',
        salary: 'SAR 13,000 - 17,000',
        type: 'Full Time',
        status: 'Applied' as ApplicationStatus,
        progress: 1,
        resume: 'Ahmed_CV_2026.pdf',
        timeline: [
            { label: 'Applied', date: 'Aug 5, 2026', state: 'current' as const },
            { label: 'Under Review', date: null, state: 'pending' as const },
            { label: 'Shortlisted', date: null, state: 'pending' as const },
            { label: 'Interview', date: null, state: 'pending' as const },
            { label: 'Offer', date: null, state: 'pending' as const },
            { label: 'Hired', date: null, state: 'pending' as const },
        ],
    },
];

export const NOTIFICATIONS = [
    {
        id: 1,
        title: 'Interview Invitation',
        body: 'TechCorp Solutions has invited you for an interview for the Senior Frontend Developer position.',
        time: '2 hours ago',
        category: 'Interview' as NotificationCategory,
        unread: true,
    },
    {
        id: 2,
        title: 'Application Shortlisted',
        body: 'Gulf Finance Group has shortlisted your application for Financial Analyst.',
        time: '5 hours ago',
        category: 'Application' as NotificationCategory,
        unread: true,
    },
    {
        id: 3,
        title: 'New Job Match',
        body: 'A new Software Engineer role at NovaCorp matches your profile.',
        time: '1 day ago',
        category: 'Recommendation' as NotificationCategory,
        unread: false,
    },
    {
        id: 4,
        title: 'Application Under Review',
        body: 'PixelCraft Studio is reviewing your application for UX/UI Designer.',
        time: '2 days ago',
        category: 'Application' as NotificationCategory,
        unread: false,
    },
    {
        id: 5,
        title: 'Profile Completion Reminder',
        body: 'Complete your profile to increase your chances of getting hired.',
        time: '3 days ago',
        category: 'System' as NotificationCategory,
        unread: false,
    },
];

export const STATUS_STYLES: Record<
    ApplicationStatus,
    { badge: string; dot: string; text: string }
> = {
    Applied: {
        badge: 'bg-[#eff6ff]',
        dot: 'bg-[#3b82f6]',
        text: 'text-[#1d4ed8]',
    },
    'Under Review': {
        badge: 'bg-[#fff7ed]',
        dot: 'bg-[#f97316]',
        text: 'text-[#c2410c]',
    },
    Shortlisted: {
        badge: 'bg-[#fdf4ff]',
        dot: 'bg-[#a855f7]',
        text: 'text-[#7e22ce]',
    },
    Interview: {
        badge: 'bg-[#f0fdf4]',
        dot: 'bg-[#22c55e]',
        text: 'text-[#15803d]',
    },
    Rejected: {
        badge: 'bg-[#fef2f2]',
        dot: 'bg-[#ef4444]',
        text: 'text-[#b91c1c]',
    },
    Offer: {
        badge: 'bg-[#f5f3ff]',
        dot: 'bg-[#8b5cf6]',
        text: 'text-[#6d28d9]',
    },
    Hired: {
        badge: 'bg-[#ecfdf5]',
        dot: 'bg-[#10b981]',
        text: 'text-[#047857]',
    },
    Withdrawn: {
        badge: 'bg-[#f1f5f9]',
        dot: 'bg-[#64748b]',
        text: 'text-[#475569]',
    },
};

export function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function firstName(name: string): string {
    return name.split(/\s+/).filter(Boolean)[0] ?? name;
}
