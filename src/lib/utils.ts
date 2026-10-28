import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined, pattern = 'd MMM yyyy'): string {
  const d = parseDate(value);
  return d ? format(d, pattern) : '—';
}

export function relativeDays(value: string | null | undefined, now = new Date()): string {
  const d = parseDate(value);
  if (!d) return '';
  const diff = differenceInCalendarDays(d, now);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export function timeAgo(value: string | null | undefined): string {
  const d = parseDate(value);
  return d ? formatDistanceToNowStrict(d, { addSuffix: true }) : '';
}

export function safeUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  return (
    name
      .split(/[\s/()&-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

/** Stable pastel colour per company name */
export function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}
