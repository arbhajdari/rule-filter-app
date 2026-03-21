import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { processApi, ApiError } from '../api/apiClient';
import { cn, darkenHex } from '../lib/utils';
import type { TextSegment, RuleMatch } from '@rule-filter/shared';

export function TextProcessor() {
  const [text, setText] = useState('');
  const [segments, setSegments] = useState<TextSegment[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 300ms debounce prevents flooding the API on every keystroke.
  const debouncedText = useDebounce(text, 300);

  useEffect(() => {
    if (!debouncedText.trim()) {
      setSegments(null);
      setError(null);
      return;
    }

    // "stale" flag handles the race condition where a previous slow 
    // request might arrive after a newer one.
    let stale = false; 

    async function run() {
      setIsProcessing(true);
      setError(null);
      try {
        const res = await processApi.process({ text: debouncedText });
        if (!stale) setSegments(res.segments);
      } catch (err) {
        if (!stale)
          setError(err instanceof ApiError ? err.message : 'Processing failed.');
      } finally {
        if (!stale) setIsProcessing(false);
      }
    }

    run();

    // Cleanup ensures that if the effect re-runs, the previous result is ignored.
    return () => {
      stale = true;
    };
  }, [debouncedText]);

  const matchCount = segments
    ? segments.filter((s) => s.matches.length > 0).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text here. Rules apply automatically..."
          rows={7}
          maxLength={10_000}
          className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
          <span className="text-xs text-slate-400">
            {text.length.toLocaleString()} / 10,000
          </span>
          <div className="flex items-center gap-3">
            {isProcessing && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-500">
                <SpinIcon className="h-3 w-3" />
                Analysing...
              </span>
            )}
            {text && (
              <button
                type="button"
                onClick={() => { setText(''); setSegments(null); setError(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {segments && text.trim() && (
        <ProcessedOutput segments={segments} matchCount={matchCount} />
      )}
    </div>
  );
}

// --- Output Display Components ---

interface ProcessedOutputProps {
  segments:   TextSegment[];
  matchCount: number;
}

function ProcessedOutput({ segments, matchCount }: ProcessedOutputProps) {
  const highlightCount = segments.filter((s) =>
    s.matches.some((m) => m.actionType === 'highlight'),
  ).length;
  const tooltipCount = segments.filter((s) =>
    s.matches.some((m) => m.actionType === 'tooltip'),
  ).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-xs font-medium text-slate-600">Processed Output</span>
        <div className="flex items-center gap-3">
          {matchCount === 0 ? (
            <span className="text-xs text-slate-400">No matches found</span>
          ) : (
            <>
              {highlightCount > 0 && (
                <Stat color="bg-indigo-400" label={`${highlightCount} highlight${highlightCount !== 1 ? 's' : ''}`} />
              )}
              {tooltipCount > 0 && (
                <Stat color="bg-slate-400" label={`${tooltipCount} tooltip${tooltipCount !== 1 ? 's' : ''}`} />
              )}
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-4 text-sm leading-8 text-slate-700">
        {segments.map((seg, i) => (
          <SegmentSpan key={i} segment={seg} />
        ))}
      </div>
    </div>
  );
}

function Stat({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {label}
    </span>
  );
}

/**
 * Handles the logic for rendering stacked treatments (Highlight + Tooltip).
 */
function SegmentSpan({ segment }: { segment: TextSegment }) {
  if (segment.matches.length === 0) {
    return <>{segment.text}</>;
  }

  const highlightMatch = segment.matches.find(
    (m): m is Extract<RuleMatch, { actionType: 'highlight' }> =>
      m.actionType === 'highlight',
  );
  const tooltipMatch = segment.matches.find(
    (m): m is Extract<RuleMatch, { actionType: 'tooltip' }> =>
      m.actionType === 'tooltip',
  );

  // 16% opacity (28 hex) ensures the highlight is a subtle tint.
  const highlightedSpan = highlightMatch ? (
    <mark
      className="rounded-[3px] px-0.5 font-medium not-italic"
      style={{
        backgroundColor: `${highlightMatch.color}28`,
        color: darkenHex(highlightMatch.color),
      }}
    >
      {segment.text}
    </mark>
  ) : (
    <span>{segment.text}</span>
  );

  if (tooltipMatch) {
    return (
      <span className="group/tip relative inline-block">
        <span className="cursor-help underline decoration-dotted underline-offset-4 decoration-slate-400">
          {highlightedSpan}
        </span>

        {/* Floating Tooltip Bubble */}
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2',
            'whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white shadow-lg',
            'invisible opacity-0 transition-opacity duration-150',
            'group-hover/tip:visible group-hover/tip:opacity-100',
          )}
        >
          {tooltipMatch.label}
          {/* CSS triangle arrow */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"
          />
        </span>
      </span>
    );
  }

  return highlightedSpan;
}

function SpinIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}