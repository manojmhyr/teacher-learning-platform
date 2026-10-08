import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IDLE_TIMEOUT_MS, authService, type Session } from '@/services/authService';

interface AuthValue {
  session: Session | null;
  /** False until a stored session has been checked, so the app does not flash the login screen. */
  restoring: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: (reason?: 'user' | 'idle') => Promise<void>;
  /** Set when the last sign-out was forced by inactivity, so Login can explain why. */
  lastSignOutReason: 'user' | 'idle' | null;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [lastSignOutReason, setLastSignOutReason] = useState<'user' | 'idle' | null>(null);
  const idleTimer = useRef<number | undefined>(undefined);

  // Re-establish an existing session on load, so a refresh does not sign a
  // teacher out in the middle of a lesson.
  useEffect(() => {
    let alive = true;
    void authService.restore().then((restored) => {
      if (!alive) return;
      if (restored) setSession(restored);
      setRestoring(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const signOut = useCallback(async (reason: 'user' | 'idle' = 'user') => {
    await authService.signOut();
    setSession(null);
    setLastSignOutReason(reason);
  }, []);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const next = await authService.signIn(identifier, password);
    setSession(next);
    setLastSignOutReason(null);
  }, []);

  /**
   * Idle lock. Protected lesson content should not stay open on an unattended
   * laptop in a staffroom, so an inactive session is signed out.
   */
  useEffect(() => {
    if (!session) return;
    const reset = () => {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => void signOut('idle'), IDLE_TIMEOUT_MS);
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'focus'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [session, signOut]);

  const value = useMemo(
    () => ({ session, restoring, signIn, signOut, lastSignOutReason }),
    [session, restoring, signIn, signOut, lastSignOutReason],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
