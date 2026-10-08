import { getLesson, lessonsFor } from '@/data/catalog';
import type { LessonStatus, TeachingRecord } from '@/types';

/**
 * Derives teaching progress from the append-only record history.
 *
 * Nothing here mutates state: coverage is always recomputed from the records,
 * so history stays the single source of truth and a record can never be
 * silently overwritten.
 */

/** Distinct topics a teacher has recorded as covered for one lesson. */
export function coveredTopics(records: TeachingRecord[], lessonId: string): Set<string> {
  const out = new Set<string>();
  for (const r of records) {
    if (r.lessonId === lessonId) r.topics.forEach((t) => out.add(t));
  }
  return out;
}

export function lessonCoverage(records: TeachingRecord[], lessonId: string): number {
  const lesson = getLesson(lessonId);
  if (!lesson || lesson.topics.length === 0) return 0;
  const covered = coveredTopics(records, lessonId);
  const hits = lesson.topics.filter((t) => covered.has(t)).length;
  return Math.round((hits / lesson.topics.length) * 100);
}

export function lessonStatus(records: TeachingRecord[], lessonId: string): LessonStatus {
  const pct = lessonCoverage(records, lessonId);
  if (pct === 0) return 'not_started';
  if (pct >= 100) return 'completed';
  return 'in_progress';
}

export function lastTaught(records: TeachingRecord[], lessonId: string): string | null {
  const dates = records.filter((r) => r.lessonId === lessonId).map((r) => r.dateTaught).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

export function averageCoverage(records: TeachingRecord[], classId?: string, subjectId?: string): number {
  const lessons = lessonsFor(classId, subjectId);
  if (!lessons.length) return 0;
  const total = lessons.reduce((sum, l) => sum + lessonCoverage(records, l.id), 0);
  return Math.round(total / lessons.length);
}

export function statusCounts(records: TeachingRecord[], classId?: string, subjectId?: string) {
  const lessons = lessonsFor(classId, subjectId);
  const counts = { total: lessons.length, completed: 0, in_progress: 0, not_started: 0 };
  for (const l of lessons) counts[lessonStatus(records, l.id)] += 1;
  return counts;
}

/** Groups a class+subject's lessons by chapter for the progress page. */
export function chapters(records: TeachingRecord[], classId: string, subjectId: string) {
  const grouped = new Map<string, { chapter: string; lessons: Array<{ id: string; title: string; coverage: number }> }>();
  for (const l of lessonsFor(classId, subjectId)) {
    if (!grouped.has(l.chapter)) grouped.set(l.chapter, { chapter: l.chapter, lessons: [] });
    grouped.get(l.chapter)!.lessons.push({ id: l.id, title: l.title, coverage: lessonCoverage(records, l.id) });
  }
  return [...grouped.values()].map((g) => ({
    ...g,
    coverage: Math.round(g.lessons.reduce((s, l) => s + l.coverage, 0) / g.lessons.length),
  }));
}
