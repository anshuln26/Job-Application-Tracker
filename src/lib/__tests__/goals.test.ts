import { describe, expect, it } from 'vitest';
import { activityHeatmap, goalProgress } from '@/lib/goals';
import { emptyApplication } from '@/data/mappers';
import type { Application } from '@/types';

const applied = (date: string, status: Application['status'] = 'applied'): Application => ({
  ...emptyApplication({ company: 'X', title: 'Y', appliedDate: date, status }),
  id: Math.random().toString(36),
  createdAt: '',
  updatedAt: '',
});

// Wednesday 28 Oct 2026; week starts Mon 26 Oct
const now = new Date('2026-10-28T12:00:00');
const many = (date: string, n: number) => Array.from({ length: n }, () => applied(date));

describe('weekly goal', () => {
  it('counts this week and the streak of previous weeks', () => {
    const apps = [...many('2026-10-26', 2), ...many('2026-10-20', 3), ...many('2026-10-13', 3), ...many('2026-09-29', 5)];
    const p = goalProgress(apps, 3, now);
    expect(p.thisWeek).toBe(2);
    expect(p.streak).toBe(2); // weeks of 19 Oct and 12 Oct; 5 Oct missed
    expect(p.best).toBe(2);
    expect(p.daysLeft).toBe(4);
  });

  it('includes the current week once the goal is met and ignores wishlist items', () => {
    const apps = [...many('2026-10-27', 3), applied('2026-10-27', 'wishlist'), ...many('2026-10-19', 3)];
    expect(goalProgress(apps, 3, now).streak).toBe(2);
    expect(goalProgress(apps, 4, now).thisWeek).toBe(3);
  });
});

describe('activity heatmap', () => {
  it('builds week columns ending this week', () => {
    const grid = activityHeatmap([...many('2026-10-27', 2), applied('2026-10-01')], 5, now);
    expect(grid).toHaveLength(5);
    expect(grid[4][1]).toEqual({ date: '2026-10-27', count: 2, future: false });
    expect(grid[4][6].future).toBe(true);
    expect(grid.flat().reduce((s, d) => s + d.count, 0)).toBe(3);
  });
});
