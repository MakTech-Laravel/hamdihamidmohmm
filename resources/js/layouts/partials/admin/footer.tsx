import { Heart } from 'lucide-react';

import { useLocale } from '@/hooks/use-locale';

export function AdminFooter() {
    const { t } = useLocale();

    return (
        <footer className="border-t bg-background/80 backdrop-blur-sm py-4">
            <div className="container mx-auto flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <span>&copy; {new Date().getFullYear()}</span>
                <span className="mx-1">•</span>
                <span className="flex items-center gap-1">
                    {t('footer.made_with')}{' '}
                    <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500 animate-pulse" />{' '}
                    {t('footer.made_with_by')}{' '}
                    <a
                        href="https://maktechsolution.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary hover:underline"
                    >
                        MackTech Solution
                    </a>
                </span>
            </div>
        </footer>
    );
}
