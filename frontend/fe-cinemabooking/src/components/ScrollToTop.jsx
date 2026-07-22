import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
    const { pathname } = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    // 1. Scroll to top automatically when the route (pathname) changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // 2. Monitor scroll height to show/hide the floating scroll-to-top button
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-primary-600/90 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-primary-500 active:scale-95 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
            }`}
            aria-label="Scroll to top"
        >
            <ArrowUp className="h-6 w-6 stroke-[2.5]" />
        </button>
    );
}
