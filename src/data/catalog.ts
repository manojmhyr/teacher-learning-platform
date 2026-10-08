import type { ClassRoom, Lesson, Subject, Teacher } from '@/types';

export const TEACHER: Teacher = {
  id: 'tch-1024',
  employeeId: 'T1024',
  name: 'Rahul Sharma',
  role: 'Mathematics Teacher',
  email: 'rahul.sharma@lumenacademy.edu',
  classIds: ['5A', '6B', '7A'],
  subjectIds: ['math', 'science'],
  joinedOn: '2021-06-14',
};

export const SUBJECTS: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: 'math',
    chapters: [
      'Fractions & Decimals',
      'Multiplication & Division',
      'Geometry',
      'Measurement',
      'Data Handling',
      'Patterns',
      'Integers',
      'Algebra Basics',
    ],
  },
  {
    id: 'science',
    name: 'Science',
    icon: 'science',
    chapters: ['Matter', 'Living World', 'Energy', 'Earth & Space'],
  },
];

export const CLASSES: ClassRoom[] = [
  { id: '5A', name: 'Class 5A', grade: 5, students: 32, room: 'Room 204', schedule: 'Mon, Wed, Fri · Period 2', subjectIds: ['math', 'science'] },
  { id: '6B', name: 'Class 6B', grade: 6, students: 29, room: 'Room 311', schedule: 'Tue, Thu · Period 4', subjectIds: ['math', 'science'] },
  { id: '7A', name: 'Class 7A', grade: 7, students: 34, room: 'Room 118', schedule: 'Mon–Fri · Period 6', subjectIds: ['math'] },
];

interface CatalogEntry {
  slug: string;
  title: string;
  description: string;
  subjectId: string;
  chapter: string;
  durationMin: number;
  difficulty: Lesson['difficulty'];
  objectives: string[];
  materials: string[];
  topics: string[];
}

const MATH_CATALOG: CatalogEntry[] = [
  {
    slug: 'fractions',
    title: 'Introduction to Fractions',
    description: 'Understand fractions, numerator, denominator and their real-world applications.',
    subjectId: 'math',
    chapter: 'Fractions & Decimals',
    durationMin: 45,
    difficulty: 'Beginner',
    objectives: [
      'Understand the concept of fractions',
      'Identify the numerator and denominator of a fraction',
      'Represent fractions visually using shapes and number lines',
      'Apply fractions to real-world situations',
    ],
    materials: ['Lesson Plan', 'Fraction Worksheet', 'Introduction Video'],
    topics: [
      'Introduction',
      'What is a fraction?',
      'Numerator',
      'Denominator',
      'Equivalent fractions',
      'Real-world examples',
      'Practice questions',
    ],
  },
  {
    slug: 'decimals',
    title: 'Working with Decimals',
    description: 'Read, write and compare decimal numbers and relate them to fractions.',
    subjectId: 'math',
    chapter: 'Fractions & Decimals',
    durationMin: 40,
    difficulty: 'Beginner',
    objectives: ['Read and write decimals', 'Compare decimal values', 'Convert between fractions and decimals'],
    materials: ['Lesson Plan', 'Place-value chart'],
    topics: ['Introduction', 'Place value', 'Reading decimals', 'Comparing decimals', 'Fraction to decimal', 'Practice questions'],
  },
  {
    slug: 'multiplication',
    title: 'Multiplication Strategies',
    description: 'Build fluency with multi-digit multiplication using area and column methods.',
    subjectId: 'math',
    chapter: 'Multiplication & Division',
    durationMin: 45,
    difficulty: 'Intermediate',
    objectives: ['Use the area model', 'Multiply multi-digit numbers', 'Estimate products'],
    materials: ['Lesson Plan', 'Grid paper'],
    topics: ['Introduction', 'Area model', 'Column method', 'Estimation', 'Word problems', 'Practice questions'],
  },
  {
    slug: 'division',
    title: 'Division and Remainders',
    description: 'Divide multi-digit numbers and interpret remainders in context.',
    subjectId: 'math',
    chapter: 'Multiplication & Division',
    durationMin: 45,
    difficulty: 'Intermediate',
    objectives: ['Divide using long division', 'Interpret remainders', 'Check answers by multiplying'],
    materials: ['Lesson Plan', 'Counters'],
    topics: ['Introduction', 'Sharing and grouping', 'Long division', 'Remainders', 'Checking answers', 'Practice questions'],
  },
  {
    slug: 'geometry',
    title: 'Shapes and Angles',
    description: 'Classify 2D shapes and measure angles with a protractor.',
    subjectId: 'math',
    chapter: 'Geometry',
    durationMin: 50,
    difficulty: 'Intermediate',
    objectives: ['Classify triangles and quadrilaterals', 'Measure angles', 'Identify lines of symmetry'],
    materials: ['Lesson Plan', 'Protractor set'],
    topics: ['Introduction', 'Types of angles', 'Triangles', 'Quadrilaterals', 'Symmetry', 'Practice questions'],
  },
  {
    slug: 'measurement',
    title: 'Length, Mass and Capacity',
    description: 'Choose units, estimate and convert between metric measures.',
    subjectId: 'math',
    chapter: 'Measurement',
    durationMin: 40,
    difficulty: 'Beginner',
    objectives: ['Choose appropriate units', 'Convert metric units', 'Estimate measurements'],
    materials: ['Lesson Plan', 'Measuring tape', 'Weighing scale'],
    topics: ['Introduction', 'Units of length', 'Units of mass', 'Units of capacity', 'Conversions', 'Practice questions'],
  },
  {
    slug: 'data-handling',
    title: 'Reading Data and Graphs',
    description: 'Collect data and present it using tables, bar charts and pictographs.',
    subjectId: 'math',
    chapter: 'Data Handling',
    durationMin: 40,
    difficulty: 'Beginner',
    objectives: ['Tally and tabulate data', 'Read bar charts', 'Draw a pictograph'],
    materials: ['Lesson Plan', 'Survey sheet'],
    topics: ['Introduction', 'Collecting data', 'Tables', 'Bar charts', 'Pictographs', 'Practice questions'],
  },
  {
    slug: 'patterns',
    title: 'Number Patterns',
    description: 'Spot, describe and extend numeric and shape patterns.',
    subjectId: 'math',
    chapter: 'Patterns',
    durationMin: 35,
    difficulty: 'Beginner',
    objectives: ['Describe a rule', 'Extend a pattern', 'Create your own pattern'],
    materials: ['Lesson Plan', 'Pattern cards'],
    topics: ['Introduction', 'Finding the rule', 'Extending patterns', 'Shape patterns', 'Practice questions'],
  },
  {
    slug: 'integers',
    title: 'Positive and Negative Numbers',
    description: 'Place integers on a number line and add or subtract them.',
    subjectId: 'math',
    chapter: 'Integers',
    durationMin: 45,
    difficulty: 'Intermediate',
    objectives: ['Order integers', 'Add integers', 'Subtract integers'],
    materials: ['Lesson Plan', 'Number line strip'],
    topics: ['Introduction', 'The number line', 'Ordering integers', 'Adding integers', 'Subtracting integers', 'Practice questions'],
  },
  {
    slug: 'algebra-basics',
    title: 'Letters for Numbers',
    description: 'Use letters to stand for unknown values and build simple expressions.',
    subjectId: 'math',
    chapter: 'Algebra Basics',
    durationMin: 45,
    difficulty: 'Advanced',
    objectives: ['Write simple expressions', 'Substitute values', 'Solve one-step equations'],
    materials: ['Lesson Plan', 'Balance model'],
    topics: ['Introduction', 'Expressions', 'Substitution', 'One-step equations', 'Practice questions'],
  },
];

