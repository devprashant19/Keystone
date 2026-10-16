import { useState, useEffect } from 'react';

/**
 * Hook to read and control reduced motion preference.
 * Respects OS prefers-reduced-motion media query and localStorage override.
 * Fully safe against storage errors in restricted contexts.
 */
export function useReducedMotion(): [boolean, (value: boolean) => void] {
  const [reduced, setReduced] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('jaal_reduced_motion');
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // Storage access blocked or unavailable
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem('jaal_reduced_motion');
        if (stored === null) {
          setReduced(e.matches);
        }
      } catch {
        setReduced(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setPreference = (value: boolean) => {
    setReduced(value);
    try {
      localStorage.setItem('jaal_reduced_motion', String(value));
    } catch {
      // Ignore storage write error
    }
    if (typeof document !== 'undefined') {
      if (value) {
        document.documentElement.setAttribute('data-reduced-motion', 'true');
      } else {
        document.documentElement.removeAttribute('data-reduced-motion');
      }
    }
  };

  return [reduced, setPreference];
}
