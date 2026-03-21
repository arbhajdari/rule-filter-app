import { useState, useEffect, useCallback } from 'react';
import { RuleForm } from './components/RuleForm';
import { RuleList } from './components/RuleList';
import { TextProcessor } from './components/TextProcessor';
import { rulesApi } from './api/apiClient';
import type { Rule } from '@rule-filter/shared';

// ─── App (Root State) ──────────────────────────────────────────────────────────
// App acts as the central hub for the rules array. 
// We lift the state here so that RuleForm (writes) and RuleList (reads/writes) 
// stay in sync without needing a complex state management library.

export default function App() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // single source of truth for the rule currently being edited.
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      setRules(await rulesApi.getAll());
    } catch {
      setFetchError('Could not reach the server. Ensure the backend is running on port 3001.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3.5">
          <img
            src="/anchorzup-logo.jpg"
            alt="AnchorzUp logo"
            className="h-7 w-7 flex-shrink-0 rounded-lg object-cover shadow-sm"
          />
          <div>
            <h1 className="text-sm font-semibold leading-tight text-slate-900">Rule Filter</h1>
            <p className="text-xs leading-tight text-slate-400">AnchorzUp Internship Assignment</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${fetchError ? 'bg-red-400' : 'bg-emerald-500'}`} />
            <span className="text-xs text-slate-400">
              {fetchError ? 'Server offline' : 'Connected'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Left: Rule Configuration */}
          <section>
            <SectionHeader 
              title="Rule Management" 
              subtitle="Create and configure your content filtering rules." 
            />
            <div className="mt-5 space-y-4">
              <RuleForm 
                onSuccess={loadRules} 
                editRule={editingRule} 
                onCancelEdit={() => setEditingRule(null)} 
              />
              {isLoading ? (
                <LoadingSkeleton />
              ) : fetchError ? (
                <ErrorCard message={fetchError} onRetry={loadRules} />
              ) : (
                <RuleList 
                  rules={rules} 
                  onUpdate={loadRules} 
                  onEdit={setEditingRule} 
                  editingRuleId={editingRule?.id} 
                />
              )}
            </div>
          </section>

          {/* Right: Interaction Area */}
          <section>
            <SectionHeader 
              title="Text Analysis" 
              subtitle="Test your rules against live text input." 
            />
            <div className="mt-5">
              <TextProcessor />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-200 pb-3">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[60px] rounded-xl bg-slate-200" />
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-sm text-red-600">{message}</p>
      <button 
        onClick={onRetry} 
        className="text-xs font-semibold text-red-600 underline hover:text-red-700"
      >
        Retry
      </button>
    </div>
  );
}