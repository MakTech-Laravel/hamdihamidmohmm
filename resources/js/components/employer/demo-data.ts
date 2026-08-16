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

export const EMPLOYER_STATS = [
    { icon: '💼', value: '5', label: 'Total Jobs Posted' },
    { icon: '✅', value: '3', label: 'Active Jobs' },
    { icon: '👥', value: '80', label: 'Total Applications' },
    { icon: '🆕', value: '10', label: 'New This Week' },
] as const;

export const EMPLOYER_QUICK_ACTIONS = [
    { icon: '📝', label: 'Post Job', href: '/employer/jobs' },
    { icon: '📋', label: 'Review Applications', href: '/employer/applications' },
    { icon: '🏢', label: 'Company Profile', href: '/employer/profile' },
    { icon: '💳', label: 'Manage Billing', href: '/employer/packages' },
] as const;

export const EMPLOYER_ACTIVE_JOBS = [
    {
        title: 'Senior Frontend Developer',
        location: 'Dubai',
        type: 'Full-time',
        applications: 24,
        remaining: '18 days left',
    },
    {
        title: 'Product Designer',
        location: 'Remote',
        type: 'Contract',
        applications: 31,
        remaining: '12 days left',
    },
    {
        title: 'Backend Engineer',
        location: 'Abu Dhabi',
        type: 'Full-time',
        applications: 17,
        remaining: '25 days left',
    },
] as const;

export const EMPLOYER_RECENT_APPLICATIONS = [
    {
        name: 'Ahmed Al-Rashidi',
        job: 'Senior Frontend Developer',
        date: 'Aug 10, 2026',
        status: 'Interview',
        tone: 'purple' as const,
        avatar: 'bg-[#ede9fe] text-[#6d28d9]',
    },
    {
        name: 'Sara Mansour',
        job: 'Product Designer',
        date: 'Aug 9, 2026',
        status: 'Shortlisted',
        tone: 'success' as const,
        avatar: 'bg-[#dcfce7] text-[#15803d]',
    },
    {
        name: 'Omar Khalil',
        job: 'Backend Engineer',
        date: 'Aug 8, 2026',
        status: 'Under Review',
        tone: 'warning' as const,
        avatar: 'bg-[#ffedd5] text-[#c2410c]',
    },
    {
        name: 'Layla Hassan',
        job: 'Senior Frontend Developer',
        date: 'Aug 7, 2026',
        status: 'Applied',
        tone: 'info' as const,
        avatar: 'bg-[#dbeafe] text-[#1d4ed8]',
    },
] as const;

export const EMPLOYER_NOTIFICATIONS = [
    {
        icon: '📥',
        title: '5 New Applications',
        detail: 'New candidates applied to Senior Frontend Developer.',
        time: '2 hours ago',
    },
    {
        icon: '⏰',
        title: 'Job Expiring Soon',
        detail: 'Product Designer expires in 12 days. Consider renewing.',
        time: 'Yesterday',
    },
] as const;

export const applicationToneClass: Record<string, string> = {
    purple: 'bg-[#ede9fe] text-[#6d28d9]',
    success: 'bg-[#dcfce7] text-[#15803d]',
    warning: 'bg-[#ffedd5] text-[#c2410c]',
    info: 'bg-[#dbeafe] text-[#1d4ed8]',
    interview: 'bg-[#fdf4ff] text-[#7e22ce]',
    shortlisted: 'bg-[#f0fdf4] text-[#15803d]',
    underReview: 'bg-[#fff7ed] text-[#c2410c]',
    applied: 'bg-[#e6f0fb] text-[#0057c8]',
    rejected: 'bg-[#fef2f2] text-[#b91c1c]',
};

export type ProfileSectionStatus = 'complete' | 'incomplete';

export type CompanyProfileSection = {
    id: string;
    title: string;
    status: ProfileSectionStatus;
    fields?: { label: string; value: string }[];
    content?: string;
    emptyMessage?: string;
    initials?: string;
    documentNote?: string;
};

export const COMPANY_PROFILE_SECTIONS: CompanyProfileSection[] = [
    {
        id: 'company-info',
        title: 'Company Information',
        status: 'complete',
        fields: [
            { label: 'Company Name', value: 'TechCorp Solutions' },
            { label: 'Industry', value: 'Technology' },
            { label: 'Company Size', value: '51-200 employees' },
            { label: 'Founded', value: '2018' },
            { label: 'Website', value: 'www.techcorp.ae' },
        ],
    },
    {
        id: 'company-logo',
        title: 'Company Logo',
        status: 'complete',
        initials: 'TC',
    },
    {
        id: 'about',
        title: 'About Company',
        status: 'complete',
        content:
            'TechCorp Solutions is a leading technology consultancy based in Dubai, UAE. We specialize in digital transformation, cloud infrastructure, and enterprise software solutions for clients across the GCC region.',
    },
    {
        id: 'contact',
        title: 'Contact Information',
        status: 'complete',
        fields: [
            { label: 'Contact Name', value: 'Khalid Al-Mansoori' },
            { label: 'Title', value: 'HR Director' },
            { label: 'Email', value: 'khalid@techcorp.ae' },
            { label: 'Phone', value: '+971 4 123 4567' },
        ],
    },
    {
        id: 'social',
        title: 'Social Links',
        status: 'incomplete',
        emptyMessage: 'Add LinkedIn, X, Instagram',
    },
    {
        id: 'verification',
        title: 'Verification Documents',
        status: 'complete',
        documentNote: 'CR document uploaded and verified',
    },
    {
        id: 'cover',
        title: 'Cover Banner',
        status: 'incomplete',
        emptyMessage: 'No cover banner uploaded',
    },
];

