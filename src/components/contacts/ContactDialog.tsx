import { useMemo, useState, type FormEvent } from 'react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui';
import { useApplications } from '@/hooks/useApplications';
import { useSaveContact } from '@/hooks/useContacts';
import { cn, todayISO } from '@/lib/utils';
import type { Contact, ContactInput } from '@/types';

export const RELATIONSHIPS: { id: Contact['relationship']; label: string; cls: string }[] = [
  { id: 'recruiter', label: 'Recruiter', cls: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' },
  { id: 'referrer', label: 'Referrer', cls: 'bg-violet-500/12 text-violet-700 dark:text-violet-300' },
  { id: 'hiring_manager', label: 'Hiring manager', cls: 'bg-amber-500/12 text-amber-700 dark:text-amber-300' },
  { id: 'interviewer', label: 'Interviewer', cls: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  { id: 'peer', label: 'Peer / alumni', cls: 'bg-pink-500/12 text-pink-700 dark:text-pink-300' },
  { id: 'other', label: 'Other', cls: 'bg-slate-500/12 text-slate-700 dark:text-slate-300' },
];

export const emptyContact = (over: Partial<ContactInput> = {}): ContactInput => ({
  name: '',
  company: '',
  role: '',
  relationship: 'recruiter',
  email: '',
  phone: '',
  linkedin: '',
  notes: '',
  applicationIds: [],
  lastContacted: todayISO(),
  nextFollowUp: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  ...over,
});

export function ContactDialog({
  open,
  onClose,
  contact,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
  initial?: Partial<ContactInput>;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={contact ? `Edit ${contact.name}` : 'New contact'} size="lg">
      {open && <ContactForm key={contact?.id ?? 'new'} contact={contact} initial={initial} onDone={onClose} />}
    </Dialog>
  );
}

function ContactForm({ contact, initial, onDone }: { contact?: Contact | null; initial?: Partial<ContactInput>; onDone: () => void }) {
  const [v, setV] = useState<ContactInput>(() => (contact ? { ...contact } : emptyContact(initial)));
  const [error, setError] = useState('');
  const save = useSaveContact();
  const { data: apps = [] } = useApplications();
  const set = <K extends keyof ContactInput>(k: K, value: ContactInput[K]) => setV((p) => ({ ...p, [k]: value }));

  // Applications at the same company first
  const options = useMemo(() => {
    const company = v.company.trim().toLowerCase();
    return [...apps]
      .filter((a) => !a.archived || v.applicationIds.includes(a.id))
      .sort((a, b) => {
        const am = company && a.company.toLowerCase().includes(company) ? 0 : 1;
        const bm = company && b.company.toLowerCase().includes(company) ? 0 : 1;
        return am - bm || a.company.localeCompare(b.company);
      });
  }, [apps, v.company, v.applicationIds]);

  const followUpIn = (days: number) => set('nextFollowUp', format(addDays(new Date(), days), 'yyyy-MM-dd'));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.name.trim()) return setError('Name is required');
    await save.mutateAsync({ id: contact?.id, input: v });
    toast.success(contact ? 'Contact saved' : `Added ${v.name}`);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" error={error}>
          {(id) => <Input id={id} autoFocus value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="Priya Raman" />}
        </Field>
        <Field label="Relationship">
          {(id) => (
            <Select id={id} value={v.relationship} onChange={(e) => set('relationship', e.target.value as Contact['relationship'])}>
              {RELATIONSHIPS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Company">{(id) => <Input id={id} value={v.company} onChange={(e) => set('company', e.target.value)} />}</Field>
        <Field label="Their role">{(id) => <Input id={id} value={v.role} onChange={(e) => set('role', e.target.value)} />}</Field>
        <Field label="Email">{(id) => <Input id={id} type="email" value={v.email} onChange={(e) => set('email', e.target.value)} />}</Field>
        <Field label="Phone / WhatsApp">{(id) => <Input id={id} type="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} />}</Field>
        <Field label="LinkedIn URL" className="sm:col-span-2">
          {(id) => <Input id={id} type="url" value={v.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://www.linkedin.com/in/…" />}
        </Field>
        <Field label="Last contacted">
          {(id) => <Input id={id} type="date" value={v.lastContacted ?? ''} onChange={(e) => set('lastContacted', e.target.value || null)} />}
        </Field>
        <Field
          label="Next follow-up"
          hint={
            <span className="flex gap-1.5">
              {[3, 7, 14].map((d) => (
                <button key={d} type="button" onClick={() => followUpIn(d)} className="rounded-md bg-fg/5 px-1.5 py-0.5 hover:bg-fg/10">
                  +{d === 7 ? '1w' : d === 14 ? '2w' : `${d}d`}
                </button>
              ))}
              <button type="button" onClick={() => set('nextFollowUp', null)} className="rounded-md bg-fg/5 px-1.5 py-0.5 hover:bg-fg/10">
                None
              </button>
            </span>
          }
        >
          {(id) => <Input id={id} type="date" value={v.nextFollowUp ?? ''} onChange={(e) => set('nextFollowUp', e.target.value || null)} />}
        </Field>
      </div>

      {options.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-muted">Linked applications</legend>
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
            {options.map((a) => {
              const on = v.applicationIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('applicationIds', on ? v.applicationIds.filter((x) => x !== a.id) : [...v.applicationIds, a.id])}
                  className={cn(
                    'rounded-lg border px-2 py-1 text-xs transition',
                    on ? 'border-accent bg-accent-soft text-accent' : 'border-border/70 text-muted hover:text-fg',
                  )}
                >
                  {a.company} · {a.title}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <Field label="Notes">
        {(id) => <Textarea id={id} value={v.notes} onChange={(e) => set('notes', e.target.value)} placeholder="How you met, what you discussed…" />}
      </Field>

      <div className="sticky bottom-0 -mx-5 -mb-4 flex justify-end gap-2 border-t border-border/60 bg-surface/60 px-5 py-3 backdrop-blur">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {contact ? 'Save' : 'Add contact'}
        </Button>
      </div>
    </form>
  );
}
