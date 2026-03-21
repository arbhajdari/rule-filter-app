import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a reactive value. 
 * Useful for preventing API spam during rapid user input.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // Update the debounced value only after the specified delay
    const id = setTimeout(() => setDebounced(value), delay);

    // Cleanup: cancels the timer if the value changes before the delay finishes
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}