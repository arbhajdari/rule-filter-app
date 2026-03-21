import type {
  Rule,
  CreateRuleBody,
  UpdateRuleBody,
  ProcessTextBody,
  ProcessTextResponse,
} from '@rule-filter/shared';

const BASE = '/api';

/**
 * Custom error class for API-level rejections.
 */
export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Generic fetch wrapper for shared API logic.
 * Handles JSON parsing, 204 responses, and error normalization.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => ({
    error: response.statusText,
  }));

  if (!response.ok) {
    const raw = body.error;
    let message: string;

    // Normalizing string errors and Zod validation objects into a readable string
    if (typeof raw === 'string') {
      message = raw;
    } else if (raw && typeof raw === 'object' && 'fieldErrors' in raw) {
      message = Object.entries(raw.fieldErrors as Record<string, string[]>)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join(' | ');
    } else {
      message = `Request failed with status ${response.status}`;
    }

    throw new ApiError(response.status, message);
  }

  return body as T;
}

export const rulesApi = {
  getAll(): Promise<Rule[]> {
    return apiFetch<Rule[]>('/rules');
  },

  create(body: CreateRuleBody): Promise<Rule> {
    return apiFetch<Rule>('/rules', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update(id: number, body: UpdateRuleBody): Promise<Rule> {
    return apiFetch<Rule>(`/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(id: number): Promise<void> {
    return apiFetch<void>(`/rules/${id}`, { method: 'DELETE' });
  },
};

export const processApi = {
  process(body: ProcessTextBody): Promise<ProcessTextResponse> {
    return apiFetch<ProcessTextResponse>('/process', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};