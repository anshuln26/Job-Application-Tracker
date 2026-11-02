import { normalizeCurrency } from '@/lib/currency';
import type {
  Application,
  ApplicationInput,
  Priority,
  ReferralStatus,
  ResumeCuration,
  SalaryPeriod,
  Status,
  VisaStatus,
  WorkType,
} from '@/types';

/** Row shape of `public.applications` */
export interface ApplicationRow {
  id: string;
  user_id: string;
  company: string;
  title: string;
  location: string | null;
  work_type: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  salary_min: number | string | null;
  salary_max: number | string | null;
  currency: string | null;
  salary_period: string | null;
  hours_per_week: number | null;
  salary_undisclosed: boolean | null;
  applied_date: string | null;
  planned_apply_date: string | null;
  deadline: string | null;
  job_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  resume_version: string | null;
  resume_curation: string | null;
  visa_status: string | null;
  referral_status: string | null;
  referral_contact: string | null;
  referral_role: string | null;
  referral_linkedin: string | null;
  referral_date: string | null;
  tags: unknown;
  notes: string | null;
  timeline: unknown;
  interviews: unknown;
  archived: boolean | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUSES: Status[] = ['wishlist', 'referral', 'applied', 'interviewing', 'offer', 'rejected'];
const PERIODS: SalaryPeriod[] = ['yearly', 'monthly', 'hourly'];

/** Older versions of the app stored extra fields as JSON inside a comment in `notes`. */
const LEGACY_META = /<!-- CT_META:([\s\S]*?):CT_META -->/;

export function splitLegacyNotes(notes: string | null): { notes: string; meta: Record<string, unknown> } {
  const text = notes ?? '';
  const match = text.match(LEGACY_META);
  if (!match) return { notes: text, meta: {} };
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(match[1]);
  } catch {
    // keep the notes, drop the unreadable blob
  }
  return { notes: text.replace(LEGACY_META, '').trim(), meta };
}

