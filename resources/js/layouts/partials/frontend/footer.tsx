import AppLogo from '@/components/app-logo';
import { Link } from '@inertiajs/react';

export function FrontendFooter() {
    return (
        <footer className="border-t bg-primary-600 text-white">
            <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
                <Link href="#" className="flex items-center gap-2">
                    <AppLogo className="h-10 w-auto" />
                    <span className="text-sm font-semibold tracking-wide uppercase">
                        Horizon Wills
                    </span>
                </Link>

                <nav className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
                    <Link href="#" className="text-white/80 hover:text-white">
                        Home
                    </Link>
                    <Link href="#" className="text-white/80 hover:text-white">
                        About
                    </Link>
                    <Link href="#" className="text-white/80 hover:text-white">
                        Contact
                    </Link>
                </nav>

                <p className="text-[11px] text-white/70 text-center sm:text-right">
                    &copy; 2026 Horizon Wills Ltd. All rights reserved.
                </p>
            </div>
        </footer>
    );
}