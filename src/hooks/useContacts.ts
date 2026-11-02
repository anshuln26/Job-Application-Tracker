import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import type { Contact, ContactInput } from '@/types';

const useKey = () => {
  const { status, user } = useAuth();
  return ['contacts', status === 'demo' ? 'demo' : (user?.id ?? 'none')] as const;
};

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export function useContacts() {
  const { contacts } = useAuth();
  const key = useKey();
  return useQuery({ queryKey: key, queryFn: () => contacts!.list(), enabled: Boolean(contacts) });
}

export function useSaveContact() {
  const { contacts } = useAuth();
  const qc = useQueryClient();
  const key = useKey();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Partial<ContactInput> }) =>
      id ? contacts!.update(id, input) : contacts!.create(input as ContactInput),
    onMutate: async ({ id, input }) => {
      if (!id) return;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Contact[]>(key);
      qc.setQueryData<Contact[]>(key, (old) => old?.map((c) => (c.id === id ? { ...c, ...input } : c)));
      return { previous };
    },
    onSuccess: (saved) =>
      qc.setQueryData<Contact[]>(key, (old) => {
        const list = old ?? [];
        return list.some((c) => c.id === saved.id) ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved];
      }),
    onError: (e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(`Couldn't save contact: ${message(e)}`);
    },
  });
}

export function useDeleteContact() {
  const { contacts } = useAuth();
  const qc = useQueryClient();
  const key = useKey();
  return useMutation({
    mutationFn: (id: string) => contacts!.remove(id),
    onSuccess: (_r, id) => qc.setQueryData<Contact[]>(key, (old) => old?.filter((c) => c.id !== id)),
    onError: (e) => toast.error(`Couldn't delete: ${message(e)}`),
  });
}
