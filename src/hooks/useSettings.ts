import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { DEFAULT_SETTINGS, type EditableSettings } from '@/data/repository';
import type { UserSettings } from '@/types';

export function useSettings() {
  const { settings, status, user } = useAuth();
  const key = ['settings', status === 'demo' ? 'demo' : (user?.id ?? 'none')];
  const qc = useQueryClient();
  const query = useQuery({ queryKey: key, queryFn: () => settings!.get(), enabled: Boolean(settings) });
  const mutation = useMutation({
    mutationFn: (patch: EditableSettings) => settings!.update(patch),
    onMutate: (patch) => {
      const previous = qc.getQueryData<UserSettings>(key);
      qc.setQueryData<UserSettings>(key, (old) => ({ ...(old ?? DEFAULT_SETTINGS), ...patch }));
      return { previous };
    },
    onSuccess: (saved) => qc.setQueryData(key, saved),
    onError: (e, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(`Couldn't save settings: ${e instanceof Error ? e.message : 'unknown error'}`);
    },
  });
  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    update: mutation.mutate,
    refresh: () => qc.invalidateQueries({ queryKey: key }),
  };
}

export interface ServerStatus {
  email: boolean;
  push: boolean;
  vapidPublicKey: string | null;
}

/** Which server features are configured (email sending, push). */
export function useServerStatus() {
  return useQuery<ServerStatus>({
    queryKey: ['server-status'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error();
        return (await res.json()) as ServerStatus;
      } catch {
        return { email: false, push: false, vapidPublicKey: null };
      }
    },
    staleTime: 5 * 60_000,
  });
}

/** Authenticated call to one of our /api routes. */
export async function apiPost<T>(path: string, accessToken: string | undefined, body: unknown = {}): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}
