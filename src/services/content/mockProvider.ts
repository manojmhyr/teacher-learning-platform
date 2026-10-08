import { getLesson } from '@/data/catalog';
import { demoGame, demoPlan, demoQna, demoResourceDocument, demoResources, demoVideos } from '@/data/demoContent';
import type { LessonContent, ProtectedDocument, Resource, Video } from '@/types';
import { ContentError, type ContentProvider } from './types';

/** Simulates network latency so loading and skeleton states are exercised in the demo. */
const delay = (ms = 420) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Serves built-in demo content. This is what runs until Azure is configured,
 * and it is also what the automated smoke test runs against, so the UI can be
 * exercised end to end with no cloud dependency.
 */
export const mockProvider: ContentProvider = {
  label: 'Built-in demo content',
  isDemo: true,

  async getLessonContent(lessonId) {
    await delay();
    const lesson = getLesson(lessonId);
    if (!lesson) throw new ContentError(`Unknown lesson: ${lessonId}`);
    const content: LessonContent = {
      lessonId,
      plan: demoPlan(lesson),
      videos: demoVideos(lesson),
      resources: demoResources(lesson),
      qna: demoQna(lesson),
      game: demoGame(),
    };
    return content;
  },

  async getLessonPlan(lessonId) {
    await delay(300);
    const lesson = getLesson(lessonId);
    if (!lesson) throw new ContentError(`Unknown lesson: ${lessonId}`);
    return demoPlan(lesson);
  },

  async getVideoUrl(_lessonId: string, video: Video) {
    await delay(200);
    // No real media file in demo mode — the player renders a synthetic scene.
    return `demo://video/${video.id}`;
  },

  async getResourceDocument(_lessonId: string, resource: Resource): Promise<ProtectedDocument> {
    await delay(260);
    return demoResourceDocument(resource);
  },

  async healthCheck() {
    return { ok: true, detail: 'Demo content is bundled with the app. No network calls are made for lesson content.' };
  },
};
