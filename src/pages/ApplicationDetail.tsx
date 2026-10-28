import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarPlus,
  Check,
  ExternalLink,
  Link2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApplication, useDeleteApplication, useMoveApplication, useUpdateApplication } from '@/hooks/useApplications';
import { usePreferences } from '@/hooks/usePreferences';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { CompanyAvatar, PriorityLabel, salaryText } from '@/components/applications/bits';
import { Button, Card, ConfirmDialog, Dialog, Field, Input, Menu, Select, Skeleton, Textarea } from '@/components/ui';
import {
  INTERVIEW_TYPES,
  REFERRAL_STATUSES,
  RESUME_CURATION,
  STAGES,
  VISA_STATUSES,
} from '@/lib/constants';
import { annualMidpoint } from '@/lib/stats';
import { formatMoney } from '@/lib/currency';
import { cn, formatDate, parseDate, relativeDays, safeUrl, todayISO } from '@/lib/utils';
import type { Application, Interview, Status, TimelineEvent } from '@/types';

export default function ApplicationDetail() {
  const { id } = useParams();
  const { data: app, isLoading } = useApplication(id);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-lg font-semibold">Application not found</h1>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/app/applications')}>
          Back to applications
        </Button>
      </div>
    );
  }
  return <Detail app={app} />;
}

