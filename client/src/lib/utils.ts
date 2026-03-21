import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Darkens a 6-digit hex color by a given factor (0-1).
 * Used to ensure text remains readable when rendered over tinted highlights.
 */
export function darkenHex(hex: string, factor = 0.65): string {
  // Extract RGB channels
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Apply factor and convert back to hex
  const fmt = (n: number) =>
    Math.round(n * factor).toString(16).padStart(2, '0');

  return `#${fmt(r)}${fmt(g)}${fmt(b)}`;
}