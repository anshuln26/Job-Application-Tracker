import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui';
import { emptyApplication } from '@/data/mappers';
import { useCreateApplication, useUpdateApplication } from '@/hooks/useApplications';
import { usePreferences } from '@/hooks/usePreferences';
import type { Application, ApplicationInput, Status } from '@/types';
import { ApplicationForm } from './ApplicationForm';

interface Ctx {
  openNew: (status?: Status) => void;
  openEdit: (app: Application) => void;
}

const DialogContext = createContext<Ctx | null>(null);

export function ApplicationDialogsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ mode: 'new'; status: Status } | { mode: 'edit'; app: Application } | null>(null);
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const navigate = useNavigate();
  const { currency } = usePreferences();

  const openNew = useCallback((status: Status = 'applied') => setState({ mode: 'new', status }), []);
  const openEdit = useCallback((app: Application) => setState({ mode: 'edit', app }), []);
  const close = () => setState(null);

  const onCreate = async (value: ApplicationInput) => {
    const app = await create.mutateAsync({
      ...value,
      timeline: value.appliedDate
        ? [{ id: crypto.randomUUID(), date: value.appliedDate, stage: 'Applied' }]
        : [],
    });
    close();
    toast.success(`Added ${app.company}`, {
      action: { label: 'Open', onClick: () => navigate(`/app/applications/${app.id}`) },
    });
  };

  const onEdit = async (id: string, value: ApplicationInput) => {
    await update.mutateAsync({ id, patch: value });
    close();
    toast.success('Saved');
  };

  return (
    <DialogContext.Provider value={{ openNew, openEdit }}>
      {children}
      <Dialog
        open={state !== null}
        onClose={close}
        title={state?.mode === 'edit' ? `Edit ${state.app.company}` : 'New application'}
        size="lg"
      >
        {state?.mode === 'new' && (
          <ApplicationForm
            key="new"
            initial={emptyApplication({
              status: state.status,
              currency,
              appliedDate: ['wishlist', 'referral'].includes(state.status) ? null : new Date().toISOString().slice(0, 10),
            })}
            submitLabel="Add application"
            saving={create.isPending}
            onSubmit={onCreate}
            onCancel={close}
          />
        )}
        {state?.mode === 'edit' && (
          <ApplicationForm
            key={state.app.id}
            initial={state.app}
            submitLabel="Save changes"
            saving={update.isPending}
            onSubmit={(v) => onEdit(state.app.id, v)}
            onCancel={close}
          />
        )}
      </Dialog>
    </DialogContext.Provider>
  );
}

export function useApplicationDialogs() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useApplicationDialogs must be used inside ApplicationDialogsProvider');
  return ctx;
}
