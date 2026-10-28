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

  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationInput = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>;
