import { Link, router, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { type SharedData } from '@/types';

interface UserHeaderProps {
    showProfileMenu?: boolean;
}

export function UserHeader({ showProfileMenu = true }: UserHeaderProps) {
    const { auth } = usePage<SharedData>().props;

    const handleLogout = (): void => {
        router.post(route('logout'));
    };

    return (
        <header className='bg-primary-50 shadow z-50 '>
            <div className='container mx-auto flex items-center justify-between py-4 px-4 text-primary-500'>
                <Link href="#" className="flex items-center gap-3">
                    <svg className="h-12 w-12" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="25" r="12" stroke="currentColor" strokeWidth="3" fill="none" />
                        <path d="M15 40 Q50 20, 85 40" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                    <div>
                        <div className="font-sans text-xl font-bold tracking-wider">HORIZON WILLS</div>
                        <div className="text-xs text-primary-300 tracking-[0.3em]">PROTECTING YOUR ASSETS</div>
                    </div>
                </Link>

                {showProfileMenu ? (
                    <>
                        <div className='hidden md:flex items-center gap-4'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 hover:bg-transparent hover:scale-105 transition-transform focus-visible:ring-0 focus-visible:ring-offset-0">
                                        <UserInfo user={auth.user} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 p-2 shadow-sm border-none" align="end" sideOffset={8}>
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className='md:hidden'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-md ring-offset-background transition-all hover:ring-2 hover:ring-ring">
                                        <Menu className="size-6" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 p-2 shadow-sm border-none" align="end" sideOffset={8}>
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </>
                ) : (
                    <Button variant="ghost" className="text-primary-500 hover:text-primary-600" onClick={handleLogout}>
                        Log out
                    </Button>
                )}
            </div>
        </header>
    );
}