function Detail({ app }: { app: Application }) {
  const navigate = useNavigate();
  const update = useUpdateApplication();
  const remove = useDeleteApplication();
  const move = useMoveApplication();
  const { openEdit } = useApplicationDialogs();
  const { currency: displayCurrency } = usePreferences();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);

  const patch = (p: Partial<Application>) => update.mutate({ id: app.id, patch: p });
  const posting = safeUrl(app.jobUrl);
  const salary = salaryText(app);
  const annual = annualMidpoint(app, displayCurrency);
  const showConverted = annual && (app.currency !== displayCurrency || app.salaryPeriod !== 'yearly');

  const toggleArchive = () => {
    patch({ archived: !app.archived, archivedAt: app.archived ? null : new Date().toISOString() });
    toast.success(app.archived ? 'Restored' : 'Archived');
  };

  return (
    <>
      <Link to="/app/applications" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Applications
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <CompanyAvatar name={app.company} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{app.title}</h1>
          <p className="mt-0.5 text-muted">
            {app.company}
            {app.location && <> · {app.location}</>} · {app.workType}
          </p>
          {app.archived && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-xs text-muted">
              <Archive className="size-3.5" /> Archived {formatDate(app.archivedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Stage"
            value={app.status}
            onChange={(e) => move(app, e.target.value as Status)}
            className="h-9 w-40"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
          {posting && (
            <a href={posting} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">
                <ExternalLink className="size-4" /> Posting
              </Button>
            </a>
          )}
          <Button variant="secondary" onClick={() => openEdit(app)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Menu
            trigger={(p) => (
              <Button {...p} variant="secondary" size="icon" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            )}
            items={[
              {
                label: app.archived ? 'Restore' : 'Archive',
                icon: app.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />,
                onSelect: toggleArchive,
              },
              { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, onSelect: () => setConfirmDelete(true) },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
              <Item label={app.appliedDate ? 'Applied' : 'Plan to apply'}>
                {app.appliedDate ? formatDate(app.appliedDate) : app.plannedApplyDate ? `${formatDate(app.plannedApplyDate)} (${relativeDays(app.plannedApplyDate)})` : '—'}
              </Item>
              <Item label="Deadline">{app.deadline ? `${formatDate(app.deadline)} (${relativeDays(app.deadline)})` : '—'}</Item>
              <Item label="Priority">
                <PriorityLabel priority={app.priority} />
              </Item>
              <Item label="Compensation">
                {salary ?? '—'}
                {showConverted && <div className="text-xs text-subtle">≈ {formatMoney(annual, displayCurrency)}/yr</div>}
              </Item>
              <Item label="Source">{app.source || '—'}</Item>
              <Item label="Visa">{VISA_STATUSES.find((v) => v.id === app.visaStatus)?.label}</Item>
              <Item label="Resume">{app.resumeVersion || '—'}</Item>
              <Item label="Tailoring">
                <span className={cn(app.resumeCuration === 'pending' && 'font-medium text-amber-600 dark:text-amber-400')}>
                  {RESUME_CURATION.find((r) => r.id === app.resumeCuration)?.label}
                </span>
              </Item>
            </dl>
            {app.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border pt-4">
                {app.tags.map((t) => (
                  <Link key={t} to={`/app/applications?q=${encodeURIComponent(t)}`} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted hover:text-fg">
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Notes app={app} onSave={(notes) => patch({ notes })} />

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Interviews</h2>
              <Button size="sm" variant="secondary" onClick={() => setInterviewOpen(true)}>
                <CalendarPlus className="size-3.5" /> Schedule
              </Button>
            </div>
            <Interviews app={app} onChange={(interviews) => patch({ interviews })} />
          </Card>
        </div>

        <div className="space-y-4">
          {(app.referralStatus !== 'none' || app.referralContact) && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Referral</h2>
              <Select
                aria-label="Referral status"
                value={app.referralStatus}
                onChange={(e) => patch({ referralStatus: e.target.value as Application['referralStatus'] })}
                className="mb-3"
              >
                {REFERRAL_STATUSES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
              {app.referralContact && (
                <div className="text-sm">
                  <div className="font-medium">{app.referralContact}</div>
                  {app.referralRole && <div className="text-muted">{app.referralRole}</div>}
                  {app.referralDate && <div className="mt-1 text-xs text-subtle">Reached out {formatDate(app.referralDate)}</div>}
                  {safeUrl(app.referralLinkedin) && (
                    <a href={safeUrl(app.referralLinkedin)!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
                      <Link2 className="size-3.5" /> LinkedIn profile
                    </a>
                  )}
                </div>
              )}
            </Card>
          )}

          {(app.contactName || app.contactEmail) && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Contact</h2>
              <div className="text-sm font-medium">{app.contactName || '—'}</div>
              {app.contactEmail && (
                <a href={`mailto:${app.contactEmail}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                  <Mail className="size-3.5" /> {app.contactEmail}
                </a>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Timeline</h2>
            <Timeline app={app} onChange={(timeline) => patch({ timeline })} />
          </Card>
        </div>
      </div>

      <InterviewDialog
        open={interviewOpen}
        onClose={() => setInterviewOpen(false)}
        onSave={(iv) => {
          const p: Partial<Application> = { interviews: [...app.interviews, iv] };
          if (app.status === 'applied' || app.status === 'wishlist' || app.status === 'referral') p.status = 'interviewing';
          patch(p);
          setInterviewOpen(false);
          toast.success('Interview scheduled');
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${app.company}?`}
        description="This permanently removes the application with its timeline and interviews."
        onConfirm={() => {
          remove.mutate(app.id);
          navigate('/app/applications', { replace: true });
          toast.success('Deleted');
        }}
      />
    </>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-0.5 truncate">{children}</dd>
    </div>
  );
}

function Notes({ app, onSave }: { app: Application; onSave: (notes: string) => void }) {
  const [value, setValue] = useState(app.notes);
  const [synced, setSynced] = useState(app.notes);
  // Pick up changes saved elsewhere (e.g. the edit dialog)
  if (synced !== app.notes) {
    setSynced(app.notes);
    setValue(app.notes);
  }
  const dirty = value !== app.notes;
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notes</h2>
        {dirty && <span className="text-xs text-subtle">Unsaved — saves when you click away</span>}
      </div>
      <Textarea
        aria-label="Notes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => dirty && onSave(value)}
        placeholder="Interview prep, questions to ask, salary expectations…"
        className="min-h-32 border-transparent bg-surface-2/60 shadow-none focus:bg-surface"
      />
    </Card>
  );
}

function Interviews({ app, onChange }: { app: Application; onChange: (list: Interview[]) => void }) {
  if (app.interviews.length === 0) {
    return <p className="text-sm text-muted">No interviews yet. Schedule one to see it on your calendar.</p>;
  }
  const sorted = [...app.interviews].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ul className="space-y-2">
      {sorted.map((iv) => {
        const d = parseDate(iv.date);
        const past = d ? d.getTime() < Date.now() : false;
        return (
          <li key={iv.id} className={cn('flex items-center gap-3 rounded-lg border border-border p-3', iv.completed && 'opacity-60')}>
            <button
              type="button"
              aria-label={iv.completed ? 'Mark as not done' : 'Mark as done'}
              onClick={() => onChange(app.interviews.map((x) => (x.id === iv.id ? { ...x, completed: !x.completed } : x)))}
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full border',
                iv.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border hover:border-accent',
              )}
            >
              {iv.completed && <Check className="size-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={cn('truncate text-sm font-medium', iv.completed && 'line-through')}>{iv.title || iv.type}</div>
              <div className="text-xs text-muted">
                {iv.type} · {d ? format(d, "EEE d MMM, h:mm a") : iv.date}
                {!iv.completed && past && <span className="ml-1 text-amber-600 dark:text-amber-400">· mark as done?</span>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove interview"
              onClick={() => onChange(app.interviews.filter((x) => x.id !== iv.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function InterviewDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (iv: Interview) => void }) {
  const [type, setType] = useState(INTERVIEW_TYPES[0]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('10:00');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ id: crypto.randomUUID(), type, title: title.trim(), date: `${date}T${time}`, completed: false });
    setTitle('');
  };

  return (
    <Dialog open={open} onClose={onClose} title="Schedule interview" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Type">
          {(id) => (
            <Select id={id} value={type} onChange={(e) => setType(e.target.value)}>
              {INTERVIEW_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Title (optional)">
          {(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DSA round with team lead" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">{(id) => <Input id={id} type="date" required value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Time">{(id) => <Input id={id} type="time" required value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Schedule</Button>
        </div>
      </form>
    </Dialog>
  );
}

function Timeline({ app, onChange }: { app: Application; onChange: (list: TimelineEvent[]) => void }) {
  const [stage, setStage] = useState('');
  const [date, setDate] = useState(todayISO());
  const events = [...app.timeline].sort((a, b) => b.date.localeCompare(a.date));

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!stage.trim()) return;
    onChange([...app.timeline, { id: crypto.randomUUID(), stage: stage.trim(), date }]);
    setStage('');
  };

  return (
    <>
      <form onSubmit={add} className="mb-4 flex gap-2">
        <Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Add an update…" aria-label="Timeline update" className="h-8 text-xs" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="h-8 w-32 text-xs" />
        <Button type="submit" size="sm" variant="secondary" aria-label="Add update" disabled={!stage.trim()}>
          <Plus className="size-3.5" />
        </Button>
      </form>
      {events.length === 0 ? (
        <p className="text-sm text-muted">No updates yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-4">
          {events.map((ev) => (
            <li key={ev.id} className="group relative">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-surface bg-accent" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{ev.stage}</div>
                  <div className="text-xs text-subtle">{formatDate(ev.date)}</div>
                  {ev.notes && <p className="mt-1 text-xs text-muted">{ev.notes}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Remove update"
                  onClick={() => onChange(app.timeline.filter((x) => x.id !== ev.id))}
                  className="rounded p-1 text-subtle opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
