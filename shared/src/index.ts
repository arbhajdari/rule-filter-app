// ─── Shared Type Definitions ─────────────────────────────────────────────────

/**
 * Using string literal unions instead of TypeScript enums for 
 * seamless JSON serialization and better compatibility with Prisma.
 */
export type MatchType = 'contains' | 'startsWith' | 'exact';
export type ActionType = 'highlight' | 'tooltip';

// ─── Database & API Entities ─────────────────────────────────────────────────

/**
 * Mirrors the 'Rule' model. Note: Dates are represented as strings 
 * to align with ISO-8601 JSON serialization.
 */
export interface Rule {
  id: number;
  keyword: string;
  matchType: MatchType;
  actionType: ActionType;
  color: string | null; // Used when actionType === 'highlight'
  label: string | null; // Used when actionType === 'tooltip'
  isEnabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// ─── API Request Payloads ────────────────────────────────────────────────────

/**
 * Discriminated union for creating rules. Ensures that a 'highlight' 
 * action always includes a color, and a 'tooltip' always includes a label.
 */
export type CreateRuleBody =
  | {
      keyword: string;
      matchType: MatchType;
      actionType: 'highlight';
      color: string;
      priority?: number;
    }
  | {
      keyword: string;
      matchType: MatchType;
      actionType: 'tooltip';
      label: string;
      priority?: number;
    };

/**
 * Supports PATCH semantics. actionType is intentionally excluded to 
 * maintain data integrity between color/label requirements.
 */
export interface UpdateRuleBody {
  keyword?:   string;
  matchType?: MatchType;
  isEnabled?: boolean;
  priority?:  number;
  color?:     string;
  label?:     string;
}

// ─── Text Processing Engine Types ────────────────────────────────────────────

export interface ProcessTextBody {
  text: string;
}

export type RuleMatch =
  | { ruleId: number; keyword: string; actionType: 'highlight'; color: string }
  | { ruleId: number; keyword: string; actionType: 'tooltip'; label: string };

/**
 * Represents a slice of the processed text. 
 * 'matches' will contain all rules applicable to this specific segment.
 */
export interface TextSegment {
  text: string;
  matches: RuleMatch[];
}

export interface ProcessTextResponse {
  segments: TextSegment[];
}