import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

interface AppLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
}

export default function AppLogo({ className, ...props }: AppLogoProps) {
    const { t } = useLocale();

    return (
        <img
            src="/logo.png"
            alt={t('app.logo_alt')}
            className={cn('w-auto max-w-[420px] object-contain', className)}
            {...props}
        />
    );
}
