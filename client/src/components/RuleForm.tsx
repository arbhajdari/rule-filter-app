import { useState, useEffect, useRef } from 'react';
import { Button, Input, Select } from './ui';
import { rulesApi, ApiError } from '../api/apiClient';
import { cn } from '../lib/utils';
import { PRESET_COLORS, isCustomColor } from '../lib/colors';
import type { MatchType, ActionType, CreateRuleBody, Rule } from '@rule-filter/shared';

// ─── Static data ──────────────────────────────────────────────────────────────

const MATCH_TYPE_OPTIONS = [
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'exact', label: 'Exact Match' },
];

const ACTION_TYPE_OPTIONS = [
  { value: 'highlight', label: '🎨  Highlight' },
  { value: 'tooltip', label: '🏷️  Tooltip' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onSuccess: () => void;
  /** * Pre-populates fields and switches submit logic to PATCH. */
  editRule?: Rule | null;
  /** Cleanup for when the user backs out of an edit. */
  onCancelEdit?: () => void;
}

interface FormErrors {
  keyword?: string;
  label?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RuleForm({ onSuccess, editRule, onCancelEdit }: Props) {
  const isEditMode = !!editRule;

  // Needed to pull the user's focus to the form during an edit.
  const formRef = useRef<HTMLDivElement>(null);

  // ── Controlled field state ────────────────────────────────────────────────
  const [keyword, setKeyword] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('contains');
  const [actionType, setActionType] = useState<ActionType>('highlight');
  const [color, setColor] = useState(PRESET_COLORS[0].hex);
  const [label, setLabel] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Sync form fields when the rule being edited changes ───────────────────
  //
  // Populates the form when a rule is selected for editing, or resets it
  // back to defaults when clearing the selection. 
  //
  // Note: We use useEffect because it's the most reliable way to sync props 
  // to state without forcing a full component unmount.
  useEffect(() => {
    if (editRule) {
      setKeyword(editRule.keyword);
      setMatchType(editRule.matchType);
      setActionType(editRule.actionType);
      setColor(editRule.color ?? PRESET_COLORS[0].hex);
      setLabel(editRule.label ?? '');
      setErrors({});
      setApiError(null);

      // Smooth scroll so the user doesn't lose context of where the form is.
      setTimeout(
        () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        50,
      );
    } else {
      setKeyword('');
      setMatchType('contains');
      setActionType('highlight');
      setColor(PRESET_COLORS[0].hex);
      setLabel('');
      setErrors({});
      setApiError(null);
    }
  }, [editRule]);

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const next: FormErrors = {};
    if (!keyword.trim()) next.keyword = 'Keyword is required.';
    if (actionType === 'tooltip' && !label.trim()) next.label = 'Label is required for tooltip rules.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleCancel() {
    onCancelEdit?.();
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      if (isEditMode && editRule) {
        // ── PATCH: partial update ─────────────────────────────────────────
        // We lock the actionType during edits to avoid complex UI 
        // state transitions or data mismatch in the DB.
        await rulesApi.update(editRule.id, {
          keyword: keyword.trim(),
          matchType,
          // Using spread to conditionally include the relevant payload field.
          ...(actionType === 'highlight'
            ? { color }
            : { label: label.trim() }),
        });
        onCancelEdit?.();
      } else {
        // ── POST: create new rule ─────────────────────────────────────────
        const body: CreateRuleBody =
          actionType === 'highlight'
            ? { keyword: keyword.trim(), matchType, actionType: 'highlight', color }
            : { keyword: keyword.trim(), matchType, actionType: 'tooltip', label: label.trim() };

        await rulesApi.create(body);

        // Reset state after a successful addition.
        setKeyword('');
        setMatchType('contains');
        setActionType('highlight');
        setColor(PRESET_COLORS[0].hex);
        setLabel('');
        setErrors({});
      }

      onSuccess();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={formRef}
      className={cn(
        'rounded-xl border bg-white p-6 shadow-sm transition-all duration-200',
        // Visual cue to indicate the user is currently editing an existing rule.
        isEditMode ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200',
      )}
    >
      {/* ── Form header ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            {isEditMode ? 'Edit Rule' : 'Add New Rule'}
          </h2>
          {isEditMode && (
            <p className="mt-0.5 text-xs text-indigo-500">
              Editing "{editRule?.keyword}"
            </p>
          )}
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel edit"
            className="rounded p-0.5 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Keyword */}
        <Input
          label="Keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. urgent"
          error={errors.keyword}
          required
        />

        {/* Match Type + Action — side by side */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Match Type"
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as MatchType)}
            options={MATCH_TYPE_OPTIONS}
          />
          <div className="flex flex-col gap-1.5">
            <Select
              label="Action"
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value as ActionType);
                setErrors({});
              }}
              options={ACTION_TYPE_OPTIONS}
              // Disabled during edit to prevent confusing data changes.
              disabled={isEditMode}
            />
            {isEditMode && (
              <p className="text-xs text-slate-400">Cannot change action type while editing.</p>
            )}
          </div>
        </div>

        {/* Conditional fields based on Action */}
        {actionType === 'highlight' ? (
          <ColorPicker value={color} onChange={setColor} />
        ) : (
          <Input
            label="Tooltip Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. IMPORTANT"
            hint="Short label shown on hover."
            error={errors.label}
            required
          />
        )}

        {/* Backend Error Display */}
        {apiError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {apiError}
          </p>
        )}

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        {isEditMode ? (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Update Rule
            </Button>
          </div>
        ) : (
          <Button type="submit" isLoading={isLoading} className="w-full">
            Add Rule
          </Button>
        )}

      </form>
    </div>
  );
}

// ─── Color Picker sub-component ───────────────────────────────────────────────

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const isCustom = isCustomColor(value);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">Highlight Color</span>

      <div className="flex items-center gap-2.5" role="radiogroup" aria-label="Highlight color">

        {PRESET_COLORS.map((c) => {
          const isSelected = value === c.hex;
          return (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={c.name}
              title={c.name}
              onClick={() => onChange(c.hex)}
              className={cn(
                'h-7 w-7 flex-shrink-0 rounded-full border-2 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-slate-700 scale-110 shadow-md'
                  : 'border-transparent hover:scale-105 hover:shadow-sm',
              )}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}

        {/* Trigger for the native OS color picker */}
        <button
          type="button"
          role="radio"
          aria-checked={isCustom}
          aria-label="Custom color"
          title={isCustom ? `Custom: ${value}` : 'Pick a custom color'}
          onClick={() => nativeInputRef.current?.click()}
          className={cn(
            'relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border-2 transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
            isCustom
              ? 'border-slate-700 scale-110 shadow-md'
              : 'border-slate-200 hover:scale-105 hover:shadow-sm',
          )}
          style={isCustom ? { backgroundColor: value } : undefined}
        >
          {!isCustom && (
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #0ea5e9, #8b5cf6, #f43f5e)',
              }}
            />
          )}
          {!isCustom && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
              +
            </span>
          )}
        </button>

        <input
          ref={nativeInputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Live Hex Preview */}
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1">
          <span
            className="h-4 w-4 flex-shrink-0 rounded-full border border-slate-200 shadow-sm transition-colors duration-150"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono text-xs text-slate-500">{value}</span>
        </div>

      </div>
    </div>
  );
}

// ─── Simple X Icon ────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
