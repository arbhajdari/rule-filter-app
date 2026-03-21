import type { Rule } from '@prisma/client';
import type { TextSegment, RuleMatch } from '@rule-filter/shared';

// --- Regex Safety ---

/**
 * Escapes regex metacharacters so keywords (like "C++" or "3.14") 
 * are treated as literal strings rather than regex commands.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Internal Types ---

interface RawMatch {
  start: number; // inclusive
  end:   number; // exclusive
  rule:  Rule;
}

// --- Pattern Matching ---

/**
 * Scans the input text using the active rule set. 
 * Returns a flat list of all character spans where a rule triggered.
 */
function findRawMatches(text: string, rules: Rule[]): RawMatch[] {
  const results: RawMatch[] = [];

  for (const rule of rules) {
    if (!rule.isEnabled) continue;

    const escaped = escapeRegex(rule.keyword);
    let pattern: RegExp;

    switch (rule.matchType) {
      case 'contains':
        // Substring match anywhere in the text
        pattern = new RegExp(escaped, 'gi');
        break;

      case 'startsWith':
        // Matches whole words beginning with the keyword
        pattern = new RegExp(`\\b${escaped}\\w*`, 'gi');
        break;

      case 'exact':
        // Matches the keyword only as a standalone word
        pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
        break;

      default:
        continue;
    }

    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      results.push({ start: m.index, end: m.index + m.length, rule });

      // Prevents infinite loops if a regex theoretically matches a zero-length string
      if (m.length === 0) pattern.lastIndex++;
    }
  }

  return results;
}

// --- Interval Painting (The Core Algorithm) ---

/**
 * Converts overlapping match spans into a gapless array of TextSegments.
 * * We use an 'interval painting' approach:
 * 1. Gather all start/end boundaries into a sorted unique list.
 * 2. Slice the text between every consecutive boundary pair.
 * 3. Assign every rule that covers that specific slice to the segment.
 */
function buildSegments(text: string, rawMatches: RawMatch[]): TextSegment[] {
  // 1. Identify all transition points in the text
  const boundarySet = new Set<number>([0, text.length]);
  for (const m of rawMatches) {
    boundarySet.add(m.start);
    boundarySet.add(m.end);
  }
  const boundaries = Array.from(boundarySet).sort((a, b) => a - b);

  const segments: TextSegment[] = [];

  // 2. Map intervals to their corresponding rules
  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i];
    const segEnd   = boundaries[i + 1];

    // Check which raw matches fully cover this specific slice
    const covering = rawMatches
      .filter((m) => m.start <= segStart && m.end >= segEnd)
      // Sort by priority so the frontend knows which style should take precedence
      .sort((a, b) => b.rule.priority - a.rule.priority);

    const matches: RuleMatch[] = covering.map((m): RuleMatch => {
      if (m.rule.actionType === 'highlight') {
        return {
          ruleId:     m.rule.id,
          keyword:    m.rule.keyword,
          actionType: 'highlight',
          color:      m.rule.color!, 
        };
      } else {
        return {
          ruleId:     m.rule.id,
          keyword:    m.rule.keyword,
          actionType: 'tooltip',
          label:      m.rule.label!, 
        };
      }
    });

    segments.push({ text: text.slice(segStart, segEnd), matches });
  }

  return segments;
}

// --- Public API ---

/**
 * Main entry point for text processing.
 */
export function processText(text: string, rules: Rule[]): TextSegment[] {
  const rawMatches = findRawMatches(text, rules);
  return buildSegments(text, rawMatches);
}