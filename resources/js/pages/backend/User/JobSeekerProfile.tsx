import { Head, usePage } from '@inertiajs/react';
import {
    Award,
    BriefcaseBusiness,
    Check,
    FileText,
    GraduationCap,
    Languages,
    MapPin,
    Pencil,
    UserRound,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
    PROFILE_COMPLETION,
    getInitials,
} from '@/components/job-seeker/demo-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import JobSeekerLayout from '@/layouts/job-seeker-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const sections = [
    { id: 'personal', label: 'Personal Information', complete: true },
    { id: 'professional', label: 'Professional Information', complete: true },
    { id: 'education', label: 'Education', complete: true },
    { id: 'experience', label: 'Work Experience', complete: false },
    { id: 'skills', label: 'Skills', complete: true },
    { id: 'languages', label: 'Languages', complete: true },
    { id: 'certifications', label: 'Certifications', complete: false },
    { id: 'resume', label: 'Resume & Documents', complete: true },
] as const;

const skills = [
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Node.js',
    'GraphQL',
    'Figma',
    'Git',
    'Docker',
];

export default function JobSeekerProfile() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const initials = getInitials(user.name);
    const [editingSection, setEditingSection] = useState<string | null>(null);

    return (
        <JobSeekerLayout title="My Profile" unreadCount={3}>
            <Head title="My Profile" />

            <div className="p-6">
                <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.06)]">
                    <div
                        className="flex flex-col gap-4 p-7 sm:flex-row sm:items-center"
                        style={{
                            backgroundImage:
                                'linear-gradient(174deg, rgb(57, 119, 166) 0%, rgb(30, 58, 138) 100%)',
                        }}
                    >
                        <div className="flex size-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-extrabold text-white">
                                {user.name}
                            </h1>
                            <p className="mt-1 text-sm text-[#bfdbfe]">
                                Senior Frontend Developer
                            </p>
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-[#93c5fd]">
                                <MapPin className="size-3.5" />
                                Riyadh, Saudi Arabia
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/32">
                                    <div
                                        className="h-full rounded-full bg-[#0057c8]"
                                        style={{
                                            width: `${PROFILE_COMPLETION}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-[#bedbff]">
                                    {PROFILE_COMPLETION}% Profile Completion
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-[#f1f5f9] p-4">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8faff] px-3 py-1.5 text-xs font-medium text-[#3977a6] transition-colors hover:bg-white"
                            >
                                {section.label}
                                {section.complete ? (
                                    <Check className="size-3 text-[#15803d]" />
                                ) : (
                                    <span className="text-[#ef4444]">!</span>
                                )}
                            </a>
                        ))}
                    </div>

                    <ProfileSection
                        id="personal"
                        icon={UserRound}
                        title="Personal Information"
                        complete
                        editing={editingSection === 'personal'}
                        onEdit={() => setEditingSection('personal')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        {editingSection === 'personal' ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Full Name"
                                    defaultValue={user.name}
                                />
                                <Field
                                    label="Professional Headline"
                                    defaultValue="Senior Frontend Developer"
                                />
                                <Field
                                    label="Location"
                                    defaultValue="Riyadh, Saudi Arabia"
                                />
                                <Field
                                    label="Email Address"
                                    defaultValue={user.email}
                                />
                                <Field
                                    label="Phone Number"
                                    defaultValue="+966 50 123 4567"
                                />
                                <Field
                                    label="Personal Website"
                                    defaultValue=""
                                    placeholder="https://"
                                />
                                <Field
                                    label="LinkedIn Profile"
                                    defaultValue="linkedin.com/in/ahmed-rashidi"
                                />
                                <Field
                                    label="GitHub Profile"
                                    defaultValue="github.com/ahmedrashidi"
                                />
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    label="Full Name"
                                    value={user.name}
                                />
                                <Info
                                    label="Professional Headline"
                                    value="Senior Frontend Developer"
                                />
                                <Info
                                    label="Location"
                                    value="Riyadh, Saudi Arabia"
                                />
                                <Info
                                    label="Email Address"
                                    value={user.email}
                                />
                                <Info
                                    label="Phone Number"
                                    value="+966 50 123 4567"
                                />
                                <Info
                                    label="LinkedIn Profile"
                                    value="linkedin.com/in/ahmed-rashidi"
                                />
                                <Info
                                    label="GitHub Profile"
                                    value="github.com/ahmedrashidi"
                                />
                            </div>
                        )}
                    </ProfileSection>

                    <ProfileSection
                        id="professional"
                        icon={BriefcaseBusiness}
                        title="Professional Information"
                        complete
                        editing={editingSection === 'professional'}
                        onEdit={() => setEditingSection('professional')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Info
                                label="Current Job Title"
                                value="Senior Frontend Developer"
                            />
                            <Info label="Years of Experience" value="6 years" />
                            <Info
                                label="Industry"
                                value="Information Technology"
                            />
                            <Info
                                label="Expected Salary"
                                value="SAR 18,000 - 22,000"
                            />
                            <div className="sm:col-span-2">
                                <p className="text-xs text-[#99a1af]">
                                    Available For
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {['Full Time', 'Remote'].map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        id="education"
                        icon={GraduationCap}
                        title="Education"
                        complete
                        editing={false}
                        onEdit={() => setEditingSection('education')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        <div>
                            <p className="text-sm font-semibold text-[#101828]">
                                Bachelor of Science in Computer Science
                            </p>
                            <p className="mt-1 text-sm text-[#6a7282]">
                                King Fahd University · 2015-2019
                            </p>
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        id="experience"
                        icon={BriefcaseBusiness}
                        title="Work Experience"
                        complete={false}
                        editing={false}
                        onEdit={() => setEditingSection('experience')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        <div className="relative space-y-5 border-l-2 border-[#fde68a] pl-5">
                            {[
                                {
                                    title: 'Frontend Developer',
                                    company: 'NovaCorp',
                                    period: '2021 - Present',
                                    description:
                                        'Built and maintained React applications with TypeScript and design systems.',
                                },
                                {
                                    title: 'Junior Developer',
                                    company: 'StartupXYZ',
                                    period: '2019 - 2021',
                                    description:
                                        'Developed UI features and collaborated with product teams.',
                                },
                            ].map((job) => (
                                <div key={job.title} className="relative">
                                    <span className="absolute top-1 -left-[27px] size-3 rounded-full bg-[#f59e0b]" />
                                    <p className="text-sm font-semibold text-[#101828]">
                                        {job.title} at {job.company}
                                    </p>
                                    <p className="text-xs text-[#99a1af]">
                                        {job.period}
                                    </p>
                                    <p className="mt-1 text-sm text-[#6a7282]">
                                        {job.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        id="skills"
                        icon={Award}
                        title="Skills"
                        complete
                        editing={false}
                        onEdit={() => setEditingSection('skills')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1e3a8a]"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        id="languages"
                        icon={Languages}
                        title="Languages"
                        complete
                        editing={false}
                        onEdit={() => setEditingSection('languages')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        <div className="space-y-3">
                            {[
                                { name: 'Arabic', level: 'Native' },
                                { name: 'English', level: 'Advanced' },
                            ].map((language) => (
                                <div
                                    key={language.name}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-sm font-medium text-[#101828]">
                                        {language.name}
                                    </span>
                                    <span className="rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-semibold text-[#15803d]">
                                        {language.level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        id="certifications"
                        icon={Award}
                        title="Certifications"
                        complete={false}
                        editing={false}
                        onEdit={() => setEditingSection('certifications')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                    >
                        <div>
                            <p className="text-sm font-semibold text-[#101828]">
                                AWS Certified Developer
                            </p>
                            <p className="mt-1 text-sm text-[#6a7282]">
                                Amazon Web Services · 2024-03
                            </p>
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        id="resume"
                        icon={FileText}
                        title="Resume & Documents"
                        complete
                        editing={false}
                        onEdit={() => setEditingSection('resume')}
                        onCancel={() => setEditingSection(null)}
                        onSave={() => setEditingSection(null)}
                        className="border-b-0"
                    >
                        <div className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-[#fee2e2] text-sm font-bold text-[#b91c1c]">
                                    PDF
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#101828]">
                                        Ahmed_CV_2026.pdf
                                    </p>
                                    <p className="text-xs text-[#99a1af]">
                                        Uploaded Aug 1, 2026 · 245 KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl border-[#e2e8f0] text-[#1e3a8a]"
                            >
                                Download
                            </Button>
                        </div>
                    </ProfileSection>
                </div>
            </div>
        </JobSeekerLayout>
    );
}

function ProfileSection({
    id,
    icon: Icon,
    title,
    complete,
    editing,
    onEdit,
    onCancel,
    onSave,
    children,
    className,
}: {
    id: string;
    icon: typeof UserRound;
    title: string;
    complete: boolean;
    editing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            id={id}
            className={cn('border-b border-[#f1f5f9] p-5', className)}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Icon className="size-5 text-[#1e3a8a]" />
                    <h2 className="text-base font-bold text-[#101828]">
                        {title}
                    </h2>
                    <span
                        className={cn(
                            'flex size-5 items-center justify-center rounded-full',
                            complete
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : 'bg-[#fee2e2] text-[#b91c1c]',
                        )}
                    >
                        {complete ? (
                            <Check className="size-3" />
                        ) : (
                            <X className="size-3" />
                        )}
                    </span>
                </div>
                {editing ? (
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            onClick={onSave}
                            className="rounded-xl bg-[#0057c8] text-white hover:bg-[#0046a3]"
                        >
                            Save Changes
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="rounded-xl border-[#e2e8f0]"
                        >
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onEdit}
                        className="rounded-xl border-[#e2e8f0] text-[#1e3a8a]"
                    >
                        <Pencil className="size-3.5" />
                        Edit
                    </Button>
                )}
            </div>
            {children}
        </section>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-[#99a1af]">{label}</p>
            <p className="mt-1 text-sm font-medium text-[#101828]">{value}</p>
        </div>
    );
}

function Field({
    label,
    defaultValue,
    placeholder,
}: {
    label: string;
    defaultValue: string;
    placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-[#99a1af]">{label}</Label>
            <Input
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="rounded-xl border-[#e2e8f0]"
            />
        </div>
    );
}
