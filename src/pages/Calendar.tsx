import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useActiveApplications } from '@/hooks/useApplications';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card } from '@/components/ui';
import { download } from '@/lib/csv';
import { APP_NAME } from '@/lib/constants';
import { cn, parseDate } from '@/lib/utils';
import type { Application } from '@/types';

type Kind = 'interview' | 'deadline' | 'apply';
interface CalEvent {
  id: string;
  kind: Kind;
  date: Date;
  allDay: boolean;
  label: string;
  app: Application;
  done?: boolean;
}

const KIND_STYLE: Record<Kind, string> = {
  interview: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  deadline: 'bg-rose-500/15 text-rose-800 dark:text-rose-200',
  apply: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
};
const KIND_DOT: Record<Kind, string> = { interview: 'bg-amber-500', deadline: 'bg-rose-500', apply: 'bg-sky-500' };

function collect(apps: Application[]): CalEvent[] {
  const out: CalEvent[] = [];
  for (const a of apps) {
    for (const iv of a.interviews) {
      const d = parseDate(iv.date);
      if (d) out.push({ id: `${a.id}-${iv.id}`, kind: 'interview', date: d, allDay: false, label: iv.title || iv.type, app: a, done: iv.completed });
    }
    const dl = parseDate(a.deadline);
    if (dl && a.status !== 'rejected') out.push({ id: `${a.id}-dl`, kind: 'deadline', date: dl, allDay: true, label: 'Deadline', app: a });
    const pl = parseDate(a.plannedApplyDate);
    if (pl && (a.status === 'wishlist' || a.status === 'referral'))
      out.push({ id: `${a.id}-pl`, kind: 'apply', date: pl, allDay: true, label: 'Apply', app: a });
  }
  return out.sort((x, y) => x.date.getTime() - y.date.getTime());
}

function toICS(events: CalEvent[]): string {
  const stamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${APP_NAME}//EN`, 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@applytrack`, `DTSTAMP:${stamp(new Date())}`);
    if (e.allDay) lines.push(`DTSTART;VALUE=DATE:${format(e.date, 'yyyyMMdd')}`);
    else lines.push(`DTSTART:${stamp(e.date)}`, `DTEND:${stamp(new Date(e.date.getTime() + 60 * 60 * 1000))}`);
    lines.push(`SUMMARY:${esc(`${e.app.company}: ${e.label}`)}`, `DESCRIPTION:${esc(e.app.title)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default function Calendar() {
  const { data: apps } = useActiveApplications();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(new Date());
  const events = useMemo(() => collect(apps), [apps]);

  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const onDay = (d: Date) => events.filter((e) => isSameDay(e.date, d));
  const selectedEvents = onDay(selected);
  const upcoming = events.filter((e) => e.date.getTime() >= new Date().setHours(0, 0, 0, 0) && !e.done);

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Interviews, deadlines and planned apply dates."
        actions={
          <Button variant="secondary" onClick={() => download('applytrack.ics', toICS(upcoming), 'text/calendar')} disabled={upcoming.length === 0}>
            <Download className="size-4" /> Export to calendar (.ics)
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{format(month, 'MMMM yyyy')}</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMonth(startOfMonth(new Date()));
                  setSelected(new Date());
                }}
              >
                Today
              </Button>
              <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => subMonths(m, 1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-medium uppercase text-subtle">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="pb-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {days.map((d) => {
              const evs = onDay(d);
              const isSel = isSameDay(d, selected);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => setSelected(d)}
                  aria-label={`${format(d, 'd MMMM')}, ${evs.length} events`}
                  aria-pressed={isSel}
                  className={cn(
                    'flex min-h-14 flex-col items-stretch gap-1 bg-surface p-1 text-left sm:min-h-24 sm:p-1.5',
                    !isSameMonth(d, month) && 'bg-surface-2/50 text-subtle',
                    isSel && 'ring-2 ring-inset ring-accent',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 place-items-center self-end rounded-full text-xs sm:self-start',
                      isToday(d) && 'bg-accent font-semibold text-accent-fg',
                    )}
                  >
                    {format(d, 'd')}
                  </span>
                  <div className="hidden flex-col gap-0.5 sm:flex">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn('truncate rounded px-1 py-0.5 text-[10px] font-medium', KIND_STYLE[e.kind], e.done && 'line-through opacity-60')}>
                        {e.app.company}
                      </span>
                    ))}
                    {evs.length > 3 && <span className="px-1 text-[10px] text-subtle">+{evs.length - 3} more</span>}
                  </div>
                  <div className="flex justify-center gap-0.5 sm:hidden">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn('size-1.5 rounded-full', KIND_DOT[e.kind])} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {(['interview', 'deadline', 'apply'] as Kind[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', KIND_DOT[k])} />
                {k === 'interview' ? 'Interview' : k === 'deadline' ? 'Deadline' : 'Planned apply'}
              </span>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">{format(selected, 'EEEE, d MMMM')}</h2>
            <EventList events={selectedEvents} empty="Nothing on this day." />
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Upcoming</h2>
            <EventList events={upcoming.slice(0, 8)} empty="No upcoming events." showDate />
          </Card>
        </div>
      </div>
    </>
  );
}

function EventList({ events, empty, showDate }: { events: CalEvent[]; empty: string; showDate?: boolean }) {
  if (events.length === 0)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <CalendarDays className="size-4" /> {empty}
      </p>
    );
  return (
    <ul className="space-y-1">
      {events.map((e) => (
        <li key={e.id}>
          <Link to={`/app/applications/${e.app.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
            <span className={cn('size-2 shrink-0 rounded-full', KIND_DOT[e.kind])} />
            <div className="min-w-0 flex-1">
              <div className={cn('truncate text-sm font-medium', e.done && 'line-through opacity-60')}>{e.app.company}</div>
              <div className="truncate text-xs text-muted">
                {e.label}
                {showDate && ` · ${format(e.date, 'd MMM')}`}
                {!e.allDay && ` · ${format(e.date, 'h:mm a')}`}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
