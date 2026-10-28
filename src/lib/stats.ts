import { addDays, differenceInCalendarDays, format, startOfWeek, subWeeks } from 'date-fns';
import type { Application, Interview, Status } from '@/types';
import { annualize, convert } from './currency';
import { parseDate } from './utils';
import { PRE_APPLY } from './constants';

export const isSubmitted = (a: Application) => !PRE_APPLY.includes(a.status);

export interface Summary {
  total: number;
  active: number;
  submitted: number;
  interviews: number;
  offers: number;
  rejected: number;
  /** % of submitted applications that reached an interview or beyond */
  responseRate: number;
  /** % of submitted applications that became offers */
  offerRate: number;
}

export function summarize(apps: Application[]): Summary {
  const submitted = apps.filter(isSubmitted);
  const progressed = submitted.filter((a) => a.status === 'interviewing' || a.status === 'offer' || a.interviews.length > 0);
  const offers = apps.filter((a) => a.status === 'offer').length;
  const pct = (n: number) => (submitted.length ? Math.round((n / submitted.length) * 100) : 0);
  return {
    total: apps.length,
    active: apps.filter((a) => a.status !== 'rejected' && a.status !== 'offer').length,
    submitted: submitted.length,
    interviews: apps.filter((a) => a.status === 'interviewing').length,
    offers,
    rejected: apps.filter((a) => a.status === 'rejected').length,
    responseRate: pct(progressed.length),
    offerRate: pct(offers),
  };
}

export function countByStatus(apps: Application[]): Record<Status, number> {
  const out: Record<Status, number> = { wishlist: 0, referral: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0 };
  for (const a of apps) out[a.status]++;
  return out;
}

/** Applications submitted per week for the last `weeks` weeks (oldest first). */
export function weeklyActivity(apps: Application[], weeks = 8, now = new Date()) {
  const start = startOfWeek(subWeeks(now, weeks - 1), { weekStartsOn: 1 });
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    week: format(addDays(start, i * 7), 'd MMM'),
    count: 0,
  }));
  for (const a of apps) {
    const d = parseDate(a.appliedDate);
    if (!d || !isSubmitted(a)) continue;
    const idx = Math.floor(differenceInCalendarDays(d, start) / 7);
    if (idx >= 0 && idx < weeks) buckets[idx].count++;
  }
  return buckets;
}

export function bySource(apps: Application[]) {
  const map = new Map<string, { source: string; total: number; progressed: number }>();
  for (const a of apps.filter(isSubmitted)) {
    const s = a.source || 'Unknown';
    const row = map.get(s) ?? { source: s, total: 0, progressed: 0 };
    row.total++;
    if (a.status === 'interviewing' || a.status === 'offer') row.progressed++;
    map.set(s, row);
  }
  return [...map.values()].sort((x, y) => y.total - x.total);
}

export interface UpcomingItem {
  kind: 'interview' | 'deadline' | 'apply';
  date: Date;
  app: Application;
  interview?: Interview;
  label: string;
}

/** Interviews, deadlines and planned apply dates from today up to `days` ahead, soonest first. */
export function upcoming(apps: Application[], days = 14, now = new Date()): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  const inRange = (d: Date | null): d is Date => {
    if (!d) return false;
    const diff = differenceInCalendarDays(d, now);
    return diff >= 0 && diff <= days;
  };
  for (const app of apps) {
    if (app.archived) continue;
    for (const iv of app.interviews) {
      const d = parseDate(iv.date);
      if (!iv.completed && inRange(d)) items.push({ kind: 'interview', date: d, app, interview: iv, label: iv.title || iv.type });
    }
    if (app.status === 'rejected' || app.status === 'offer') continue;
    const dl = parseDate(app.deadline);
    if (inRange(dl)) items.push({ kind: 'deadline', date: dl, app, label: 'Application deadline' });
    const pl = parseDate(app.plannedApplyDate);
    if (PRE_APPLY.includes(app.status) && inRange(pl)) items.push({ kind: 'apply', date: pl, app, label: 'Planned apply date' });
  }
  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Applied 14+ days ago with no movement — worth a follow-up nudge. */
export function needsFollowUp(apps: Application[], now = new Date()): Application[] {
  return apps.filter((a) => {
    if (a.status !== 'applied' || a.archived) return false;
    const d = parseDate(a.appliedDate);
    return d ? differenceInCalendarDays(now, d) >= 14 : false;
  });
}

/** Annualized midpoint salary in the target currency, or null if not disclosed. */
export function annualMidpoint(app: Application, target: string): number | null {
  if (app.salaryUndisclosed) return null;
  const lo = app.salaryMin ?? app.salaryMax;
  const hi = app.salaryMax ?? app.salaryMin;
  if (!lo || !hi) return null;
  return convert(annualize((lo + hi) / 2, app.salaryPeriod, app.hoursPerWeek), app.currency, target);
}
