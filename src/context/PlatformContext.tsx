import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedActivities, seedRecords } from '@/data/seed';
import { secureStore } from '@/services/secureStore';
import type { Activity, Annotation, TeachingRecord } from '@/types';
import { uid } from '@/utils/format';

type ColorPref = 'light' | 'dark' | 'system';

interface PlatformValue {
  records: TeachingRecord[];
  activities: Activity[];
  annotations: Annotation[];
  bookmarks: string[];
  colorPref: ColorPref;
  ready: boolean;
  /** Append-only: a record is added, never replaced. */
  addRecord: (record: TeachingRecord) => void;
  log: (kind: Activity['kind'], text: string) => void;
  addAnnotation: (a: Omit<Annotation, 'id' | 'createdAt'>) => void;
  removeAnnotation: (id: string) => void;
  setAnnotationsForDocument: (documentId: string, next: Annotation[]) => void;
  toggleBookmark: (id: string) => void;
  setColorPref: (pref: ColorPref) => void;
  resetDemo: () => void;
}

const PlatformContext = createContext<PlatformValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<TeachingRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [colorPref, setColorPrefState] = useState<ColorPref>('system');
  const [ready, setReady] = useState(false);

  // Hydrate from storage once. Annotations are a personal layer and are the
  // only content-adjacent thing kept on the device.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [storedAnnotations, storedBookmarks, storedTheme] = await Promise.all([
        secureStore.get<Annotation[]>('annotations', []),
        secureStore.get<string[]>('bookmarks', []),
        secureStore.get<ColorPref>('theme', 'system'),
      ]);
      if (!alive) return;
      setAnnotations(storedAnnotations);
      setBookmarks(storedBookmarks);
      setColorPrefState(storedTheme);
      setRecords(seedRecords());
      setActivities(seedActivities());
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) void secureStore.set('annotations', annotations);
  }, [annotations, ready]);
  useEffect(() => {
    if (ready) void secureStore.set('bookmarks', bookmarks);
  }, [bookmarks, ready]);

  const addRecord = useCallback((record: TeachingRecord) => {
    setRecords((prev) => [record, ...prev]);
  }, []);

  const log = useCallback((kind: Activity['kind'], text: string) => {
    setActivities((prev) => [{ id: uid(), at: new Date().toISOString(), kind, text }, ...prev].slice(0, 200));
  }, []);

  const addAnnotation = useCallback((a: Omit<Annotation, 'id' | 'createdAt'>) => {
    setAnnotations((prev) => [...prev, { ...a, id: uid(), createdAt: new Date().toISOString() }]);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setAnnotationsForDocument = useCallback((documentId: string, next: Annotation[]) => {
    setAnnotations((prev) => [...prev.filter((a) => a.documentId !== documentId), ...next]);
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }, []);

  const setColorPref = useCallback((pref: ColorPref) => {
    setColorPrefState(pref);
    void secureStore.set('theme', pref);
  }, []);

  const resetDemo = useCallback(() => {
    setRecords(seedRecords());
    setActivities(seedActivities());
    setAnnotations([]);
    setBookmarks([]);
  }, []);

  const value = useMemo<PlatformValue>(
    () => ({
      records,
      activities,
      annotations,
      bookmarks,
      colorPref,
      ready,
      addRecord,
      log,
      addAnnotation,
      removeAnnotation,
      setAnnotationsForDocument,
      toggleBookmark,
      setColorPref,
      resetDemo,
    }),
    [records, activities, annotations, bookmarks, colorPref, ready, addRecord, log, addAnnotation, removeAnnotation, setAnnotationsForDocument, toggleBookmark, setColorPref, resetDemo],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformValue {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
}
