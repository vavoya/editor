import { useEffect, useRef } from 'react';

const useResizeObserver = (callback: () => void) => {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                callback();
            }
        });

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [callback]);

    return elementRef;
};

export default useResizeObserver;
