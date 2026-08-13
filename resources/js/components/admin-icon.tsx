import { cn } from '@/lib/utils';

export function AdminIcon({
    src,
    size,
    className,
    tint = false,
}: {
    src: string;
    size: number;
    className?: string;
    tint?: boolean;
}) {
    if (tint) {
        return (
            <span
                aria-hidden
                className={cn('inline-block shrink-0 bg-current', className)}
                style={{
                    width: size,
                    height: size,
                    maskImage: `url(${src})`,
                    WebkitMaskImage: `url(${src})`,
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    maskSize: `${size}px ${size}px`,
                }}
            />
        );
    }

    return (
        <img
            src={src}
            alt=""
            width={size}
            height={size}
            className={cn('shrink-0 object-contain', className)}
        />
    );
}
