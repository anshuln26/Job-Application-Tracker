import type { Application, ApplicationInput, Status } from '@/types';
import { emptyApplication, normalizeWorkType } from '@/data/mappers';
import { normalizeCurrency } from './currency';
import { STAGES } from './constants';

const COLUMNS: { key: keyof Application; header: string }[] = [
  { key: 'company', header: 'Company' },
  { key: 'title', header: 'Role' },
  { key: 'status', header: 'Status' },
  { key: 'location', header: 'Location' },
  { key: 'workType', header: 'Work type' },
  { key: 'source', header: 'Source' },
  { key: 'appliedDate', header: 'Applied' },
  { key: 'deadline', header: 'Deadline' },
  { key: 'salaryMin', header: 'Salary min' },
  { key: 'salaryMax', header: 'Salary max' },
  { key: 'currency', header: 'Currency' },
  { key: 'salaryPeriod', header: 'Pay period' },
  { key: 'jobUrl', header: 'Job URL' },
  { key: 'contactName', header: 'Contact' },
  { key: 'contactEmail', header: 'Contact email' },
  { key: 'tags', header: 'Tags' },
  { key: 'notes', header: 'Notes' },
];

const escape = (v: unknown): string => {
  const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
  // Prefix formulas so spreadsheets don't execute them
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCSV(apps: Application[]): string {
  const lines = [COLUMNS.map((c) => c.header).join(',')];
  for (const a of apps) lines.push(COLUMNS.map((c) => escape(a[c.key])).join(','));
  return lines.join('\n');
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const STATUS_ALIASES: Record<string, Status> = Object.fromEntries(
  STAGES.flatMap((s) => [
    [s.id, s.id],
    [s.label.toLowerCase(), s.id],
  ]),
);

/** Import rows from our own CSV export (or any CSV with Company / Role columns). */
export function fromCSV(text: string): ApplicationInput[] {
  const [header, ...rows] = parseCSV(text);
  if (!header) return [];
  const idx = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const col = Object.fromEntries(COLUMNS.map((c) => [c.key, idx(c.header)])) as Record<keyof Application, number>;
  if (col.title < 0) col.title = idx('Title');
  if (col.company < 0 || col.title < 0) throw new Error('CSV needs at least "Company" and "Role" columns');

  const get = (r: string[], k: keyof Application) => (col[k] >= 0 ? (r[col[k]] ?? '').trim().replace(/^'/, '') : '');
  const n = (s: string) => (s ? Number(s.replace(/[^\d.]/g, '')) || null : null);

  return rows
    .filter((r) => get(r, 'company') && get(r, 'title'))
    .map((r) =>
      emptyApplication({
        company: get(r, 'company'),
        title: get(r, 'title'),
        status: STATUS_ALIASES[get(r, 'status').toLowerCase()] ?? 'applied',
        location: get(r, 'location'),
        workType: normalizeWorkType(get(r, 'workType')),
        source: get(r, 'source'),
        appliedDate: get(r, 'appliedDate') || null,
        deadline: get(r, 'deadline') || null,
        salaryMin: n(get(r, 'salaryMin')),
        salaryMax: n(get(r, 'salaryMax')),
        currency: normalizeCurrency(get(r, 'currency') || 'INR'),
        salaryPeriod: (['yearly', 'monthly', 'hourly'].includes(get(r, 'salaryPeriod'))
          ? get(r, 'salaryPeriod')
          : 'yearly') as ApplicationInput['salaryPeriod'],
        jobUrl: get(r, 'jobUrl'),
        contactName: get(r, 'contactName'),
        contactEmail: get(r, 'contactEmail'),
        tags: get(r, 'tags')
          .split(/[;|]/)
          .map((t) => t.trim())
          .filter(Boolean),
        notes: get(r, 'notes'),
      }),
    );
}

export function download(filename: string, content: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
