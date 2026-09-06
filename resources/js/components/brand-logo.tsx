import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

/** Canonical brand mark used on public site and all portals. */
export const BRAND_LOGO_SRC = '/images/home/logo.png';

type BrandLogoProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    className?: string;
};

export default function BrandLogo({ className, alt, ...props }: BrandLogoProps) {
    const { t } = useLocale();

    return (
        <img
            src={BRAND_LOGO_SRC}
            alt={alt ?? t('app.logo_alt')}
            className={cn('object-contain', className)}
            {...props}
        />
    );
}
