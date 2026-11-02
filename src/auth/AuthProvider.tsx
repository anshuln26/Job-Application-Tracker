import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { localRepository, resetDemoData, supabaseRepository, type Repository } from '@/data/repository';

type Status = 'loading' | 'signed-out' | 'signed-in' | 'demo';

interface AuthState {
  status: Status;
  user: User | null;
  /** True after the user opened a password-recovery link and must choose a new password */
  recovering: boolean;
  repository: Repository | null;
  displayName: string;
  enterDemo: () => void;
  signOut: () => Promise<void>;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const DEMO_FLAG = 'applytrack:demo';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [demo, setDemo] = useState(() => {
    try {
      return sessionStorage.getItem(DEMO_FLAG) === '1';
    } catch {
      return false;
    }
  });
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

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
    if (demo) {
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
  }, [demo, queryClient]);

  const status: Status = loading ? 'loading' : user ? 'signed-in' : demo ? 'demo' : 'signed-out';

  const repository = useMemo(() => {
    if (status === 'signed-in' && user) return supabaseRepository(user.id);
    if (status === 'demo') return localRepository();
    return null;
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
    recovering,
    repository,
    displayName,
    enterDemo,
    signOut,
    clearRecovery: () => setRecovering(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
