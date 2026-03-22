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
      // m[0] is the matched string; m.length would be the capture-group count
      results.push({ start: m.index, end: m.index + m[0].length, rule });

      // Prevents infinite loops on zero-length matches (e.g. empty keyword edge case)
      if (m[0].length === 0) pattern.lastIndex++;
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
      // Primary sort: higher priority wins. Tie-break: longer keyword is more specific.
      .sort((a, b) => {
        const byPriority = b.rule.priority - a.rule.priority;
        if (byPriority !== 0) return byPriority;
        return b.rule.keyword.length - a.rule.keyword.length;
      });

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

  // 3. Merge adjacent segments that carry identical rule coverage.
  //    This collapses painting artefacts like ['i','mmed','i','ately'] → ['immediately']
  //    when every sub-slice was covered by the exact same set of rules.
  const merged: TextSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && sameMatches(prev.matches, seg.matches)) {
      prev.text += seg.text;
    } else {
      merged.push({ text: seg.text, matches: seg.matches });
    }
  }

  return merged;
}

/**
 * Returns true when two RuleMatch arrays represent the exact same coverage:
 * same length, same ruleIds in the same order.
 */
function sameMatches(a: RuleMatch[], b: RuleMatch[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].ruleId !== b[i].ruleId) return false;
  }
  return true;
}

// --- Public API ---

/**
 * Main entry point for text processing.
 */
export function processText(text: string, rules: Rule[]): TextSegment[] {
  const rawMatches = findRawMatches(text, rules);
  return buildSegments(text, rawMatches);
}