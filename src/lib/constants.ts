import type {
  Priority,
  ReferralStatus,
  ResumeCuration,
  SalaryPeriod,
  Status,
  VisaStatus,
  WorkType,
} from '@/types';

export const APP_NAME = 'ApplyTrack';

export interface StageMeta {
  id: Status;
  label: string;
  short: string;
  /** Tailwind classes for the dot / pill colour */
  dot: string;
  pill: string;
}

export const STAGES: StageMeta[] = [
  { id: 'wishlist', label: 'Wishlist', short: 'Wishlist', dot: 'bg-slate-400', pill: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  { id: 'referral', label: 'Networking', short: 'Networking', dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  { id: 'applied', label: 'Applied', short: 'Applied', dot: 'bg-sky-500', pill: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  { id: 'interviewing', label: 'Interviewing', short: 'Interview', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { id: 'offer', label: 'Offer', short: 'Offer', dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { id: 'rejected', label: 'Rejected', short: 'Rejected', dot: 'bg-rose-500', pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<Status, StageMeta>;

/** Stages that come before the application is actually submitted */
export const PRE_APPLY: Status[] = ['wishlist', 'referral'];
export const ACTIVE: Status[] = ['wishlist', 'referral', 'applied', 'interviewing'];

export const PRIORITIES: { id: Priority; label: string; cls: string }[] = [
  { id: 'high', label: 'High', cls: 'text-rose-600 dark:text-rose-400' },
  { id: 'medium', label: 'Medium', cls: 'text-amber-600 dark:text-amber-400' },
  { id: 'low', label: 'Low', cls: 'text-subtle' },
];

export const WORK_TYPES: WorkType[] = ['Remote', 'Hybrid', 'On-site'];

export const SALARY_PERIODS: { id: SalaryPeriod; label: string; unit: string }[] = [
  { id: 'yearly', label: 'Per year', unit: '/yr' },
  { id: 'monthly', label: 'Per month (stipend)', unit: '/mo' },
  { id: 'hourly', label: 'Per hour', unit: '/hr' },
];

export const RESUME_CURATION: { id: ResumeCuration; label: string }[] = [
  { id: 'curated', label: 'Tailored for this JD' },
  { id: 'pending', label: 'Needs tailoring' },
  { id: 'not_needed', label: 'Standard resume' },
];

export const REFERRAL_STATUSES: { id: ReferralStatus; label: string }[] = [
  { id: 'none', label: 'No referral' },
  { id: 'connection_pending', label: 'Connection request sent' },
  { id: 'connected_waiting', label: 'Connected, awaiting referral' },
  { id: 'referral_received', label: 'Referral received' },
  { id: 'declined', label: 'Declined / no response' },
];

export const VISA_STATUSES: { id: VisaStatus; label: string }[] = [
  { id: 'none', label: 'Not specified' },
  { id: 'domestic', label: 'No visa needed' },
  { id: 'sponsored', label: 'Visa sponsored' },
  { id: 'contractor_eor', label: 'Contractor / EoR' },
  { id: 'self_sponsored', label: 'Self-sponsored / no sponsorship' },
];

export const SOURCES = ['Company site', 'LinkedIn', 'Referral', 'Recruiter', 'Job board', 'Other'];

export const INTERVIEW_TYPES = [
  'Recruiter screen',
  'Online assessment',
  'Technical',
  'System design',
  'Hiring manager',
  'Behavioral',
  'Final round',
  'Other',
];
