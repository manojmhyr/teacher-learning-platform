import { config } from '@/config/env';
import { apiGet } from '@/services/http';
import type { LessonContent, ProtectedDocument } from '@/types';
import { ContentError, type ContentProvider } from './types';

/**
 * Serves lesson content from Azure Blob Storage.
 *
 * Security model — the important part:
 *
 *  1. The browser NEVER holds a storage account key or a connection string.
 *     Those live only on the backend (ideally in Key Vault, read via a
 *     managed identity).
 *  2. To reach a blob, the app asks our backend for a SAS URL. The backend
 *     checks that this teacher is entitled to this lesson, then signs a SAS
 *     that is read-only, scoped to one blob, and expires in minutes.
 *  3. SAS URLs are used immediately and never written to storage, logs or the
 *     URL bar, so a leaked device cache does not leak content.
 *  4. The lesson plan is fetched as structured JSON, not as a PDF or DOCX, so
 *     there is no original file for the client to save. It also reflows
 *     properly on a phone and keeps highlight offsets stable across devices.
 *
 * Expected container layout:
 *
 *   lesson-content/
 *     <lessonId>/plan.json        → ProtectedDocument (pages[].blocks[])
 *     <lessonId>/content.json     → { videos, resources, qna, game }
 *     <lessonId>/videos/<id>.m3u8 → HLS playlist
 *     <lessonId>/resources/<id>.json
 */

interface SasResponse {
  url: string;
  expiresAt: string;
}

/** Asks the backend to mint a short-lived, read-only SAS URL for one blob. */
async function mintSasUrl(blobPath: string, signal?: AbortSignal): Promise<string> {
  const res = await apiGet<SasResponse>(config.sasEndpoint, {
    query: { container: config.azureContainer, blob: blobPath, ttl: String(config.sasTtlSeconds) },
    signal,
  });
  if (!res?.url) throw new ContentError(`Backend did not return a SAS URL for ${blobPath}`);
  return res.url;
}

/** Fetches and parses a JSON blob through a freshly minted SAS URL. */
async function readJsonBlob<T>(blobPath: string, signal?: AbortSignal): Promise<T> {
  const url = await mintSasUrl(blobPath, signal);
  const res = await fetch(url, { signal, cache: 'no-store', credentials: 'omit' });
  if (!res.ok) {
    throw new ContentError(`Azure Blob returned ${res.status} for ${blobPath}`);
  }
  return (await res.json()) as T;
}

function assertConfigured() {
  if (!config.azureBlobBaseUrl || !config.apiBaseUrl) {
    throw new ContentError(
      'Azure content is selected but not fully configured. Set VITE_AZURE_BLOB_BASE_URL and VITE_API_BASE_URL — see docs/AZURE_SETUP.md.',
    );
  }
}

export const azureProvider: ContentProvider = {
  label: `Azure Blob Storage · ${config.azureContainer}`,
  isDemo: false,

  async getLessonContent(lessonId, signal) {
    assertConfigured();
    const [plan, rest] = await Promise.all([
      readJsonBlob<ProtectedDocument>(`${lessonId}/plan.json`, signal),
      readJsonBlob<Omit<LessonContent, 'lessonId' | 'plan'>>(`${lessonId}/content.json`, signal),
    ]);
    return { lessonId, plan: { ...plan, origin: 'azure' }, ...rest };
  },

  async getLessonPlan(lessonId, signal) {
    assertConfigured();
    const plan = await readJsonBlob<ProtectedDocument>(`${lessonId}/plan.json`, signal);
    return { ...plan, origin: 'azure' };
  },

  async getVideoUrl(lessonId, video, signal) {
    assertConfigured();
    // Minted on each play so the link cannot be shared beyond its short TTL.
    return mintSasUrl(`${lessonId}/videos/${video.id}.m3u8`, signal);
  },

  async getResourceDocument(lessonId, resource, signal) {
    assertConfigured();
    const doc = await readJsonBlob<ProtectedDocument>(`${lessonId}/resources/${resource.id}.json`, signal);
    return { ...doc, origin: 'azure' };
  },

  async healthCheck(signal) {
    try {
      assertConfigured();
      await apiGet(`${config.sasEndpoint}/health`, { signal });
      return { ok: true, detail: `Connected to ${config.azureBlobBaseUrl}/${config.azureContainer}` };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : 'Unknown error contacting content service' };
    }
  },
};
