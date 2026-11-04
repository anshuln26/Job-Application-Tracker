import { useMemo } from 'react';
import { Link } from 'react-router';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  AlarmClock,
  Briefcase,
  CalendarClock,
  FileWarning,
  Flame,
  Minus,
  Plus,
  Rocket,
  Send,
  Target,
  Trophy,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useActiveApplications } from '@/hooks/useApplications';
import { useContacts } from '@/hooks/useContacts';
import { useSettings } from '@/hooks/useSettings';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { CompanyAvatar, StatusBadge } from '@/components/applications/bits';
import { Button, Card, CountUp, EmptyState, ProgressRing, Skeleton, SpotlightCard } from '@/components/ui';
import { countByStatus, needsFollowUp, summarize, upcoming } from '@/lib/stats';
import { activityHeatmap, goalProgress } from '@/lib/goals';
import { STAGES, PRE_APPLY } from '@/lib/constants';
import { cn, relativeDays, timeAgo, todayISO } from '@/lib/utils';

export default function Dashboard() {
  const { displayName } = useAuth();
  const { data: apps, isLoading } = useActiveApplications();
  const { data: contacts = [] } = useContacts();
  const { settings, update } = useSettings();
  const { openNew } = useApplicationDialogs();

  const s = useMemo(() => summarize(apps), [apps]);
  const counts = useMemo(() => countByStatus(apps), [apps]);
  const agenda = useMemo(() => upcoming(apps, 14).slice(0, 6), [apps]);
  const followUps = useMemo(() => needsFollowUp(apps), [apps]);
  const goal = useMemo(() => goalProgress(apps, settings.weeklyGoal), [apps, settings.weeklyGoal]);
  const heat = useMemo(() => activityHeatmap(apps, 16), [apps]);
  const tailoring = useMemo(() => apps.filter((a) => a.resumeCuration === 'pending' && PRE_APPLY.includes(a.status)), [apps]);
  const today = todayISO();
  const contactsDue = useMemo(() => contacts.filter((c) => c.nextFollowUp && c.nextFollowUp <= today), [contacts, today]);
  const recent = useMemo(() => [...apps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [apps]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const first = displayName.split(' ')[0];

  if (isLoading) return <DashboardSkeleton />;

  const header = (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted">{format(new Date(), 'EEEE, d MMMM')}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting}
          {first && (
            <>
              , <span className="text-gradient">{first}</span>
            </>
          )}
        </h1>
      </div>
      <Button onClick={() => openNew()}>
        <Plus className="size-4" /> New application
      </Button>
    </div>
  );

  if (apps.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="Start tracking your job search"
          description="Add the first role you've applied to — or paste a job link and let ApplyTrack fill it in."
          action={
            <Button onClick={() => openNew()}>
              <Plus className="size-4" /> Add your first application
            </Button>
          }
        />
      </>
    );
  }

  const goalMet = goal.thisWeek >= goal.goal;
  const maxHeat = Math.max(1, ...heat.flat().map((d) => d.count));

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Active" value={s.active} hint={`${s.total} total`} tint="from-blue-500 to-violet-500" />
        <Stat icon={Send} label="Submitted" value={s.submitted} hint={`${goal.thisWeek} this week`} tint="from-sky-500 to-cyan-400" />
        <Stat icon={CalendarClock} label="Interviewing" value={s.interviews} hint={`${s.responseRate}% response rate`} tint="from-amber-500 to-orange-400" />
        <Stat icon={Trophy} label="Offers" value={s.offers} hint={s.submitted ? `${s.offerRate}% of applications` : '—'} tint="from-emerald-500 to-teal-400" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {/* Weekly goal */}
        <Card className={cn('p-5 lg:col-span-2', goalMet && 'ring-gradient')}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-accent" /> Weekly goal
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Lower weekly goal"
                onClick={() => update({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums">{settings.weeklyGoal}</span>
              <button
                type="button"
                aria-label="Raise weekly goal"
                onClick={() => update({ weeklyGoal: Math.min(100, settings.weeklyGoal + 1) })}
                className="grid size-7 place-items-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <ProgressRing value={goal.thisWeek} max={goal.goal} size={112} stroke={10}>
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  <CountUp value={goal.thisWeek} />
                  <span className="text-base font-medium text-subtle">/{goal.goal}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wide text-subtle">this week</div>
              </div>
            </ProgressRing>
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-xl',
                    goal.streak ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30' : 'bg-fg/5 text-subtle',
                  )}
                >
                  <Flame className="size-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">
                    {goal.streak} week{goal.streak === 1 ? '' : 's'} streak
                  </div>
                  <div className="text-xs text-subtle">Best: {goal.best}</div>
                </div>
              </div>
              <p className="text-xs text-muted">
                {goalMet
                  ? '🎉 Goal reached — keep the momentum going!'
                  : `${goal.goal - goal.thisWeek} more to go · ${goal.daysLeft} day${goal.daysLeft === 1 ? '' : 's'} left`}
              </p>
            </div>
          </div>
        </Card>

        {/* Heatmap */}
        <Card className="p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Application activity</h2>
            <span className="text-xs text-subtle">Last 16 weeks</span>
          </div>
          <div className="flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label="Applications submitted per day over the last 16 weeks">
            {heat.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count} application${d.count === 1 ? '' : 's'}`}
                    className={cn('size-3.5 rounded-[4px] sm:size-4', d.future ? 'bg-transparent' : d.count ? '' : 'bg-fg/[0.07]')}
                    style={
                      d.count && !d.future
                        ? { background: `color-mix(in oklab, var(--accent) ${30 + (d.count / maxHeat) * 70}%, transparent)` }
                        : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-fg/[0.07]">
            {STAGES.map((st) =>
              counts[st.id] ? (
                <div key={st.id} className={cn(st.dot, 'transition-all duration-700')} style={{ width: `${(counts[st.id] / apps.length) * 100}%` }} title={`${st.label}: ${counts[st.id]}`} />
              ) : null,
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-y-1.5 sm:grid-cols-6">
            {STAGES.map((st) => (
              <Link key={st.id} to={`/app/applications?status=${st.id}`} className="flex items-center gap-1.5 text-xs hover:text-accent">
                <span className={cn('size-2 rounded-full', st.dot)} />
                <span className="text-muted">{st.short}</span>
                <span className="font-semibold">{counts[st.id]}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Next 14 days</h2>
            <Link to="/app/calendar" className="text-xs font-medium text-accent hover:underline">
              Calendar
            </Link>
          </div>
          {agenda.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing scheduled. Add interviews from an application's page.</p>
          ) : (
            <ul className="space-y-1">
              {agenda.map((item, i) => {
                const days = differenceInCalendarDays(item.date, new Date());
                return (
                  <li key={i}>
                    <Link to={`/app/applications/${item.app.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-fg/5">
                      <div className={cn('glass-soft w-12 shrink-0 rounded-xl py-1 text-center', days <= 1 && 'ring-gradient')}>
                        <div className="text-[10px] font-semibold uppercase text-subtle">{format(item.date, 'EEE')}</div>
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

        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Needs attention</h2>
          {followUps.length === 0 && tailoring.length === 0 && contactsDue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">You're all caught up. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {contactsDue.slice(0, 3).map((c) => (
                <AttentionRow key={c.id} to="/app/contacts" icon={UserRound} title={c.name} text={`Follow up${c.company ? ` · ${c.company}` : ''} — ${relativeDays(c.nextFollowUp)}`} />
              ))}
              {followUps.slice(0, 3).map((a) => (
                <AttentionRow key={a.id} to={`/app/applications/${a.id}`} icon={AlarmClock} title={a.company} text={`Applied ${relativeDays(a.appliedDate)} — consider following up`} />
              ))}
              {tailoring.slice(0, 3).map((a) => (
                <AttentionRow key={a.id} to={`/app/applications/${a.id}`} icon={FileWarning} title={a.company} text="Resume still needs tailoring" />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recently updated</h2>
          <Link to="/app/applications" className="text-xs font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <ul className="space-y-1">
          {recent.map((a) => (
            <li key={a.id}>
              <Link to={`/app/applications/${a.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-fg/5">
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

function Stat({ icon: Icon, label, value, hint, tint }: { icon: typeof Briefcase; label: string; value: number; hint: string; tint: string }) {
  return (
    <SpotlightCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md', tint)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        <CountUp value={value} />
      </div>
      <div className="mt-0.5 truncate text-xs text-subtle">{hint}</div>
    </SpotlightCard>
  );
}

function KindTag({ kind }: { kind: 'interview' | 'deadline' | 'apply' }) {
  const map = {
    interview: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    deadline: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
    apply: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  };
  const label = { interview: 'Interview', deadline: 'Deadline', apply: 'Apply' };
  return <span className={cn('hidden rounded-md px-1.5 py-0.5 text-[11px] font-medium sm:inline', map[kind])}>{label[kind]}</span>;
}

function AttentionRow({ to, icon: Icon, title, text }: { to: string; icon: typeof AlarmClock; title: string; text: string }) {
  return (
    <li>
      <Link to={to} className="glass-soft lift flex items-start gap-3 rounded-xl p-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{title}</div>
          <div className="truncate text-xs text-muted">{text}</div>
        </div>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-52 lg:col-span-2" />
        <Skeleton className="h-52 lg:col-span-3" />
      </div>
    </div>
  );
}
