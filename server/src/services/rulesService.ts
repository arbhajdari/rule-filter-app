import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/httpError';
import type { CreateRuleInput, UpdateRuleInput } from '../validators/ruleValidator';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all rules for the management dashboard.
 * Sorted by priority (desc) and then by creation date to ensure a stable UI list.
 */
export async function getAllRules() {
  return prisma.rule.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
}

/**
 * Fetches only active rules for the text processing engine.
 * Filtering at the DB level is more efficient than processing a full list in memory.
 */
export async function getEnabledRules() {
  return prisma.rule.findMany({
    where: { isEnabled: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createRule(data: CreateRuleInput) {
  try {
    return await prisma.rule.create({
      data: {
        keyword:    data.keyword,
        matchType:  data.matchType,
        actionType: data.actionType,
        // Explicitly null-out unused payload fields based on the actionType.
        color:      data.actionType === 'highlight' ? data.color : null,
        label:      data.actionType === 'tooltip'   ? data.label : null,
        priority:   data.priority ?? 0,
      },
    });
  } catch (err) {
    if (isPrismaP2002(err)) {
      throw new HttpError(409, `A rule with keyword "${data.keyword}" and the same configuration already exists.`);
    }
    throw err;
  }
}

export async function updateRule(id: number, data: UpdateRuleInput) {
  try {
    return await prisma.rule.update({ where: { id }, data });
  } catch (err) {
    if (isPrismaP2025(err)) {
      throw new HttpError(404, `Rule with id ${id} not found`);
    }
    if (isPrismaP2002(err)) {
      throw new HttpError(409, `Another rule with that keyword configuration already exists.`);
    }
    throw err;
  }
}

export async function deleteRule(id: number) {
  try {
    await prisma.rule.delete({ where: { id } });
  } catch (err) {
    if (isPrismaP2025(err)) {
      throw new HttpError(404, `Rule with id ${id} not found`);
    }
    throw err;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function isPrismaCode(err: unknown, code: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === code
  );
}

/** Prisma P2025 — record not found (e.g. update/delete on missing id). */
function isPrismaP2025(err: unknown): boolean {
  return isPrismaCode(err, 'P2025');
}

/** Prisma P2002 — unique constraint violation. */
function isPrismaP2002(err: unknown): boolean {
  return isPrismaCode(err, 'P2002');
}