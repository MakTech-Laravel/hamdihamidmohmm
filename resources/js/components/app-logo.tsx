import BrandLogo from '@/components/brand-logo';
import { cn } from '@/lib/utils';

interface AppLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
}

export default function AppLogo({ className, ...props }: AppLogoProps) {
    return (
        <BrandLogo
            className={cn('w-auto max-w-[420px]', className)}
            {...props}
        />
    );
}
