import { CLASSES, LESSONS, getLesson } from '@/data/catalog';
import type { Activity, Annotation, TeachingRecord } from '@/types';
import { uid } from '@/utils/format';

/**
 * Seeds a believable teaching history so the app has something to show on
 * first run. Real deployments replace this with records from the API.
 */

const TARGET: Record<string, number> = { '5A': 0.72, '6B': 0.61, '7A': 0.54 };

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

export function seedRecords(): TeachingRecord[] {
  const records: TeachingRecord[] = [];
  let day = 30;

  for (const cls of CLASSES) {
    const lessons = LESSONS.filter((l) => l.classId === cls.id);
    const target = TARGET[cls.id] ?? 0.6;
    for (const lesson of lessons) {
      const share = Math.random() * 0.5 + target - 0.2;
      const count = Math.max(0, Math.min(lesson.topics.length, Math.round(lesson.topics.length * share)));
      if (count === 0) continue;
      day = Math.max(2, day - 1);
      records.push({
        id: uid(),
        lessonId: lesson.id,
        classId: cls.id,
        dateTaught: daysAgo(day),
        durationMin: lesson.durationMin,
        topics: lesson.topics.slice(0, count),
        notes: '',
        createdAt: new Date(Date.now() - day * 86_400_000).toISOString(),
      });
    }
  }

  // A hand-written history for the demo lesson, so the walkthrough shows real notes.
  const fractions = getLesson('5A-math-fractions');
  if (fractions) {
    const existing = records.filter((r) => r.lessonId !== fractions.id);
    records.length = 0;
    records.push(...existing);
    records.push(
      {
        id: uid(),
        lessonId: fractions.id,
        classId: '5A',
        dateTaught: daysAgo(9),
        durationMin: 45,
        topics: ['Introduction', 'What is a fraction?'],
        notes: 'Introduced fractions with paper strips. Class engaged well; a few students still split strips unequally.',
        createdAt: new Date(Date.now() - 9 * 86_400_000).toISOString(),
      },
      {
        id: uid(),
        lessonId: fractions.id,
        classId: '5A',
        dateTaught: daysAgo(2),
        durationMin: 40,
        topics: ['Introduction', 'Numerator'],
        notes: 'Recapped the basics, then covered the numerator. Students understood numerator well. Need additional examples for equivalent fractions.',
        createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
    );
  }

  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function seedActivities(): Activity[] {
  const now = Date.now();
  const at = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  return [
    { id: uid(), at: at(18), kind: 'coverage', text: 'Marked “Numerator” as covered in Introduction to Fractions' },
    { id: uid(), at: at(35), kind: 'watch_video', text: 'Watched “Introduction to Fractions”' },
    { id: uid(), at: at(58), kind: 'view_plan', text: 'Opened the lesson plan for Introduction to Fractions' },
    { id: uid(), at: at(96), kind: 'resource', text: 'Viewed “Fraction Worksheet.pdf”' },
    { id: uid(), at: at(140), kind: 'login', text: 'Signed in to the Teacher Portal' },
    { id: uid(), at: at(60 * 20), kind: 'note', text: 'Added a teaching note to Introduction to Fractions' },
    { id: uid(), at: at(60 * 22), kind: 'game', text: 'Played Fraction Match — scored 8 / 10' },
    { id: uid(), at: at(60 * 26), kind: 'coverage', text: 'Saved a teaching record for Class 6B — Working with Decimals' },
  ];
}

/** Two pre-existing highlights so the annotation layer is visible immediately. */
export function seedAnnotations(documentId: string, pages: Array<{ number: number; blocks: Array<{ id: string; text: string }> }>): Annotation[] {
  const out: Annotation[] = [];
  const find = (needle: string) => {
    for (const page of pages) {
      for (const block of page.blocks) {
        const idx = block.text.indexOf(needle);
        if (idx >= 0) return { page: page.number, blockId: block.id, start: idx, end: idx + needle.length };
      }
    }
    return null;
  };
  for (const needle of ['Identify the numerator and denominator of a fraction', 'equal parts']) {
    const hit = find(needle);
    if (hit) {
      out.push({
        id: uid(),
        documentId,
        pageNumber: hit.page,
        blockId: hit.blockId,
        start: hit.start,
        end: hit.end,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return out;
}
