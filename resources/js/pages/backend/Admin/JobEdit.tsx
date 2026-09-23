import { Form, Head, Link, usePage } from '@inertiajs/react';

import {
    show,
    update,
} from '@/actions/App/Http/Controllers/Backend/Admin/JobManagementController';
import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminSecondaryButton,
} from '@/components/admin-portal/ui';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type Option = { value: string; label: string };

type Job = {
    id: number;
    title: string;
    subtitle: string | null;
    category: string | null;
    country: string | null;
    location: string | null;
    employment_type: string | null;
    experience_level: string | null;
    salary_range: string | null;
    description: string | null;
    requirements: string | null;
    skills: string[];
    expires_at: string | null;
    status: string;
};

type Props = {
    job: Job;
    options: {
        countries: Option[];
        dutyStations: Option[];
        positionAreas: Option[];
        employmentTypes: Option[];
        experience_levels: string[];
        statuses: Option[];
    };
};

export default function JobEdit({ job, options }: Props) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();

    return (
        <AdminPortalLayout>
            <Head
                title={t('admin.jobs.edit_title', {
                    title: job.title,
                })}
            />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.jobs.edit_title', {
                        title: job.title,
                    })}
                    subtitle={t('admin.jobs.edit_subtitle')}
                    actions={
                        <Link href={show.url(job.id)}>
                            <AdminSecondaryButton>
                                {t('common.back')}
                            </AdminSecondaryButton>
                        </Link>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <AdminPanel className="max-w-3xl">
                    <Form
                        {...update.form(job.id)}
                        className="space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">
                                        {t('admin.jobs.cols.title')}
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        defaultValue={job.title}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="subtitle">Subtitle</Label>
                                    <Input
                                        id="subtitle"
                                        name="subtitle"
                                        defaultValue={job.subtitle ?? ''}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.subtitle} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="category">
                                            {t('admin.jobs.fields.category')}
                                        </Label>
                                        <NativeSelect
                                            id="category"
                                            name="category"
                                            defaultValue={job.category ?? ''}
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.positionAreas.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </NativeSelect>
                                        <InputError message={errors.category} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="location">
                                            {t('common.location')}
                                        </Label>
                                        <NativeSelect
                                            id="location"
                                            name="location"
                                            defaultValue={job.location ?? ''}
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.dutyStations.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </NativeSelect>
                                        <InputError message={errors.location} />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="country">Country</Label>
                                        <NativeSelect
                                            id="country"
                                            name="country"
                                            defaultValue={job.country ?? ''}
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            <option value="">—</option>
                                            {options.countries.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                        <InputError message={errors.country} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="employment_type">
                                            {t('admin.jobs.fields.type')}
                                        </Label>
                                        <NativeSelect
                                            id="employment_type"
                                            name="employment_type"
                                            defaultValue={
                                                job.employment_type ?? ''
                                            }
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.employmentTypes.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </NativeSelect>
                                        <InputError
                                            message={errors.employment_type}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="experience_level">
                                            {t('admin.jobs.fields.experience')}
                                        </Label>
                                        <NativeSelect
                                            id="experience_level"
                                            name="experience_level"
                                            defaultValue={
                                                job.experience_level ?? ''
                                            }
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.experience_levels.map(
                                                (level) => (
                                                    <option
                                                        key={level}
                                                        value={level}
                                                    >
                                                        {level}
                                                    </option>
                                                ),
                                            )}
                                        </NativeSelect>
                                        <InputError
                                            message={errors.experience_level}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="status">
                                            {t('admin.jobs.fields.status')}
                                        </Label>
                                        <NativeSelect
                                            id="status"
                                            name="status"
                                            defaultValue={job.status}
                                            className="h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm"
                                        >
                                            {options.statuses.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </NativeSelect>
                                        <InputError message={errors.status} />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="salary_range">
                                            {t('admin.jobs.fields.salary')}
                                        </Label>
                                        <Input
                                            id="salary_range"
                                            name="salary_range"
                                            defaultValue={
                                                job.salary_range ?? ''
                                            }
                                            className="rounded-xl"
                                        />
                                        <InputError
                                            message={errors.salary_range}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="expires_at">
                                            {t('admin.jobs.fields.expires')}
                                        </Label>
                                        <Input
                                            id="expires_at"
                                            name="expires_at"
                                            type="date"
                                            defaultValue={
                                                job.expires_at ?? ''
                                            }
                                            className="rounded-xl"
                                        />
                                        <InputError
                                            message={errors.expires_at}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="description">
                                        {t('common.description')}
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={job.description ?? ''}
                                        className="min-h-32 rounded-xl"
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="requirements">
                                        {t('admin.jobs.fields.requirements')}
                                    </Label>
                                    <Textarea
                                        id="requirements"
                                        name="requirements"
                                        defaultValue={job.requirements ?? ''}
                                        className="min-h-24 rounded-xl"
                                    />
                                    <InputError
                                        message={errors.requirements}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="skills">
                                        {t('admin.jobs.fields.skills')}
                                    </Label>
                                    <Input
                                        id="skills"
                                        name="skills"
                                        defaultValue={job.skills.join(', ')}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.skills} />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <AdminPrimaryButton
                                        type="submit"
                                        disabled={processing}
                                    >
                                        {t('common.save')}
                                    </AdminPrimaryButton>
                                    <Link href={show.url(job.id)}>
                                        <AdminSecondaryButton type="button">
                                            {t('common.cancel')}
                                        </AdminSecondaryButton>
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </AdminPanel>
            </div>
        </AdminPortalLayout>
    );
}
