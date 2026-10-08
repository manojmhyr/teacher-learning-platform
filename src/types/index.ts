export type LessonStatus = 'not_started' | 'in_progress' | 'completed';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  email: string;
  classIds: string[];
  subjectIds: string[];
  joinedOn: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number;
  students: number;
  room: string;
  schedule: string;
  subjectIds: string[];
}

export interface Subject {
  id: string;
  name: string;
  icon: 'math' | 'science';
  chapters: string[];
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  classId: string;
  subjectId: string;
  chapter: string;
  durationMin: number;
  difficulty: Difficulty;
  objectives: string[];
  materials: string[];
  /** Checklist the teacher records coverage against. */
  topics: string[];
}

/** A paragraph-level unit of a protected document. Highlights anchor to these. */
export interface DocBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'quote' | 'meta';
  text: string;
}

export interface DocPage {
  number: number;
  blocks: DocBlock[];
}

export interface ProtectedDocument {
  id: string;
  title: string;
  subtitle: string;
  pages: DocPage[];
  /** Where the bytes came from — surfaced in the UI for transparency. */
  origin: 'demo' | 'azure';
}

export interface Video {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  /** Resolved at view time; for Azure this is a short-lived SAS URL. */
  streamUrl?: string;
  poster?: string;
}

export interface Resource {
  id: string;
  name: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  sizeBytes: number;
  pages: number;
}

export interface QnAItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export interface GameQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
}

export interface LessonContent {
  lessonId: string;
  plan: ProtectedDocument;
  videos: Video[];
  resources: Resource[];
  qna: QnAItem[];
  game: GameQuestion[];
}

/** Append-only. A new teaching session always creates a new record. */
export interface TeachingRecord {
  /** Client-generated UUID, used as the idempotency key on the API. */
  id: string;
  lessonId: string;
  classId: string;
  dateTaught: string;
  durationMin: number;
  topics: string[];
  notes: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  at: string;
  kind: 'login' | 'view_plan' | 'watch_video' | 'coverage' | 'note' | 'game' | 'resource';
  text: string;
}

/** A personal annotation layer over a read-only document. */
export interface Annotation {
  id: string;
  documentId: string;
  pageNumber: number;
  blockId: string;
  start: number;
  end: number;
  createdAt: string;
}
