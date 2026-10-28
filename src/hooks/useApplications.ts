import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import type { Application, ApplicationInput } from '@/types';
import { STAGE_BY_ID } from '@/lib/constants';

const key = (scope: string) => ['applications', scope] as const;

function useScope() {
  const { status, user, repository } = useAuth();
  return { scope: status === 'demo' ? 'demo' : (user?.id ?? 'none'), repository };
}

export function useApplications() {
  const { scope, repository } = useScope();
  return useQuery({
    queryKey: key(scope),
    queryFn: () => repository!.list(),
    enabled: Boolean(repository),
  });
}

/** Active (non-archived) applications plus loading state — what most screens want. */
export function useActiveApplications() {
  const q = useApplications();
  return { ...q, data: (q.data ?? []).filter((a) => !a.archived) };
}

export function useApplication(id: string | undefined) {
  const q = useApplications();
  return { ...q, data: q.data?.find((a) => a.id === id) };
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export function useCreateApplication() {
  const qc = useQueryClient();
  const { scope, repository } = useScope();
  return useMutation({
    mutationFn: (input: ApplicationInput) => repository!.create(input),
    onSuccess: (app) => {
      qc.setQueryData<Application[]>(key(scope), (old) => [app, ...(old ?? [])]);
    },
    onError: (e) => toast.error(`Couldn't save: ${errorMessage(e)}`),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  const { scope, repository } = useScope();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ApplicationInput> }) =>
      repository!.update(id, patch),
    // Optimistic: drag-and-drop and quick edits feel instant
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key(scope) });
      const previous = qc.getQueryData<Application[]>(key(scope));
      qc.setQueryData<Application[]>(key(scope), (old) =>
        old?.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key(scope), ctx.previous);
      toast.error(`Couldn't update: ${errorMessage(e)}`);
    },
    onSuccess: (app) => {
      qc.setQueryData<Application[]>(key(scope), (old) => old?.map((a) => (a.id === app.id ? app : a)));
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  const { scope, repository } = useScope();
  return useMutation({
    mutationFn: (id: string) => repository!.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key(scope) });
      const previous = qc.getQueryData<Application[]>(key(scope));
      qc.setQueryData<Application[]>(key(scope), (old) => old?.filter((a) => a.id !== id));
      return { previous };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key(scope), ctx.previous);
      toast.error(`Couldn't delete: ${errorMessage(e)}`);
    },
  });
}

export function useImportApplications() {
  const qc = useQueryClient();
  const { scope, repository } = useScope();
  return useMutation({
    mutationFn: (inputs: ApplicationInput[]) => repository!.importMany(inputs),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: key(scope) });
      toast.success(`Imported ${n} application${n === 1 ? '' : 's'}`);
    },
    onError: (e) => toast.error(`Import failed: ${errorMessage(e)}`),
  });
}

/** Status changes also append a timeline entry so the history stays accurate. */
export function useMoveApplication() {
  const update = useUpdateApplication();
  return (app: Application, status: Application['status']) => {
    if (app.status === status) return;
    const today = new Date().toISOString().slice(0, 10);
    const patch: Partial<ApplicationInput> = {
      status,
      timeline: [
        ...app.timeline,
        { id: crypto.randomUUID(), date: today, stage: STAGE_BY_ID[status].label },
      ],
    };
    if (status === 'applied' && !app.appliedDate) patch.appliedDate = today;
    update.mutate({ id: app.id, patch });
  };
}
