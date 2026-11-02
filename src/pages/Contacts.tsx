import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { toast } from 'sonner';
import { BellRing, Check, Link2, Mail, MoreHorizontal, Phone, Plus, Search, Users } from 'lucide-react';
import { useContacts, useDeleteContact, useSaveContact } from '@/hooks/useContacts';
import { useApplications } from '@/hooks/useApplications';
import { ContactDialog, RELATIONSHIPS } from '@/components/contacts/ContactDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ConfirmDialog, EmptyState, Input, Menu, Select, Skeleton, SpotlightCard } from '@/components/ui';
import { cn, formatDate, initials, parseDate, safeUrl, timeAgo, todayISO } from '@/lib/utils';
import type { Contact } from '@/types';

export default function Contacts() {
  const { data: contacts = [], isLoading } = useContacts();
  const { data: apps = [] } = useApplications();
  const [q, setQ] = useState('');
  const [rel, setRel] = useState('');
  const [editing, setEditing] = useState<Contact | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const remove = useDeleteContact();

  const appById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const today = todayISO();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        (!rel || c.relationship === rel) &&
        (!term || `${c.name} ${c.company} ${c.role} ${c.email} ${c.notes}`.toLowerCase().includes(term)),
    );
  }, [contacts, q, rel]);

  const due = filtered.filter((c) => c.nextFollowUp && c.nextFollowUp <= today).sort((a, b) => a.nextFollowUp!.localeCompare(b.nextFollowUp!));
  const rest = filtered.filter((c) => !due.includes(c));

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Recruiters, referrers and hiring managers — and when to follow up."
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" /> Add contact
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, notes…" className="pl-9" aria-label="Search contacts" />
        </div>
        <Select value={rel} onChange={(e) => setRel(e.target.value)} aria-label="Filter by relationship" className="sm:w-48">
          <option value="">Everyone</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Keep your network in one place"
          description="Add the recruiters, referrers and hiring managers you talk to. Set a follow-up date and you'll get reminded."
          action={
            <Button onClick={() => setEditing(null)}>
              <Plus className="size-4" /> Add your first contact
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {due.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <BellRing className="size-4 text-amber-500" /> Follow up now
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">{due.length}</span>
              </h2>
              <Grid contacts={due} appById={appById} onEdit={setEditing} onDelete={setDeleting} />
            </section>
          )}
          <section>
            {due.length > 0 && <h2 className="mb-3 text-sm font-semibold">Everyone else</h2>}
            {rest.length ? (
              <Grid contacts={rest} appById={appById} onEdit={setEditing} onDelete={setDeleting} />
            ) : (
              <p className="text-sm text-muted">No other contacts match.</p>
            )}
          </section>
        </div>
      )}

      <ContactDialog open={editing !== undefined} contact={editing} onClose={() => setEditing(undefined)} />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="This removes the contact and their notes. Linked applications are not affected."
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
          toast.success('Contact deleted');
        }}
      />
    </>
  );
}

function Grid({
  contacts,
  appById,
  onEdit,
  onDelete,
}: {
  contacts: Contact[];
  appById: Map<string, { id: string; company: string; title: string }>;
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((c, i) => (
        <div key={c.id} className="animate-enter" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
          <ContactCard contact={c} appById={appById} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} />
        </div>
      ))}
    </div>
  );
}

function ContactCard({
  contact: c,
  appById,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  appById: Map<string, { id: string; company: string; title: string }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const save = useSaveContact();
  const rel = RELATIONSHIPS.find((r) => r.id === c.relationship) ?? RELATIONSHIPS[5];
  const followUp = parseDate(c.nextFollowUp);
  const days = followUp ? differenceInCalendarDays(followUp, new Date()) : null;
  const linkedin = safeUrl(c.linkedin);

  const markContacted = () => {
    save.mutate({
      id: c.id,
      input: { lastContacted: todayISO(), nextFollowUp: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
    });
    toast.success(`Logged contact with ${c.name} — next follow-up in a week`);
  };

  return (
    <SpotlightCard className="flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="bg-gradient-accent grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-semibold text-white">
          {initials(c.name)}
        </div>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onEdit} className="block max-w-full truncate text-left font-semibold hover:text-accent">
            {c.name}
          </button>
          <p className="truncate text-xs text-muted">{[c.role, c.company].filter(Boolean).join(' · ') || '—'}</p>
          <span className={cn('mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium', rel.cls)}>{rel.label}</span>
        </div>
        <Menu
          trigger={(p) => (
            <Button {...p} variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          )}
          items={[
            { label: 'Edit', onSelect: onEdit },
            { label: 'Delete', danger: true, onSelect: onDelete },
          ]}
        />
      </div>

      {c.applicationIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.applicationIds
            .map((id) => appById.get(id))
            .filter(Boolean)
            .slice(0, 3)
            .map((a) => (
              <Link key={a!.id} to={`/app/applications/${a!.id}`} className="truncate rounded-md bg-fg/5 px-1.5 py-0.5 text-[11px] text-muted hover:text-fg">
                {a!.company} · {a!.title}
              </Link>
            ))}
        </div>
      )}

      {c.notes && <p className="mt-3 line-clamp-2 text-xs text-muted">{c.notes}</p>}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-subtle">{c.lastContacted ? `Talked ${timeAgo(c.lastContacted)}` : 'Not contacted yet'}</span>
          {days !== null && (
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 font-medium',
                days < 0
                  ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300'
                  : days === 0
                    ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                    : 'bg-fg/5 text-muted',
              )}
            >
              {days < 0 ? `Follow-up ${-days}d overdue` : days === 0 ? 'Follow up today' : `Follow up ${formatDate(c.nextFollowUp, 'd MMM')}`}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1 border-t border-border/50 pt-3">
          {c.email && (
            <a href={`mailto:${c.email}`} aria-label={`Email ${c.name}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg">
              <Mail className="size-4" />
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/\s/g, '')}`} aria-label={`Call ${c.name}`} className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg">
              <Phone className="size-4" />
            </a>
          )}
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="rounded-lg p-2 text-muted hover:bg-fg/5 hover:text-fg">
              <Link2 className="size-4" />
            </a>
          )}
          <Button size="sm" variant="secondary" className="ml-auto" onClick={markContacted}>
            <Check className="size-3.5" /> Contacted today
          </Button>
        </div>
      </div>
    </SpotlightCard>
  );
}
