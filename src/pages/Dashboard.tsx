import { useMemo } from 'react';
import { Link } from 'react-router';
import { differenceInCalendarDays, format, startOfWeek } from 'date-fns';
import { AlarmClock, Briefcase, CalendarClock, FileWarning, Plus, Rocket, Send, Trophy } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useActiveApplications } from '@/hooks/useApplications';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { CompanyAvatar, StatusBadge } from '@/components/applications/bits';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { countByStatus, needsFollowUp, summarize, upcoming } from '@/lib/stats';
import { STAGES, PRE_APPLY } from '@/lib/constants';
import { cn, parseDate, relativeDays, timeAgo } from '@/lib/utils';

export default function Dashboard() {
  const { displayName } = useAuth();
  const { data: apps, isLoading } = useActiveApplications();
  const { openNew } = useApplicationDialogs();

  const s = useMemo(() => summarize(apps), [apps]);
  const counts = useMemo(() => countByStatus(apps), [apps]);
  const agenda = useMemo(() => upcoming(apps, 14).slice(0, 6), [apps]);
  const followUps = useMemo(() => needsFollowUp(apps), [apps]);
  const tailoring = useMemo(
    () => apps.filter((a) => a.resumeCuration === 'pending' && PRE_APPLY.includes(a.status)),
    [apps],
  );
  const thisWeek = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return apps.filter((a) => {
      const d = parseDate(a.appliedDate);
      return d && d >= start && !PRE_APPLY.includes(a.status);
    }).length;
  }, [apps]);
  const recent = useMemo(
    () => [...apps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [apps],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = displayName.split(' ')[0];

  if (isLoading) return <DashboardSkeleton />;

  if (apps.length === 0) {
    return (
      <>
        <PageHeader title={`${greeting}${first ? `, ${first}` : ''}`} />
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="Start tracking your job search"
          description="Add the first role you've applied to — or one you're planning to apply for — and everything else falls into place."
          action={
            <Button onClick={() => openNew()}>
              <Plus className="size-4" /> Add your first application
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${greeting}${first ? `, ${first}` : ''}`}
        description={format(new Date(), 'EEEE, d MMMM')}
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="size-4" /> New application
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Active" value={s.active} hint={`${s.total} total`} />
        <Stat icon={Send} label="Applied this week" value={thisWeek} hint={`${s.submitted} submitted overall`} />
        <Stat icon={CalendarClock} label="Interviewing" value={s.interviews} hint={`${s.responseRate}% response rate`} />
        <Stat icon={Trophy} label="Offers" value={s.offers} hint={s.submitted ? `${s.offerRate}% of applications` : '—'} />
      </div>

      <Card className="mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <Link to="/app/board" className="text-xs font-medium text-accent hover:underline">
            Open board
          </Link>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
          {STAGES.map((st) =>
            counts[st.id] ? (
              <div key={st.id} className={st.dot} style={{ width: `${(counts[st.id] / apps.length) * 100}%` }} title={`${st.label}: ${counts[st.id]}`} />
            ) : null,
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-y-2 sm:grid-cols-6">
          {STAGES.map((st) => (
            <div key={st.id} className="flex items-center gap-2 text-xs">
              <span className={cn('size-2 rounded-full', st.dot)} />
              <span className="text-muted">{st.label}</span>
              <span className="font-semibold">{counts[st.id]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Next 14 days</h2>
            <Link to="/app/calendar" className="text-xs font-medium text-accent hover:underline">
              Calendar
            </Link>
          </div>
          {agenda.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing scheduled. Add interviews from an application's page.</p>
          ) : (
            <ul className="divide-y divide-border">
              {agenda.map((item, i) => {
                const days = differenceInCalendarDays(item.date, new Date());
                return (
                  <li key={i}>
                    <Link to={`/app/applications/${item.app.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2">
                      <div className={cn('w-12 shrink-0 text-center', days <= 1 && 'text-accent')}>
                        <div className="text-[10px] font-semibold uppercase">{format(item.date, 'EEE')}</div>
                        <div className="text-lg font-semibold leading-tight">{format(item.date, 'd')}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {item.app.company} · <span className="font-normal text-muted">{item.label}</span>
                        </div>
                        <div className="truncate text-xs text-subtle">
                          {item.kind === 'interview' ? `Interview at ${format(item.date, 'h:mm a')}` : item.kind === 'deadline' ? 'Deadline' : 'Planned to apply'} ·{' '}
                          {relativeDays(format(item.date, 'yyyy-MM-dd'))}
                        </div>
                      </div>
                      <KindTag kind={item.kind} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Needs attention</h2>
          {followUps.length === 0 && tailoring.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">You're all caught up. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {followUps.slice(0, 4).map((a) => (
                <AttentionRow key={a.id} id={a.id} icon={AlarmClock} company={a.company} text={`Applied ${relativeDays(a.appliedDate)} — consider following up`} />
              ))}
              {tailoring.slice(0, 3).map((a) => (
                <AttentionRow key={a.id} id={a.id} icon={FileWarning} company={a.company} text="Resume still needs tailoring" />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recently updated</h2>
          <Link to="/app/applications" className="text-xs font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {recent.map((a) => (
            <li key={a.id}>
              <Link to={`/app/applications/${a.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2">
                <CompanyAvatar name={a.company} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.company}</div>
                  <div className="truncate text-xs text-muted">{a.title}</div>
                </div>
                <span className="hidden text-xs text-subtle sm:block">{timeAgo(a.updatedAt)}</span>
                <StatusBadge status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Briefcase; label: string; value: number | string; hint: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 truncate text-xs text-subtle">{hint}</div>
    </Card>
  );
}

function KindTag({ kind }: { kind: 'interview' | 'deadline' | 'apply' }) {
  const map = {
    interview: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    deadline: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    apply: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  };
  const label = { interview: 'Interview', deadline: 'Deadline', apply: 'Apply' };
  return <span className={cn('hidden rounded-md px-1.5 py-0.5 text-[11px] font-medium sm:inline', map[kind])}>{label[kind]}</span>;
}

function AttentionRow({ id, icon: Icon, company, text }: { id: string; icon: typeof AlarmClock; company: string; text: string }) {
  return (
    <li>
      <Link to={`/app/applications/${id}`} className="flex items-start gap-3 rounded-lg border border-border p-2.5 hover:bg-surface-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <div className="min-w-0">
          <div className="text-sm font-medium">{company}</div>
          <div className="text-xs text-muted">{text}</div>
        </div>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-28" />
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-64 lg:col-span-3" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    </div>
  );
}
