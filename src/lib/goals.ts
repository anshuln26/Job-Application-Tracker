import { addDays, differenceInCalendarDays, format, startOfWeek, subWeeks } from 'date-fns';
import type { Application } from '@/types';
import { PRE_APPLY } from './constants';
import { parseDate } from './utils';

const weekStart = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

/** Submitted applications counted by the week (Monday) they were applied in. */
function countsByWeek(apps: Application[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of apps) {
    if (PRE_APPLY.includes(a.status)) continue;
    const d = parseDate(a.appliedDate);
    if (!d) continue;
    const key = format(weekStart(d), 'yyyy-MM-dd');
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export interface GoalProgress {
  thisWeek: number;
  goal: number;
  /** Consecutive weeks (including this one once it's met) that hit the goal */
  streak: number;
  best: number;
  daysLeft: number;
}

export function goalProgress(apps: Application[], goal: number, now = new Date()): GoalProgress {
  const counts = countsByWeek(apps);
  const current = weekStart(now);
  const count = (w: Date) => counts.get(format(w, 'yyyy-MM-dd')) ?? 0;
  const thisWeek = count(current);

  // Current streak: last week backwards, plus this week if already reached
  let streak = 0;
  for (let w = subWeeks(current, 1); count(w) >= goal; w = subWeeks(w, 1)) streak++;
  if (thisWeek >= goal) streak++;

  // Best streak over all recorded weeks
  const weeks = [...counts.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of weeks) {
    const w = new Date(`${key}T00:00:00`);
    const hit = (counts.get(key) ?? 0) >= goal;
    const consecutive = prev && differenceInCalendarDays(w, prev) === 7;
    run = hit ? (consecutive ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    prev = hit ? w : null;
  }

  return {
    thisWeek,
    goal,
    streak,
    best: Math.max(best, streak),
    daysLeft: 6 - differenceInCalendarDays(now, current),
  };
}

export interface HeatDay {
  date: string;
  count: number;
  future: boolean;
}

/** Last `weeks` weeks of daily application counts, column per week (Mon → Sun). */
export function activityHeatmap(apps: Application[], weeks = 16, now = new Date()): HeatDay[][] {
  const perDay = new Map<string, number>();
  for (const a of apps) {
    if (PRE_APPLY.includes(a.status) || !a.appliedDate) continue;
    perDay.set(a.appliedDate, (perDay.get(a.appliedDate) ?? 0) + 1);
  }
  const start = subWeeks(weekStart(now), weeks - 1);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, w * 7 + d);
      const key = format(day, 'yyyy-MM-dd');
      return { date: key, count: perDay.get(key) ?? 0, future: day > now };
    }),
  );
}