export function normalizeWorkType(raw: string | null | undefined): WorkType {
  const v = (raw ?? '').toLowerCase();
  if (v.includes('hybrid')) return 'Hybrid';
  if (v.includes('site') || v.includes('office')) return 'On-site';
  return 'Remote';
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function fromRow(row: ApplicationRow): Application {
  const { notes, meta } = splitLegacyNotes(row.notes);
  const period = (row.salary_period ?? meta.salaryPeriod) as SalaryPeriod;

  return {
    id: row.id,
    company: row.company,
    title: row.title,
    location: row.location ?? '',
    workType: normalizeWorkType(row.work_type),
    status: STATUSES.includes(row.status as Status) ? (row.status as Status) : 'applied',
    priority: (['low', 'medium', 'high'].includes(row.priority ?? '') ? row.priority : 'medium') as Priority,
    source: row.source ?? '',
    salaryMin: num(row.salary_min),
    salaryMax: num(row.salary_max),
    currency: normalizeCurrency(row.currency ?? (meta.currency as string)),
    salaryPeriod: PERIODS.includes(period) ? period : 'yearly',
    hoursPerWeek: row.hours_per_week ?? (meta.hoursPerWeek as number) ?? 40,
    salaryUndisclosed: Boolean(row.salary_undisclosed ?? meta.salaryUndisclosed),
    appliedDate: row.applied_date,
    plannedApplyDate: row.planned_apply_date,
    deadline: row.deadline,
    jobUrl: row.job_url ?? '',
    contactName: row.contact_name ?? '',
    contactEmail: row.contact_email ?? '',
    resumeVersion: row.resume_version ?? '',
    resumeCuration: (row.resume_curation ?? 'not_needed') as ResumeCuration,
    visaStatus: (row.visa_status ?? (meta.visaStatus as string) ?? 'none') as VisaStatus,
    referralStatus: (row.referral_status ?? 'none') as ReferralStatus,
    referralContact: row.referral_contact ?? '',
    referralRole: row.referral_role ?? '',
    referralLinkedin: row.referral_linkedin ?? '',
    referralDate: row.referral_date,
    tags: arr<string>(row.tags),
    notes,
    timeline: arr(row.timeline),
    interviews: arr(row.interviews),
    archived: Boolean(row.archived),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const nullIfEmpty = (s: string | null | undefined) => (s ? s : null);

export function toRow(app: Partial<ApplicationInput>): Partial<ApplicationRow> {
  const row: Partial<ApplicationRow> = {};
  const set = <K extends keyof ApplicationRow>(k: K, v: ApplicationRow[K]) => {
    row[k] = v;
  };
  if (app.company !== undefined) set('company', app.company.trim());
  if (app.title !== undefined) set('title', app.title.trim());
  if (app.location !== undefined) set('location', app.location);
  if (app.workType !== undefined) set('work_type', app.workType);
  if (app.status !== undefined) set('status', app.status);
  if (app.priority !== undefined) set('priority', app.priority);
  if (app.source !== undefined) set('source', nullIfEmpty(app.source));
  if (app.salaryMin !== undefined) set('salary_min', app.salaryMin ?? 0);
  if (app.salaryMax !== undefined) set('salary_max', app.salaryMax ?? 0);
  if (app.currency !== undefined) set('currency', app.currency);
  if (app.salaryPeriod !== undefined) set('salary_period', app.salaryPeriod);
  if (app.hoursPerWeek !== undefined) set('hours_per_week', app.hoursPerWeek);
  if (app.salaryUndisclosed !== undefined) set('salary_undisclosed', app.salaryUndisclosed);
  if (app.appliedDate !== undefined) set('applied_date', nullIfEmpty(app.appliedDate));
  if (app.plannedApplyDate !== undefined) set('planned_apply_date', nullIfEmpty(app.plannedApplyDate));
  if (app.deadline !== undefined) set('deadline', nullIfEmpty(app.deadline));
  if (app.jobUrl !== undefined) set('job_url', app.jobUrl);
  if (app.contactName !== undefined) set('contact_name', app.contactName);
  if (app.contactEmail !== undefined) set('contact_email', app.contactEmail);
  if (app.resumeVersion !== undefined) set('resume_version', app.resumeVersion);
  if (app.resumeCuration !== undefined) set('resume_curation', app.resumeCuration);
  if (app.visaStatus !== undefined) set('visa_status', app.visaStatus);
  if (app.referralStatus !== undefined) set('referral_status', app.referralStatus);
  if (app.referralContact !== undefined) set('referral_contact', app.referralContact);
  if (app.referralRole !== undefined) set('referral_role', app.referralRole);
  if (app.referralLinkedin !== undefined) set('referral_linkedin', app.referralLinkedin);
  if (app.referralDate !== undefined) set('referral_date', nullIfEmpty(app.referralDate));
  if (app.tags !== undefined) set('tags', app.tags);
  if (app.notes !== undefined) set('notes', app.notes);
  if (app.timeline !== undefined) set('timeline', app.timeline);
  if (app.interviews !== undefined) set('interviews', app.interviews);
  if (app.archived !== undefined) set('archived', app.archived);
  if (app.archivedAt !== undefined) set('archived_at', app.archivedAt);
  return row;
}

export function emptyApplication(overrides: Partial<ApplicationInput> = {}): ApplicationInput {
  return {
    company: '',
    title: '',
    location: '',
    workType: 'Remote',
    status: 'applied',
    priority: 'medium',
    source: '',
    salaryMin: null,
    salaryMax: null,
    currency: 'INR',
    salaryPeriod: 'yearly',
    hoursPerWeek: 40,
    salaryUndisclosed: false,
    appliedDate: new Date().toISOString().slice(0, 10),
    plannedApplyDate: null,
    deadline: null,
    jobUrl: '',
    contactName: '',
    contactEmail: '',
    resumeVersion: '',
    resumeCuration: 'not_needed',
    visaStatus: 'none',
    referralStatus: 'none',
    referralContact: '',
    referralRole: '',
    referralLinkedin: '',
    referralDate: null,
    tags: [],
    notes: '',
    timeline: [],
    interviews: [],
    archived: false,
    archivedAt: null,
    ...overrides,
  };
}
