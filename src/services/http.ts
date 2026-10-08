import { config } from '@/config/env';
import { getAccessToken } from '@/services/tokenStore';

/**
 * Thin fetch wrapper for calls to OUR backend.
 *
 * Deliberately small: the access token is read from an in-memory store at call
 * time (never from localStorage), nothing is cached, and credentials are not
 * sent cross-origin.
 */

interface RequestOptions {
  query?: Record<string, string>;
  signal?: AbortSignal;
  body?: unknown;
  /** Idempotency key for writes, so a retry cannot create a duplicate record. */
  idempotencyKey?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const base = path.startsWith('http') ? path : `${config.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return base;
  const qs = new URLSearchParams(query).toString();
  return qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  const res = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    cache: 'no-store',
    credentials: 'omit',
    signal: opts.signal,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  if (!res.ok) {
    throw new ApiError(`${method} ${path} failed with ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiGet = <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts);
export const apiPost = <T>(path: string, opts?: RequestOptions) => request<T>('POST', path, opts);
