import { useState } from 'react';
import type { Rule } from '@rule-filter/shared';
import { rulesApi } from '../api/apiClient';
import { cn } from '../lib/utils';
import { getColorLabel } from '../lib/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  rules:          Rule[];
  onUpdate:       () => void;
  onEdit:         (rule: Rule) => void;
  editingRuleId?: number;
}

// ─── Match type badge ─────────────────────────────────────────────────────────

const MATCH_LABELS: Record<Rule['matchType'], string> = {
  contains:   'Contains',
  startsWith: 'Starts with',
  exact:      'Exact',
};

function MatchBadge({ type }: { type: Rule['matchType'] }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      {MATCH_LABELS[type]}
    </span>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onUpdate,
  onEdit,
  isBeingEdited,
}: {
  rule:          Rule;
  onUpdate:       () => void;
  onEdit:         (rule: Rule) => void;
  isBeingEdited: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const isBusy = isDeleting || isToggling;

  async function handleToggle() {
    setIsToggling(true);
    try {
      await rulesApi.update(rule.id, { isEnabled: !rule.isEnabled });
      onUpdate();
    } catch (err) {
      console.error('Status toggle failed:', err);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete rule for "${rule.keyword}"?`)) return;
    setIsDeleting(true);
    try {
      await rulesApi.delete(rule.id);
      onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
      setIsDeleting(false); // Only reset if it fails; success results in unmounting
    }
  }

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200',
        // Highlights the card if it's currently open in the editor form
        isBeingEdited
          ? 'border-indigo-300 bg-white shadow-sm ring-2 ring-indigo-100'
          : rule.isEnabled
            ? 'border-slate-200 bg-white shadow-sm'
            : 'border-slate-200 bg-slate-50 opacity-50',
      )}
    >
      {/* Visual Action Indicator */}
      {rule.actionType === 'highlight' ? (
        <div
          className="h-9 w-9 flex-shrink-0 rounded-lg shadow-sm ring-1 ring-black/5"
          style={{ backgroundColor: rule.color ?? '#94a3b8' }}
          title={`${getColorLabel(rule.color)} · ${rule.color}`}
        />
      ) : (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
          <TagIcon className="h-4 w-4 text-indigo-500" />
        </div>
      )}

      {/* Primary Rule Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-800">
            "{rule.keyword}"
          </span>
          <MatchBadge type={rule.matchType} />
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">
          {rule.actionType === 'tooltip'
            ? `Tooltip: ${rule.label}`
            : getColorLabel(rule.color) === rule.color?.toUpperCase()
              ? `Custom · ${rule.color}`
              : getColorLabel(rule.color)}
        </p>
      </div>

      {/* Row Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <IconButton
          onClick={handleToggle}
          disabled={isBusy}
          title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
          className="text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          {isToggling
            ? <SpinnerIcon className="h-4 w-4" />
            : rule.isEnabled
              ? <EyeIcon className="h-4 w-4" />
              : <EyeOffIcon className="h-4 w-4" />}
        </IconButton>

        <IconButton
          onClick={() => onEdit(rule)}
          disabled={isBusy}
          title="Edit rule"
          className={cn(
            'text-slate-400 hover:bg-indigo-50 hover:text-indigo-500',
            isBeingEdited && 'bg-indigo-50 text-indigo-500',
          )}
        >
          <PencilIcon className="h-4 w-4" />
        </IconButton>

        <IconButton
          onClick={handleDelete}
          disabled={isBusy}
          title="Delete rule"
          className="text-slate-400 hover:bg-red-50 hover:text-red-500"
        >
          {isDeleting ? <SpinnerIcon className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
        </IconButton>
      </div>
    </li>
  );
}

// ─── List Wrapper ─────────────────────────────────────────────────────────────

export function RuleList({ rules, onUpdate, onEdit, editingRuleId }: Props) {
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <TagIcon className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">No rules yet</p>
        <p className="mt-1 text-xs text-slate-400">Use the form above to add your first rule.</p>
      </div>
    );
  }

  const enabled  = rules.filter((r) => r.isEnabled);
  const disabled = rules.filter((r) => !r.isEnabled);

  return (
    <div className="space-y-3">
      <p className="px-1 text-xs text-slate-400">
        {enabled.length} active · {disabled.length} disabled
      </p>
      <ul className="space-y-2">
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onUpdate={onUpdate}
            onEdit={onEdit}
            isBeingEdited={rule.id === editingRuleId}
          />
        ))}
      </ul>
    </div>
  );
}

// ─── Shared icon button ───────────────────────────────────────────────────────

function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-lg p-1.5 transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}