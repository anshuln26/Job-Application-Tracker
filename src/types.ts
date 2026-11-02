export type Status = 'wishlist' | 'referral' | 'applied' | 'interviewing' | 'offer' | 'rejected';
export type Priority = 'low' | 'medium' | 'high';
export type WorkType = 'Remote' | 'Hybrid' | 'On-site';
export type SalaryPeriod = 'yearly' | 'monthly' | 'hourly';
export type ResumeCuration = 'curated' | 'pending' | 'not_needed';
export type ReferralStatus =
  | 'none'
  | 'connection_pending'
  | 'connected_waiting'
  | 'referral_received'
  | 'declined';
export type VisaStatus = 'none' | 'domestic' | 'sponsored' | 'contractor_eor' | 'self_sponsored';

export interface TimelineEvent {
  id: string;
  date: string;
  stage: string;
  notes?: string;
}

export interface Interview {
  id: string;
  /** Local datetime, `YYYY-MM-DDTHH:mm` */
  date: string;
  type: string;
  title?: string;
  completed: boolean;
}

export interface Application {
  id: string;
  company: string;
  title: string;
  location: string;
  workType: WorkType;
  status: Status;
  priority: Priority;
  source: string;

  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  salaryPeriod: SalaryPeriod;
  hoursPerWeek: number;
  salaryUndisclosed: boolean;

  appliedDate: string | null;
  plannedApplyDate: string | null;
  deadline: string | null;

  jobUrl: string;
  contactName: string;
  contactEmail: string;
  resumeVersion: string;
  resumeCuration: ResumeCuration;
  visaStatus: VisaStatus;

  referralStatus: ReferralStatus;
  referralContact: string;
  referralRole: string;
  referralLinkedin: string;
  referralDate: string | null;

  tags: string[];
  notes: string;
  timeline: TimelineEvent[];
  interviews: Interview[];

  offerDetails: OfferDetails | null;

  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationInput = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;

export interface OfferDetails {
  /** Annual fixed / base pay */
  base: number | null;
  /** Annual variable / performance bonus (target) */
  bonus: number | null;
  joiningBonus: number | null;
  /** Annual value of stock / ESOP vesting */
  stocks: number | null;
  /** Other annual benefits counted in CTC (insurance, allowances…) */
  other: number | null;
  /** Basic pay as a % of fixed pay — drives PF */
  basicPercent: number;
  /** Whether 12% employee PF is deducted from in-hand */
  pf: boolean;
  /** Estimated effective tax % for offers outside India */
  foreignTaxPercent: number | null;
  notes: string;
}

export type ContactRelationship = 'recruiter' | 'referrer' | 'hiring_manager' | 'interviewer' | 'peer' | 'other';

export interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  relationship: ContactRelationship;
  email: string;
  phone: string;
  linkedin: string;
  notes: string;
  applicationIds: string[];
  lastContacted: string | null;
  nextFollowUp: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;

export interface UserSettings {
  weeklyGoal: number;
  timezone: string;
  emailDigest: boolean;
  pushEnabled: boolean;
  emailTwoFactor: boolean;
  calendarToken: string | null;
}
