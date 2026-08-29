import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export type PermissionOption = {
    name: string;
    label: string;
    description: string;
    required_for_admin: boolean;
};

export type PermissionGroup = {
    name: string;
    permissions: PermissionOption[];
};

type Props = {
    groups: PermissionGroup[];
    selected: string[];
    disabled?: boolean;
    lockRequired?: boolean;
    search?: string;
    onToggle: (permission: PermissionOption) => void;
    onGroupToggle?: (group: PermissionGroup, enabled: boolean) => void;
};

export function RolePermissionPicker({
    groups,
    selected,
    disabled = false,
    lockRequired = false,
    search = '',
    onToggle,
    onGroupToggle,
}: Props) {
    const { t } = useLocale();
    const query = search.trim().toLowerCase();
    const filteredGroups = groups
        .map((group) => ({
            ...group,
            permissions: group.permissions.filter(
                (permission) =>
                    query === '' ||
                    permission.label.toLowerCase().includes(query) ||
                    permission.description.toLowerCase().includes(query),
            ),
        }))
        .filter((group) => group.permissions.length > 0);

    return (
        <div className="space-y-5">
            {filteredGroups.map((group) => {
                const enabledCount = group.permissions.filter((permission) =>
                    selected.includes(permission.name),
                ).length;

                return (
                    <div key={group.name} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-[#101828]">
                                    {group.name}
                                </h3>
                                <p className="text-[11px] text-[#99a1af]">
                                    {t('admin.roles.enabled', {
                                        count: enabledCount,
                                        total: group.permissions.length,
                                    })}
                                </p>
                            </div>
                            {!disabled && onGroupToggle && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-[#0057c8]"
                                        onClick={() =>
                                            onGroupToggle(group, true)
                                        }
                                    >
                                        {t('common.all')}
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-[#64748b]"
                                        onClick={() =>
                                            onGroupToggle(group, false)
                                        }
                                    >
                                        {t('common.none')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {group.permissions.map((permission) => {
                                const checked = selected.includes(
                                    permission.name,
                                );
                                const locked =
                                    disabled ||
                                    (lockRequired &&
                                        permission.required_for_admin);

                                return (
                                    <button
                                        key={permission.name}
                                        type="button"
                                        disabled={locked}
                                        onClick={() => onToggle(permission)}
                                        className={cn(
                                            'flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                                            checked
                                                ? 'border-[#bfdbfe] bg-[#f8faff]'
                                                : 'border-[#e2e8f0] bg-white',
                                            locked
                                                ? 'cursor-default'
                                                : 'hover:border-[#93c5fd]',
                                        )}
                                    >
                                        <span>
                                            <span className="block text-sm font-semibold text-[#101828]">
                                                {permission.label}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-[#64748b]">
                                                {permission.description}
                                            </span>
                                            {lockRequired &&
                                                permission.required_for_admin && (
                                                    <span className="mt-1 block text-[11px] font-medium text-[#0057c8]">
                                                        {t('admin.roles.required')}
                                                    </span>
                                                )}
                                        </span>
                                        <PermissionSwitch
                                            checked={checked}
                                            disabled={locked}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PermissionSwitch({
    checked,
    disabled,
}: {
    checked: boolean;
    disabled: boolean;
}) {
    return (
        <span
            aria-hidden
            className={cn(
                'relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
                checked ? 'bg-[#0057c8]' : 'bg-[#e2e8f0]',
                disabled && 'opacity-70',
            )}
        >
            <span
                className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all',
                    checked ? 'left-5.5' : 'left-0.5',
                )}
            />
        </span>
    );
}