const SCIENCE_CATALOG: CatalogEntry[] = [
  {
    slug: 'states-of-matter',
    title: 'States of Matter',
    description: 'Compare solids, liquids and gases and the changes between them.',
    subjectId: 'science',
    chapter: 'Matter',
    durationMin: 45,
    difficulty: 'Beginner',
    objectives: ['Describe the three states', 'Explain melting and boiling', 'Give everyday examples'],
    materials: ['Lesson Plan', 'Demonstration kit'],
    topics: ['Introduction', 'Solids', 'Liquids', 'Gases', 'Changes of state', 'Practice questions'],
  },
  {
    slug: 'plants',
    title: 'Parts of a Plant',
    description: 'Identify plant parts and explain what each one does.',
    subjectId: 'science',
    chapter: 'Living World',
    durationMin: 40,
    difficulty: 'Beginner',
    objectives: ['Name the main parts', 'Explain their functions', 'Observe a real plant'],
    materials: ['Lesson Plan', 'Sample plant'],
    topics: ['Introduction', 'Roots', 'Stem', 'Leaves', 'Flowers', 'Practice questions'],
  },
  {
    slug: 'energy',
    title: 'Forms of Energy',
    description: 'Recognise forms of energy and how energy transfers between them.',
    subjectId: 'science',
    chapter: 'Energy',
    durationMin: 45,
    difficulty: 'Intermediate',
    objectives: ['List forms of energy', 'Describe transfers', 'Spot energy use at home'],
    materials: ['Lesson Plan', 'Torch and battery'],
    topics: ['Introduction', 'Light and heat', 'Sound', 'Electrical energy', 'Energy transfer', 'Practice questions'],
  },
  {
    slug: 'solar-system',
    title: 'Our Solar System',
    description: 'Order the planets and explain day, night and the seasons.',
    subjectId: 'science',
    chapter: 'Earth & Space',
    durationMin: 50,
    difficulty: 'Intermediate',
    objectives: ['Order the planets', 'Explain day and night', 'Explain the seasons'],
    materials: ['Lesson Plan', 'Globe and torch'],
    topics: ['Introduction', 'The Sun', 'The planets', 'Day and night', 'Seasons', 'Practice questions'],
  },
];

const CATALOG = [...MATH_CATALOG, ...SCIENCE_CATALOG];

/** Expands the catalog into per-class lessons: id = `${classId}-${subjectId}-${slug}`. */
function buildLessons(): Lesson[] {
  const out: Lesson[] = [];
  for (const cls of CLASSES) {
    for (const entry of CATALOG) {
      if (!cls.subjectIds.includes(entry.subjectId)) continue;
      // Class 7A takes a shorter maths programme.
      if (cls.id === '7A' && MATH_CATALOG.indexOf(entry) >= 6) continue;
      out.push({
        id: `${cls.id}-${entry.subjectId}-${entry.slug}`,
        slug: entry.slug,
        title: entry.title,
        description: entry.description,
        classId: cls.id,
        subjectId: entry.subjectId,
        chapter: entry.chapter,
        durationMin: entry.durationMin,
        difficulty: entry.difficulty,
        objectives: entry.objectives,
        materials: entry.materials,
        topics: entry.topics,
      });
    }
  }
  return out;
}

export const LESSONS: Lesson[] = buildLessons();

export const getClass = (id?: string) => CLASSES.find((c) => c.id === id);
export const getSubject = (id?: string) => SUBJECTS.find((s) => s.id === id);
export const getLesson = (id?: string) => LESSONS.find((l) => l.id === id);
export const lessonsFor = (classId?: string, subjectId?: string) =>
  LESSONS.filter((l) => (!classId || l.classId === classId) && (!subjectId || l.subjectId === subjectId));
