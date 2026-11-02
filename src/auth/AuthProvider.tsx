import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  localContacts,
  localRepository,
  localSettings,
  resetDemoData,
  supabaseContacts,
  supabaseRepository,
  supabaseSettings,
  type ContactsRepository,
  type Repository,
  type SettingsRepository,
} from '@/data/repository';

type Status = 'loading' | 'signed-out' | 'signed-in' | 'needs-2fa' | 'demo';

export interface SecondFactor {
  totp: boolean;
  email: boolean;
  satisfied: boolean;
}

interface AuthState {
  status: Status;
  user: User | null;
  session: Session | null;
  /** True after the user opened a password-recovery link and must choose a new password */
  recovering: boolean;
  secondFactor: SecondFactor | null;
  repository: Repository | null;
  contacts: ContactsRepository | null;
  settings: SettingsRepository | null;
  displayName: string;
  enterDemo: () => void;
  signOut: () => Promise<void>;
  clearRecovery: () => void;
  refreshSecondFactor: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_FLAG = 'applytrack:demo';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [secondFactor, setSecondFactor] = useState<SecondFactor | null>(null);
  const [demo, setDemo] = useState(() => {
    try {
      return sessionStorage.getItem(DEMO_FLAG) === '1';
    } catch {
      return false;
    }
  });
  const [recovering, setRecovering] = useState(false);

  const refreshSecondFactor = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('second_factor_status');
    // If the check itself is unavailable, don't lock people out — the database still enforces 2FA.
    setSecondFactor(error || !data ? { totp: false, email: false, satisfied: true } : (data as SecondFactor));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') {
        setSecondFactor(null);
        queryClient.clear();
      }
      if (event === 'MFA_CHALLENGE_VERIFIED') queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  // Re-check the second factor whenever the session (and so its assurance level) changes
  const sessionKey = session ? `${session.user.id}:${session.access_token.slice(-16)}` : null;
  useEffect(() => {
    if (!sessionKey) return;
    let cancelled = false;
    // Syncing with Supabase: the state update happens after the request resolves
    // eslint-disable-next-line react/set-state-in-effect
    refreshSecondFactor().finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sessionKey, refreshSecondFactor]);

  const user = session?.user ?? null;

  const enterDemo = useCallback(() => {
    try {
      sessionStorage.setItem(DEMO_FLAG, '1');
    } catch {
      // private mode — demo just won't survive a reload
    }
    queryClient.clear();
    setDemo(true);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (demo && !user) {
      try {
        sessionStorage.removeItem(DEMO_FLAG);
        resetDemoData();
      } catch {
        // ignore
      }
      setDemo(false);
      queryClient.clear();
      return;
    }
    await supabase?.auth.signOut();
  }, [demo, user, queryClient]);

  const status: Status = loading
    ? 'loading'
    : user
      ? secondFactor === null
        ? 'loading'
        : secondFactor.satisfied
          ? 'signed-in'
          : 'needs-2fa'
      : demo
        ? 'demo'
        : 'signed-out';

  const repos = useMemo(() => {
    if (status === 'signed-in' && user)
      return { repository: supabaseRepository(user.id), contacts: supabaseContacts(user.id), settings: supabaseSettings(user.id) };
    if (status === 'demo') return { repository: localRepository(), contacts: localContacts(), settings: localSettings() };
    return { repository: null, contacts: null, settings: null };
  }, [status, user]);

  const displayName =
    status === 'demo'
      ? 'Demo user'
      : (user?.user_metadata?.full_name as string | undefined) ||
        (user?.user_metadata?.name as string | undefined) ||
        user?.email?.split('@')[0] ||
        '';

  const value: AuthState = {
    status,
    user,
    session,
    recovering,
    secondFactor,
    ...repos,
    displayName,
    enterDemo,
    signOut,
    clearRecovery: () => setRecovering(false),
    refreshSecondFactor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
