import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';


export function AdminHeader() {
    const { auth } = usePage<SharedData>().props;
    const admin = auth.admin;
    const getInitials = useInitials();

    if (!admin) {
        return null;
    }

    const handleLogout = () => {
        router.post(route('admin.logout'));
    };

    const adminInfo = (
        <>
            <Avatar className="h-10 w-10 overflow-hidden rounded-full">
                <AvatarFallback className="rounded-lg bg-primary text-white text-lg font-semibold font-montserrat">
                    {getInitials(admin.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-base font-semibold text-text-secondary font-montserrat">
                    {admin.name}
                </span>
                <span className="truncate text-base text-text-primary">
                    {admin.email}
                </span>
            </div>
        </>
    );

    const adminMenu = (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    {adminInfo}
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
            </DropdownMenuItem>
        </>
    );

    return (
        <header className='bg-primary-50'>
            <div className='container mx-auto flex items-center justify-between py-4 px-4 text-primary-500'>
                <Link href={route('admin.dashboard')} className='flex text-primary-500 items-center gap-2'>
                    <AppLogo className="h-16 w-auto" />
                </Link>
                <div className='hidden md:flex items-center gap-4'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 hover:bg-transparent hover:scale-105 transition-transform focus-visible:ring-0 focus-visible:ring-offset-0">
                                {adminInfo}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 p-2 shadow-sm border-none" align="end" sideOffset={8}>
                            {adminMenu}
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
                            {adminMenu}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
