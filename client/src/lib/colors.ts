// Shared source of truth for the rule color palette.
export interface PresetColor {
  name: string;
  hex:  string;
}

export const PRESET_COLORS: PresetColor[] = [
  { name: 'Indigo',  hex: '#6366f1' },
  { name: 'Rose',    hex: '#f43f5e' },
  { name: 'Amber',   hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sky',     hex: '#0ea5e9' },
  { name: 'Violet',  hex: '#8b5cf6' },
];

/**
 * Maps a hex code back to its preset name for UI display.
 * Returns the hex code if no match is found (custom color).
 */
export function getColorLabel(hex: string | null): string {
  if (!hex) return '—';
  const preset = PRESET_COLORS.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase(),
  );
  return preset ? preset.name : hex.toUpperCase();
}

/**
 * Checks if a hex value is outside the standard preset list.
 * Used to toggle the "Custom" color picker state in RuleForm.
 */
export function isCustomColor(hex: string): boolean {
  return !PRESET_COLORS.some(
    (c) => c.hex.toLowerCase() === hex.toLowerCase(),
  );
}