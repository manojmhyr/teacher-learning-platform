import { TEACHER } from '@/data/catalog';
import { config } from '@/config/env';
import { apiPost } from '@/services/http';
import { secureStore } from '@/services/secureStore';
import { clearAccessToken, setAccessToken } from '@/services/tokenStore';
import type { Teacher } from '@/types';

/**
 * Authentication.
 *
 * Today this validates against demo credentials so the app runs with no
 * backend. The shape is already the real one: sign in returns a teacher plus a
 * short-lived access token held in memory, and the refresh token (when a real
 * IdP is wired in) goes to platform secure storage.
 *
 * To switch to Azure Entra ID (OIDC), replace the body of `signIn` with an
 * authorization-code + PKCE flow and keep this interface. Nothing else in the
 * app needs to change — see docs/AZURE_SETUP.md.
 */

export interface Session {
  teacher: Teacher;
  issuedAt: string;
  expiresAt: string;
}

/**
 * What is persisted between page loads.
 *
 * Deliberately NOT the access token. This is the non-sensitive descriptor the
 * app needs to re-establish a session, mirroring how a real refresh token in
 * platform secure storage would silently restore an OIDC session. Without it a
 * browser refresh would sign a teacher out mid-lesson.
 */
const SESSION_KEY = 'session';

/** Inactivity window. Protected content should not sit unlocked on a staffroom desk. */
export const IDLE_TIMEOUT_MS = 20 * 60 * 1000;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

const DEMO_PASSWORD_MIN = 4;

export const authService = {
  async signIn(identifier: string, password: string): Promise<Session> {
    if (config.apiBaseUrl) {
      // Real backend path. The API sets the refresh token; we keep the access
      // token in memory only.
      const res = await apiPost<{ accessToken: string; expiresIn: number; teacher: Teacher; refreshToken?: string }>('/auth/login', {
        body: { identifier, password },
      });
      setAccessToken(res.accessToken, res.expiresIn);
      if (res.refreshToken) await secureStore.set('refreshToken', res.refreshToken);
      const now = new Date();
      const session: Session = {
        teacher: res.teacher,
        issuedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + res.expiresIn * 1000).toISOString(),
      };
      await secureStore.set(SESSION_KEY, session);
      return session;
    }

    // Demo path.
    await new Promise((r) => setTimeout(r, 700));
    const id = identifier.trim().toLowerCase();
    const valid = id === TEACHER.employeeId.toLowerCase() || id === TEACHER.email.toLowerCase();
    if (!valid || password.length < DEMO_PASSWORD_MIN) {
      throw new Error('Employee ID or password is incorrect.');
    }
    const now = new Date();
    setAccessToken(`demo.${now.getTime()}`, SESSION_TTL_SECONDS);
    const session: Session = {
      teacher: TEACHER,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString(),
    };
    await secureStore.set(SESSION_KEY, session);
    return session;
  },

  /**
   * Re-establishes a session on app start, if one is still valid.
   *
   * Replace this with a silent OIDC token refresh when a real identity
   * provider is wired in; the rest of the app is unaffected.
   */
  async restore(): Promise<Session | null> {
    const stored = await secureStore.get<Session | null>(SESSION_KEY, null);
    if (!stored) return null;
    if (new Date(stored.expiresAt).getTime() <= Date.now()) {
      await secureStore.remove(SESSION_KEY);
      return null;
    }
    const remaining = Math.floor((new Date(stored.expiresAt).getTime() - Date.now()) / 1000);
    setAccessToken(`restored.${Date.now()}`, remaining);
    return stored;
  },

  /**
   * Clears every trace of the session.
   *
   * Protected content must not survive logout on a shared device, so the
   * annotation cache and any queued records go too.
   */
  async signOut(): Promise<void> {
    clearAccessToken();
    await secureStore.clearAll();
  },
};
