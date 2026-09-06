import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    AdminPageHeader,
    AdminPanel,
    AdminPrimaryButton,
    AdminStatusBadge,
    AdminTableShell,
} from '@/components/admin-portal/ui';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import AdminPortalLayout from '@/layouts/admin-portal-layout';
import type { SharedData } from '@/types';

type PageRow = {
    id: number;
    title: string;
    slug: string;
    type: string;
    type_value: string;
    status: string;
    status_value: string;
    body: string | null;
    updated_at: string | null;
};

const emptyForm = {
    title: '',
    slug: '',
    type: 'page',
    body: '',
    status: 'draft',
};

export default function ContentManagement({ pages }: { pages: PageRow[] }) {
    const { flash } = usePage<SharedData>().props;
    const { t } = useLocale();
    const [editing, setEditing] = useState<PageRow | null>(null);
    const [creating, setCreating] = useState(false);
    const form = useForm(emptyForm);

    return (
        <AdminPortalLayout>
            <Head title={t('admin.content.title')} />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title={t('admin.content.title')}
                    subtitle={t('admin.content.subtitle')}
                    actions={
                        <AdminPrimaryButton
                            onClick={() => {
                                form.setData(emptyForm);
                                setCreating(true);
                            }}
                        >
                            <Plus className="size-4" />
                            {t('admin.content.new')}
                        </AdminPrimaryButton>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : t('common.saved')}
                    </div>
                )}

                <AdminPanel>
                    <AdminTableShell
                        headers={[
                            t('admin.content.cols.title'),
                            t('admin.content.cols.type'),
                            t('admin.content.cols.status'),
                            t('admin.content.cols.updated'),
                            t('common.actions'),
                        ]}
                    >
                        {pages.map((page) => (
                            <tr
                                key={page.id}
                                className="border-b border-[#e2e8f0] last:border-0"
                            >
                                <td className="px-3 py-3 font-semibold">
                                    {page.title}
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {page.type}
                                </td>
                                <td className="px-3 py-3">
                                    <AdminStatusBadge
                                        label={page.status}
                                        tone={
                                            page.status_value === 'published'
                                                ? 'success'
                                                : 'neutral'
                                        }
                                    />
                                </td>
                                <td className="px-3 py-3 text-[#64748b]">
                                    {page.updated_at}
                                </td>
                                <td className="px-3 py-3">
                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border"
                                            onClick={() => {
                                                form.setData({
                                                    title: page.title,
                                                    slug: page.slug,
                                                    type: page.type_value,
                                                    body: page.body ?? '',
                                                    status: page.status_value,
                                                });
                                                setEditing(page);
                                            }}
                                        >
                                            <Pencil className="size-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-lg border px-2 py-1 text-xs"
                                            onClick={() =>
                                                router.post(
                                                    `/admin/content/${page.id}/publish`,
                                                )
                                            }
                                        >
                                            {page.status_value === 'published'
                                                ? t('common.unpublish')
                                                : t('common.publish')}
                                        </button>
                                        <button
                                            type="button"
                                            className="flex size-8 items-center justify-center rounded-lg border border-[#fee2e2] text-[#991b1b]"
                                            onClick={() =>
                                                router.delete(
                                                    `/admin/content/${page.id}`,
                                                )
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </AdminTableShell>
                    {pages.length === 0 && (
                        <p className="mt-6 text-center text-sm text-[#99a1af]">
                            {t('admin.content.empty')}
                        </p>
                    )}
                </AdminPanel>
            </div>

            <Dialog
                open={creating || editing !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCreating(false);
                        setEditing(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? t('admin.content.edit_title')
                                : t('admin.content.create_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (editing) {
                                form.put(`/admin/content/${editing.id}`, {
                                    onSuccess: () => setEditing(null),
                                });

                                return;
                            }

                            form.post('/admin/content', {
                                onSuccess: () => setCreating(false),
                            });
                        }}
                    >
                        <div>
                            <Label>{t('admin.content.form.title')}</Label>
                            <Input
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>{t('admin.content.form.type')}</Label>
                            <NativeSelect
                                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                                value={form.data.type}
                                onChange={(event) =>
                                    form.setData('type', event.target.value)
                                }
                            >
                                <option value="page">{t('admin.content.form.type_page')}</option>
                                <option value="announcement">
                                    {t('admin.content.form.type_announcement')}
                                </option>
                            </NativeSelect>
                        </div>
                        <div>
                            <Label>{t('admin.content.form.status')}</Label>
                            <NativeSelect
                                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData('status', event.target.value)
                                }
                            >
                                <option value="draft">{t('common.draft')}</option>
                                <option value="published">{t('common.published')}</option>
                            </NativeSelect>
                        </div>
                        <div>
                            <Label>{t('admin.content.form.body')}</Label>
                            <Textarea
                                value={form.data.body}
                                onChange={(event) =>
                                    form.setData('body', event.target.value)
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
