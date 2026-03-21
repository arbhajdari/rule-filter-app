import { z } from 'zod';

// ─── Reusable Primitives ──────────────────────────────────────────────────────

const MatchTypeSchema = z.enum(['contains', 'startsWith', 'exact']);

const KeywordSchema = z
  .string()
  .trim()
  .min(1, 'Keyword is required')
  .max(100, 'Keyword is too long');

/**
 * Validates a 6-digit hex color. We enforce this canonical format (#RRGGBB)
 * to ensure consistency between the database and frontend color comparisons.
 */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const ColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, 'Must be a valid 6-digit hex color (e.g. #FF5733)');

// ─── Create Rule (Discriminated Union) ───────────────────────────────────────
/**
 * We use a discriminated union on 'actionType' to ensure the payload matches 
 * the action. This prevents "junk" data (like a label on a highlight rule) 
 * from reaching the database and provides cleaner error messages for the client.
 */
export const CreateRuleSchema = z.discriminatedUnion('actionType', [
  // Highlight: Requires a valid hex color
  z.object({
    keyword:    KeywordSchema,
    matchType:  MatchTypeSchema,
    actionType: z.literal('highlight'),
    color:      ColorSchema,
    priority:   z.number().int().min(0).default(0),
  }),

  // Tooltip: Requires a label string
  z.object({
    keyword:    KeywordSchema,
    matchType:  MatchTypeSchema,
    actionType: z.literal('tooltip'),
    label:      z.string().trim().min(1, 'Label is required').max(50),
    priority:   z.number().int().min(0).default(0),
  }),
]);

export type CreateRuleInput = z.infer<typeof CreateRuleSchema>;

// ─── Update Rule (PATCH Semantics) ───────────────────────────────────────────
/**
 * Supports partial updates. Note: actionType is intentionally omitted here 
 * because changing a rule's fundamental action type is a destructive operation 
 * that we handle via delete/re-create to maintain data integrity.
 */
export const UpdateRuleSchema = z.object({
  keyword:   KeywordSchema.optional(),
  matchType: MatchTypeSchema.optional(),
  isEnabled: z.boolean().optional(),
  priority:  z.number().int().min(0).optional(),
  color:     ColorSchema.optional(),
  label:     z.string().trim().min(1).max(50).optional(),
});

export type UpdateRuleInput = z.infer<typeof UpdateRuleSchema>;

// ─── Process Text ─────────────────────────────────────────────────────────────

export const ProcessTextSchema = z.object({
  text: z
    .string()
    .min(1, 'Text cannot be empty')
    .max(10_000, 'Text exceeds maximum length'),
});

export type ProcessTextInput = z.infer<typeof ProcessTextSchema>;