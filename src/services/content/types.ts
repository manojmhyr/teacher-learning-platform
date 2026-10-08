import type { LessonContent, ProtectedDocument, Resource, Video } from '@/types';

/**
 * The seam between the app and wherever lesson content actually lives.
 *
 * The UI only ever talks to this interface, so switching from built-in demo
 * data to Azure Blob Storage is a configuration change (VITE_CONTENT_SOURCE),
 * not a code change. Any future source — S3, SharePoint, an on-prem file
 * server — is a new implementation of this one interface.
 */
export interface ContentProvider {
  /** Human-readable name shown in Settings so it is obvious what is serving content. */
  readonly label: string;
  readonly isDemo: boolean;

  /** Everything needed to render a lesson's tabs. */
  getLessonContent(lessonId: string, signal?: AbortSignal): Promise<LessonContent>;

  /** The read-only lesson plan, as structured blocks (never a downloadable file). */
  getLessonPlan(lessonId: string, signal?: AbortSignal): Promise<ProtectedDocument>;

  /**
   * Resolves a playable URL for a video. For Azure this is a short-lived,
   * read-only SAS URL minted by the backend — it expires in minutes and is
   * never persisted.
   */
  getVideoUrl(lessonId: string, video: Video, signal?: AbortSignal): Promise<string>;

  /** Resolves a viewable (not downloadable) representation of a resource. */
  getResourceDocument(lessonId: string, resource: Resource, signal?: AbortSignal): Promise<ProtectedDocument>;

  /** Lightweight connectivity/configuration check used by Settings → Diagnostics. */
  healthCheck(signal?: AbortSignal): Promise<{ ok: boolean; detail: string }>;
}

export class ContentError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ContentError';
  }
}
