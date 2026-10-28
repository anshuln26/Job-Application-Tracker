import { describe, expect, it } from 'vitest';
import { annualize, convert, formatMoney, formatRange, normalizeCurrency } from '@/lib/currency';
import { fromCSV, parseCSV, toCSV } from '@/lib/csv';
import { annualMidpoint, needsFollowUp, summarize, upcoming, weeklyActivity } from '@/lib/stats';
import { emptyApplication, fromRow, normalizeWorkType, splitLegacyNotes, toRow, type ApplicationRow } from '@/data/mappers';
import { localRepository } from '@/data/repository';
import type { Application } from '@/types';

const app = (over: Partial<Application> = {}): Application => ({
  ...emptyApplication({ company: 'Acme', title: 'SWE' }),
  id: Math.random().toString(36).slice(2),
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('currency', () => {
  it('normalizes symbols and unknown codes', () => {
    expect(normalizeCurrency('$')).toBe('USD');
    expect(normalizeCurrency('₹')).toBe('INR');
    expect(normalizeCurrency('gbp')).toBe('GBP');
    expect(normalizeCurrency(null)).toBe('INR');
    expect(normalizeCurrency('XYZ')).toBe('USD');
  });

  it('converts through USD', () => {
    expect(convert(84.5, 'INR', 'USD')).toBeCloseTo(1);
    expect(convert(1, 'USD', 'INR')).toBeCloseTo(84.5);
  });

  it('annualizes monthly and hourly pay', () => {
    expect(annualize(50000, 'monthly')).toBe(600000);
    expect(annualize(20, 'hourly', 10)).toBe(20 * 10 * 52);
    expect(annualize(100, 'yearly')).toBe(100);
  });

  it('formats INR in lakhs and crores', () => {
    expect(formatMoney(1250000, 'INR')).toBe('₹12.5L');
    expect(formatMoney(12000000, 'INR')).toBe('₹1.2Cr');
    expect(formatMoney(60000, 'INR')).toBe('₹60k');
    expect(formatRange(2800000, 3600000, 'INR')).toBe('₹28L – ₹36L');
    expect(formatRange(null, null, 'INR')).toBeNull();
  });
});

describe('mappers', () => {
  const row = {
    id: 'job-1',
    user_id: 'u',
    company: 'HP',
    title: 'SDE Intern',
    location: 'Bengaluru',
    work_type: 'Remote (India)',
    status: 'applied',
    priority: 'low',
    source: null,
    salary_min: '40000',
    salary_max: 60000,
    currency: '$',
    salary_period: null,
    hours_per_week: null,
    salary_undisclosed: false,
    applied_date: '2026-10-23',
    planned_apply_date: null,
    deadline: null,
    job_url: '',
    contact_name: '',
    contact_email: '',
    resume_version: '',
    resume_curation: 'curated',
    visa_status: null,
    referral_status: 'none',
    referral_contact: null,
    referral_role: null,
    referral_linkedin: null,
    referral_date: null,
    tags: ['React'],
    notes: 'Real note\n\n<!-- CT_META:{"salaryPeriod":"monthly","hoursPerWeek":20,"visaStatus":"domestic"}:CT_META -->',
    timeline: [],
    interviews: null,
    archived: null,
    archived_at: null,
    created_at: '2026-10-26T00:00:00Z',
    updated_at: '2026-10-26T00:00:00Z',
  } satisfies ApplicationRow;

  it('reads legacy CT_META fields out of notes', () => {
    const a = fromRow(row);
    expect(a.notes).toBe('Real note');
    expect(a.salaryPeriod).toBe('monthly');
    expect(a.hoursPerWeek).toBe(20);
    expect(a.visaStatus).toBe('domestic');
  });

  it('normalizes legacy values', () => {
    const a = fromRow(row);
    expect(a.currency).toBe('USD');
    expect(a.workType).toBe('Remote');
    expect(a.salaryMin).toBe(40000);
    expect(a.interviews).toEqual([]);
    expect(a.archived).toBe(false);
  });

  it('prefers real columns over legacy meta', () => {
    expect(fromRow({ ...row, salary_period: 'yearly' }).salaryPeriod).toBe('yearly');
  });

  it('keeps notes intact when the meta blob is malformed', () => {
    expect(splitLegacyNotes('hi <!-- CT_META:{bad:CT_META -->').notes).toBe('hi');
  });

  it('only writes fields that are present', () => {
    expect(toRow({ status: 'offer' })).toEqual({ status: 'offer' });
    expect(toRow({ deadline: '' })).toEqual({ deadline: null });
  });

  it('maps work types', () => {
    expect(normalizeWorkType('Onsite')).toBe('On-site');
    expect(normalizeWorkType('On-site')).toBe('On-site');
    expect(normalizeWorkType('Hybrid')).toBe('Hybrid');
    expect(normalizeWorkType(null)).toBe('Remote');
  });
});

describe('stats', () => {
  const now = new Date('2026-10-28T12:00:00');

  it('summarizes rates from submitted applications only', () => {
    const s = summarize([
      app({ status: 'wishlist' }),
      app({ status: 'applied' }),
      app({ status: 'interviewing' }),
      app({ status: 'offer' }),
      app({ status: 'rejected' }),
    ]);
    expect(s.total).toBe(5);
    expect(s.submitted).toBe(4);
    expect(s.responseRate).toBe(50);
    expect(s.offerRate).toBe(25);
  });

  it('collects upcoming interviews, deadlines and planned dates in order', () => {
    const items = upcoming(
      [
        app({ company: 'A', deadline: '2026-11-02' }),
        app({ company: 'B', interviews: [{ id: 'i', date: '2026-10-29T10:00', type: 'Technical', completed: false }] }),
        app({ company: 'C', status: 'wishlist', plannedApplyDate: '2026-10-30' }),
        app({ company: 'D', interviews: [{ id: 'i', date: '2026-10-29T10:00', type: 'Technical', completed: true }] }),
        app({ company: 'E', deadline: '2026-10-01' }),
      ],
      14,
      now,
    );
    expect(items.map((i) => `${i.app.company}:${i.kind}`)).toEqual(['B:interview', 'C:apply', 'A:deadline']);
  });

  it('flags stale applied applications for follow-up', () => {
    const stale = needsFollowUp([app({ appliedDate: '2026-10-01' }), app({ appliedDate: '2026-10-25' })], now);
    expect(stale).toHaveLength(1);
  });

  it('buckets weekly activity', () => {
    const weeks = weeklyActivity([app({ appliedDate: '2026-10-27' }), app({ appliedDate: '2026-10-28' })], 4, now);
    expect(weeks).toHaveLength(4);
    expect(weeks.at(-1)!.count).toBe(2);
  });

  it('annualizes and converts salary midpoints', () => {
    expect(annualMidpoint(app({ salaryMin: 50000, salaryMax: 70000, salaryPeriod: 'monthly', currency: 'INR' }), 'INR')).toBe(720000);
    expect(annualMidpoint(app({ salaryUndisclosed: true, salaryMin: 1, salaryMax: 2 }), 'INR')).toBeNull();
  });
});

describe('csv', () => {
  it('round-trips through export and import', () => {
    const csv = toCSV([app({ company: 'Comma, Inc', title: 'Dev "Lead"', tags: ['a', 'b'], status: 'interviewing', notes: 'line1\nline2' })]);
    const [parsed] = fromCSV(csv);
    expect(parsed.company).toBe('Comma, Inc');
    expect(parsed.title).toBe('Dev "Lead"');
    expect(parsed.status).toBe('interviewing');
    expect(parsed.tags).toEqual(['a', 'b']);
    expect(parsed.notes).toBe('line1\nline2');
  });

  it('neutralizes spreadsheet formulas on export', () => {
    expect(toCSV([app({ company: '=HYPERLINK("x")' })])).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it('parses quoted fields and CRLF', () => {
    expect(parseCSV('a,"b,c"\r\n1,2\r\n')).toEqual([
      ['a', 'b,c'],
      ['1', '2'],
    ]);
  });

  it('rejects files without required columns', () => {
    expect(() => fromCSV('Foo,Bar\n1,2')).toThrow(/Company/);
  });
});

describe('local repository', () => {
  it('seeds demo data and supports CRUD', async () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    } as Storage;
    const repo = localRepository(storage);

    const seeded = await repo.list();
    expect(seeded.length).toBeGreaterThan(5);

    const created = await repo.create(emptyApplication({ company: 'New Co', title: 'Engineer' }));
    expect((await repo.list())[0].id).toBe(created.id);

    const updated = await repo.update(created.id, { status: 'offer' });
    expect(updated.status).toBe('offer');

    await repo.remove(created.id);
    expect((await repo.list()).find((a) => a.id === created.id)).toBeUndefined();
  });
});
