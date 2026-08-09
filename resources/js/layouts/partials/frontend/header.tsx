import { Link } from '@inertiajs/react';

import AppLogo from '@/components/app-logo';

export function FrontendHeader() {
    return (
        <header className="border-b bg-white">
            <nav className="container mx-auto flex items-center justify-between px-4 py-3">
                <Link href="#" className="flex items-center gap-2">
                    <AppLogo className="h-10 w-auto" />
                    <span className="text-lg font-semibold text-gray-900">Horizon</span>
                </Link>

                <div className="hidden items-center gap-6 md:flex">
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Home
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        About
                    </Link>
                    <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Contact
                    </Link>
                </div>
            </nav>
        </header>
    );
}
