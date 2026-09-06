import { useLocale } from '@/hooks/use-locale';

export function UserFooter() {
    const currentYear = new Date().getFullYear();
    const { t } = useLocale();

    return (
        <footer className="border-t border-border/40 bg-muted/70 py-6 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                    <div className="text-center text-sm text-muted-foreground md:text-left">
                        {t('footer.mts_copyright', { year: currentYear })}
                    </div>
                </div>
            </div>
        </footer>
    );
}