export const PROFILE_COMPLETION = {
    percent: 82,
    completed: 5,
    total: 7,
    missing: ['Social Links', 'Cover Banner'],
    verifiedOn: 'Aug 1, 2026',
};

export type PackagePlan = {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    isCurrent?: boolean;
};

export const PACKAGE_PLANS: PackagePlan[] = [
    {
        id: 'starter',
        name: 'Starter',
        price: 450,
        currency: 'SAR',
        features: [
            '3 job postings per month',
            'Basic candidate search',
            'Email support',
            'Standard listing visibility',
        ],
    },
    {
        id: 'business',
        name: 'Business',
        price: 1200,
        currency: 'SAR',
        isCurrent: true,
        features: [
            '10 job postings per month',
            'Featured job listings (2/month)',
            'Priority candidate matching',
            'Analytics dashboard',
            'Dedicated account manager',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2800,
        currency: 'SAR',
        features: [
            'Unlimited job postings',
            'Unlimited featured listings',
            'AI-powered candidate screening',
            'Custom branding on listings',
            '24/7 premium support',
            'API access',
        ],
    },
];

export const CURRENT_PACKAGE = {
    name: 'Business Package',
    status: 'Active',
    expiresOn: 'Aug 31, 2026',
    daysLeft: 23,
    creditsUsed: 5,
    creditsTotal: 10,
    creditsRemaining: 5,
    creditBreakdown: {
        jobsPosted: 3,
        featured: 2,
        remaining: 5,
    },
};

export type InvoiceRow = {
    id: string;
    date: string;
    description: string;
    amount: string;
    status: 'Paid' | 'Pending' | 'Failed';
};

export const INVOICE_HISTORY: InvoiceRow[] = [
    {
        id: 'INV-2026-0847',
        date: 'Aug 1, 2026',
        description: 'Business Package — Monthly Renewal',
        amount: 'SAR 1,200',
        status: 'Paid',
    },
    {
        id: 'INV-2026-0712',
        date: 'Jul 1, 2026',
        description: 'Business Package — Monthly Renewal',
        amount: 'SAR 1,200',
        status: 'Paid',
    },
    {
        id: 'INV-2026-0589',
        date: 'Jun 1, 2026',
        description: 'Featured Job Listing Add-on',
        amount: 'SAR 350',
        status: 'Paid',
    },
    {
        id: 'INV-2026-0441',
        date: 'May 1, 2026',
        description: 'Business Package — Monthly Renewal',
        amount: 'SAR 1,200',
        status: 'Paid',
    },
];

export type JobStatus = 'Active' | 'Draft' | 'Expired' | 'Closed';

export type EmployerJob = {
    id: string;
    title: string;
    category: string;
    postedDate: string;
    expiresDate: string;
    location: string;
    type: string;
    salary: string;
    status: JobStatus;
    applications: number;
    newApplications: number;
    views: number;
};

export const MY_JOBS: EmployerJob[] = [
    {
        id: 'job-1',
        title: 'Senior Frontend Developer',
        category: 'Technology',
        postedDate: 'Aug 1, 2026',
        expiresDate: 'Sep 1, 2026',
        location: 'Riyadh',
        type: 'Full Time',
        salary: 'SAR 15,000–20,000',
        status: 'Active',
        applications: 24,
        newApplications: 5,
        views: 312,
    },
    {
        id: 'job-2',
        title: 'Backend Engineer',
        category: 'Technology',
        postedDate: 'Aug 3, 2026',
        expiresDate: 'Sep 3, 2026',
        location: 'Remote',
        type: 'Full Time',
        salary: 'SAR 12,000–18,000',
        status: 'Active',
        applications: 17,
        newApplications: 3,
        views: 248,
    },
    {
        id: 'job-3',
        title: 'UI/UX Designer',
        category: 'Design',
        postedDate: 'Jul 28, 2026',
        expiresDate: 'Aug 28, 2026',
        location: 'Riyadh',
        type: 'Full Time',
        salary: 'SAR 18,000–25,000',
        status: 'Active',
        applications: 31,
        newApplications: 2,
        views: 401,
    },
    {
        id: 'job-4',
        title: 'DevOps Specialist',
        category: 'Technology',
        postedDate: 'Aug 5, 2026',
        expiresDate: '—',
        location: 'Jeddah',
        type: 'Full Time',
        salary: 'SAR 10,000–14,000',
        status: 'Draft',
        applications: 0,
        newApplications: 0,
        views: 0,
    },
    {
        id: 'job-5',
        title: 'Marketing Manager',
        category: 'Marketing',
        postedDate: 'May 1, 2026',
        expiresDate: 'Jul 31, 2026',
        location: 'Riyadh',
        type: 'Full Time',
        salary: 'SAR 10,000–15,000',
        status: 'Expired',
        applications: 8,
        newApplications: 0,
        views: 198,
    },
];

export const JOB_STATUS_TONE: Record<JobStatus, string> = {
    Active: 'bg-[#dcfce7] text-[#166534]',
    Draft: 'bg-[#f3f4f6] text-[#6b7280]',
    Expired: 'bg-[#fef2f2] text-[#b91c1c]',
    Closed: 'bg-[#e6f0fb] text-[#0057c8]',
};

export type ApplicationStatus =
    | 'Interview'
    | 'Shortlisted'
    | 'Under Review'
    | 'Applied'
    | 'Rejected';

export type ApplicationRow = {
    id: string;
    name: string;
    job: string;
    status: ApplicationStatus;
    appliedDate: string;
    experience: string;
    location: string;
};

export const APPLICATION_ROWS: ApplicationRow[] = [
    {
        id: 'app-1',
        name: 'Ahmed Al-Rashidi',
        job: 'Senior Frontend Developer',
        status: 'Interview',
        appliedDate: 'Aug 10, 2026',
        experience: '7 years',
        location: 'Dubai',
    },
    {
        id: 'app-2',
        name: 'Sara Mansour',
        job: 'Product Designer',
        status: 'Shortlisted',
        appliedDate: 'Aug 9, 2026',
        experience: '5 years',
        location: 'Abu Dhabi',
    },
    {
        id: 'app-3',
        name: 'Omar Khalil',
        job: 'Backend Engineer',
        status: 'Under Review',
        appliedDate: 'Aug 8, 2026',
        experience: '4 years',
        location: 'Dubai',
    },
    {
        id: 'app-4',
        name: 'Layla Hassan',
        job: 'Senior Frontend Developer',
        status: 'Applied',
        appliedDate: 'Aug 7, 2026',
        experience: '3 years',
        location: 'Sharjah',
    },
    {
        id: 'app-5',
        name: 'Fatima Al-Zahra',
        job: 'Product Designer',
        status: 'Under Review',
        appliedDate: 'Aug 6, 2026',
        experience: '6 years',
        location: 'Remote',
    },
    {
        id: 'app-6',
        name: 'Youssef Ibrahim',
        job: 'Backend Engineer',
        status: 'Rejected',
        appliedDate: 'Aug 4, 2026',
        experience: '2 years',
        location: 'Ajman',
    },
    {
        id: 'app-7',
        name: 'Mariam Al-Suwaidi',
        job: 'Senior Frontend Developer',
        status: 'Applied',
        appliedDate: 'Aug 3, 2026',
        experience: '5 years',
        location: 'Dubai',
    },
];

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, string> = {
    Interview: 'bg-[#fdf4ff] text-[#7e22ce]',
    Shortlisted: 'bg-[#f0fdf4] text-[#15803d]',
    'Under Review': 'bg-[#fff7ed] text-[#c2410c]',
    Applied: 'bg-[#e6f0fb] text-[#0057c8]',
    Rejected: 'bg-[#fef2f2] text-[#b91c1c]',
};

export const APPLICATION_STATS = {
    total: 49,
    newThisWeek: 10,
    shortlisted: 1,
    interviewsScheduled: 1,
};

export type NotificationCategory =
    | 'Applications'
    | 'Jobs'
    | 'Billing'
    | 'System';

export type NotificationItem = {
    id: string;
    category: NotificationCategory;
    title: string;
    detail: string;
    time: string;
    unread: boolean;
};

export const NOTIFICATION_FEED: NotificationItem[] = [
    {
        id: 'notif-1',
        category: 'Applications',
        title: '5 New Applications Received',
        detail: 'New candidates applied to Senior Frontend Developer in Dubai.',
        time: '2 hours ago',
        unread: true,
    },
    {
        id: 'notif-2',
        category: 'Jobs',
        title: 'Job Expiring Soon',
        detail: 'Product Designer listing expires in 12 days. Consider renewing.',
        time: 'Yesterday',
        unread: true,
    },
    {
        id: 'notif-3',
        category: 'Billing',
        title: 'Invoice Payment Confirmed',
        detail: 'Your payment of SAR 1,200 for Business Package was processed successfully.',
        time: 'Aug 1, 2026',
        unread: false,
    },
    {
        id: 'notif-4',
        category: 'System',
        title: 'Profile Verification Complete',
        detail: 'Your company profile has been verified. You now have full portal access.',
        time: 'Aug 1, 2026',
        unread: false,
    },
    {
        id: 'notif-5',
        category: 'Applications',
        title: 'Interview Scheduled',
        detail: 'Ahmed Al-Rashidi interview confirmed for Aug 14, 2026 at 10:00 AM.',
        time: 'Aug 9, 2026',
        unread: false,
    },
];
