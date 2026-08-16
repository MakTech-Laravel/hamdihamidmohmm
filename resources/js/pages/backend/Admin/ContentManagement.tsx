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
import { Textarea } from '@/components/ui/textarea';
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
    const [editing, setEditing] = useState<PageRow | null>(null);
    const [creating, setCreating] = useState(false);
    const form = useForm(emptyForm);

    return (
        <AdminPortalLayout>
            <Head title="Content Management" />

            <div className="space-y-6 p-6">
                <AdminPageHeader
                    title="Content Management"
                    subtitle="Create and publish pages and announcements."
                    actions={
                        <AdminPrimaryButton
                            onClick={() => {
                                form.setData(emptyForm);
                                setCreating(true);
                            }}
                        >
                            <Plus className="size-4" />
                            New content
                        </AdminPrimaryButton>
                    }
                />

                {flash.success && (
                    <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
                        {typeof flash.success === 'string'
                            ? flash.success
                            : 'Saved successfully.'}
                    </div>
                )}

                <AdminPanel>
                    <AdminTableShell
                        headers={[
                            'Title',
                            'Type',
                            'Status',
                            'Updated',
                            'Actions',
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
                                                ? 'Unpublish'
                                                : 'Publish'}
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
                            No content pages yet.
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
                            {editing ? 'Edit content' : 'Create content'}
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
                            <Label>Title</Label>
                            <Input
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label>Type</Label>
                            <select
                                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                                value={form.data.type}
                                onChange={(event) =>
                                    form.setData('type', event.target.value)
                                }
                            >
                                <option value="page">Page</option>
                                <option value="announcement">
                                    Announcement
                                </option>
                            </select>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <select
                                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                                value={form.data.status}
                                onChange={(event) =>
                                    form.setData('status', event.target.value)
                                }
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                        <div>
                            <Label>Body</Label>
                            <Textarea
                                value={form.data.body}
                                onChange={(event) =>
                                    form.setData('body', event.target.value)
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={form.processing}>
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminPortalLayout>
    );
}
