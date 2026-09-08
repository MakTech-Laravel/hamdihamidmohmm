import { Link, usePage } from '@inertiajs/react';
import { Users, User, BarChart, Shield, LayoutGrid, Settings } from 'lucide-react';
import * as React from 'react';

import AppLogo from '@/components/app-logo';
import { NavItem as NavItemComponent } from '@/components/ui/nav-item';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { dashboard, home } from '@/routes';
import { type NavItem, type SharedData } from '@/types';

interface AdminSidebarProps {
    isCollapsed: boolean;
    activeSlug?: string | null;
}

export const AdminSidebar = React.memo<AdminSidebarProps>(
    ({ isCollapsed, activeSlug }) => {
        const { url, props } = usePage();
        const { t } = useLocale();
        const currentRoute = url;

        const adminNavItems: NavItem[] = [
            {
                title: t('admin.legacy_nav.dashboard'),
                href: dashboard(),
                icon: LayoutGrid,
                slug: 'dashboard',
            },
            {
                title: t('admin.legacy_nav.user_management'),
                href: '#',
                icon: Users,
                badge: 42,
                children: [
                    {
                        title: t('admin.legacy_nav.admins'),
                        href: '#',
                        icon: Shield,
                        permission: 'manage admins',
                        children: [
                            {
                                title: t('admin.legacy_nav.all_admins'),
                                href: '#',
                            },
                            {
                                title: t('common.active'),
                                href: '#',
                            },
                            {
                                title: t('admin.legacy_nav.inactive'),
                                href: '#',
                                children: [
                                    {
                                        title: t(
                                            'admin.legacy_nav.recently_inactive',
                                        ),
                                        href: '#',
                                    },
                                    {
                                        title: t(
                                            'admin.legacy_nav.long_inactive',
                                        ),
                                        href: '#',
                                    },
                                    {
                                        title: t('admin.legacy_nav.archive'),
                                        href: '#',
                                        children: [
                                            {
                                                title: t(
                                                    'admin.legacy_nav.over_1_year',
                                                ),
                                                href: '#',
                                            },
                                            {
                                                title: t(
                                                    'admin.legacy_nav.over_2_years',
                                                ),
                                                href: '#',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        title: t('admin.legacy_nav.users'),
                        href: '#',
                        icon: User,
                        children: [
                            {
                                title: t('admin.legacy_nav.all'),
                                href: route('admin.users.index'),
                                icon: User,
                                slug: 'admin-users',
                            },
                            {
                                title: t('common.active'),
                                href: '#',
                            },
                            {
                                title: t('admin.legacy_nav.premium'),
                                href: '#',
                                badge: 15,
                            },
                        ],
                    },
                ],
            },
            {
                title: t('admin.legacy_nav.analytics'),
                href: '#',
                icon: BarChart,
                permission: 'view analytics',
            },
            {
                title: t('admin.legacy_nav.settings'),
                href: '#',
                icon: Settings,
                badge: 3,
            },
            {
                title: t('admin.legacy_nav.disabled'),
                href: '#',
                icon: Shield,
                disabled: true,
            },
        ];

        const userPermissions = React.useMemo(() => {
            const auth = props.auth as SharedData['auth'];
            return (
                auth?.user?.permissions ||
                auth?.user?.all_permissions ||
                auth?.permissions ||
                []
            );
        }, [props.auth]);

        return (
            <aside
                className={cn(
                    'relative hidden h-screen border-r bg-background',
                    'transition-all duration-300 ease-in-out',
                    'md:flex flex-col',
                    isCollapsed ? 'w-16' : 'w-64',
                )}
            >
                <div
                    className={cn(
                        'flex h-16 items-center border-b',
                        isCollapsed ? 'justify-center px-2' : 'px-6',
                    )}
                >
                    <Link
                        href={home()}
                        className="flex items-center gap-2 transition-opacity hover:opacity-80"
                        aria-label={t('nav.home')}
                    >
                        {isCollapsed ? (
                            <LayoutGrid className="h-6 w-6 text-primary" />
                        ) : (
                            <AppLogo />
                        )}
                    </Link>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
                    <nav className="space-y-1">
                        {adminNavItems.map((item, index) => (
                            <NavItemComponent
                                key={`${item.title}-${index}`}
                                item={item}
                                isCollapsed={isCollapsed}
                                currentRoute={currentRoute}
                                isActive={activeSlug === item.slug}
                                permissions={userPermissions}
                            />
                        ))}
                    </nav>
                </div>

                {!isCollapsed && (
                    <div className="border-t p-4">
                        <div className="text-center text-xs text-muted-foreground">
                            v1.0.0
                        </div>
                    </div>
                )}
            </aside>
        );
    },
);

AdminSidebar.displayName = 'AdminSidebar';
