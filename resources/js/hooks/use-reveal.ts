import { MutableRefObject, useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement = HTMLElement>(threshold = 0.15): [MutableRefObject<T | null>, boolean] {
    const ref = useRef<T | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold]);

    return [ref, visible];
}
