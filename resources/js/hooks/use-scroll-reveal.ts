import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
    const sectionRef = useRef<T | null>(null);

    useEffect(() => {
        const root = sectionRef.current;
        if (!root || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const animatedNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-animate]'));
        if (!animatedNodes.length) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const element = entry.target as HTMLElement & { dataset: DOMStringMap };
                    const delay = element.dataset.animateDelay || '0s';
                    element.style.transitionDelay = delay;
                    element.classList.add('animate-in');
                    observer.unobserve(element);
                });
            },
            {
                threshold: 0.2,
                rootMargin: '0px 0px -10% 0px',
            },
        );

        animatedNodes.forEach((node) => observer.observe(node));

        return () => {
            observer.disconnect();
        };
    }, []);

    return sectionRef;
}
