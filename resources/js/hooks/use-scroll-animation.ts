import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
}

export function useScrollAnimation<T extends HTMLElement = HTMLElement>({ threshold = 0.2, rootMargin = '0px' }: ScrollAnimationOptions = {}) {
    const ref = useRef<T | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
            return;
        }

        if (isVisible) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                });
            },
            { threshold, rootMargin },
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [isVisible, rootMargin, threshold]);

    return [ref, isVisible] as const;
}
