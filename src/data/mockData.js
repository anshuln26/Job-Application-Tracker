export const STAGES = [
  { id: 'wishlist', label: 'Wishlist', icon: 'Bookmark', color: 'var(--status-wishlist)', bg: 'var(--status-wishlist-bg)' },
  { id: 'referral', label: 'Waiting for Referral', icon: 'Users', color: 'var(--status-referral)', bg: 'var(--status-referral-bg)' },
  { id: 'applied', label: 'Applied', icon: 'Send', color: 'var(--status-applied)', bg: 'var(--status-applied-bg)' },
  { id: 'interviewing', label: 'Interviewing', icon: 'Calendar', color: 'var(--status-interview)', bg: 'var(--status-interview-bg)' },
  { id: 'offer', label: 'Offer Received', icon: 'Trophy', color: 'var(--status-offer)', bg: 'var(--status-offer-bg)' },
  { id: 'rejected', label: 'Rejected', icon: 'XCircle', color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)' },
];

export const REFERRAL_STATUSES = [
  { id: 'none', label: 'None (Direct Apply)', color: 'var(--text-muted)' },
  { id: 'connection_pending', label: 'Connection Request Sent (Waiting on LinkedIn)', color: '#F59E0B' },
  { id: 'connected_waiting', label: 'Connected — Awaiting Referral Response', color: '#3B82F6' },
  { id: 'referral_received', label: 'Referral Received 🎉', color: '#10B981' },
  { id: 'declined', label: 'Declined / No Response', color: '#EF4444' }
];

export const WORK_TYPES = [
  'Remote (India)',
  'Remote (Global)',
  'Hybrid',
  'On-site',
  'Remote'
];

export const LOCATION_PRESETS = [
  { label: 'Bengaluru', location: 'Bengaluru, India', workType: 'Hybrid' },
  { label: 'Hyderabad', location: 'Hyderabad, India', workType: 'Hybrid' },
  { label: 'Pune', location: 'Pune, India', workType: 'Hybrid' },
  { label: 'Gurugram / NCR', location: 'Gurugram, India', workType: 'Hybrid' },
  { label: 'Mumbai', location: 'Mumbai, India', workType: 'On-site' },
  { label: 'Noida', location: 'Noida, India', workType: 'Hybrid' },
  { label: 'Remote (India)', location: 'Remote (India)', workType: 'Remote (India)' },
  { label: 'Remote (Global)', location: 'Remote (Worldwide)', workType: 'Remote (Global)' },
  { label: 'Dubai / UAE', location: 'Dubai, UAE', workType: 'On-site' },
  { label: 'London, UK', location: 'London, UK', workType: 'Hybrid' },
  { label: 'Berlin, Germany', location: 'Berlin, Germany', workType: 'Hybrid' },
  { label: 'San Francisco, US', location: 'San Francisco, CA', workType: 'On-site' },
  { label: 'Singapore', location: 'Singapore', workType: 'Hybrid' },
  { label: 'Sydney, Australia', location: 'Sydney, Australia', workType: 'Hybrid' }
];

export const VISA_STATUSES = [
  { id: 'none', label: 'Not Specified', badge: null, color: 'var(--text-muted)' },
  { id: 'domestic', label: 'Indian Citizen (No Visa Needed)', badge: '🇮🇳 Domestic', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'sponsored', label: 'Visa Sponsorship Provided (H-1B / UK / EU / UAE)', badge: '🛂 Visa Sponsored', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'contractor_eor', label: 'Contractor / EoR (via Deel / Remote.com)', badge: '📄 Contractor (EoR)', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'self_sponsored', label: 'Self-Sponsored / PR / No Visa Provided', badge: '⚠️ Self-Sponsored / PR', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
];

export const TIMEZONE_SHIFTS = [
  { id: 'none', label: 'Not Specified', badge: null, color: 'var(--text-muted)' },
  { id: 'ist', label: 'Standard IST (Daytime: 9 AM - 6 PM IST)', badge: '☀️ IST Daytime', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'emea', label: 'EMEA / UK Shift (3-4 hrs overlap with IST)', badge: '🌍 EMEA Overlap', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  { id: 'est', label: 'US East Coast / EST (Late afternoon / evening)', badge: '🌆 US EST Shift', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  { id: 'pst', label: 'US West Coast / PST (Night shift / late overlap)', badge: '🌙 US PST Shift', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
  { id: 'async', label: 'Flexible / Async (No mandatory core hours)', badge: '⚡ Async / Flexible', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' }
];

export const NOTICE_PERIODS = [
  { id: 'none', label: 'Not Specified', badge: null, color: 'var(--text-muted)' },
  { id: 'immediate', label: 'Immediate Joiner (< 15 days)', badge: '⚡ Immediate', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: '30_days', label: '30 Days Notice', badge: '⏳ 30 Days', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: '60_days', label: '60 Days Notice', badge: '⏳ 60 Days', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: '90_days', label: '90 Days Notice (MNC / Standard)', badge: '⏳ 90 Days', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'serving', label: 'Currently Serving Notice', badge: '📢 Serving Notice', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' }
];

export const PRIORITIES = [
  { id: 'high', label: 'High Priority', color: 'var(--priority-high)', bg: 'var(--priority-high-bg)' },
  { id: 'medium', label: 'Medium Priority', color: 'var(--priority-med)', bg: 'var(--priority-med-bg)' },
  { id: 'low', label: 'Low Priority', color: 'var(--priority-low)', bg: 'var(--priority-low-bg)' },
];

export const RESUME_CURATION_STATUSES = [
  { id: 'curated', label: 'Tailored for JD', shortLabel: 'Tailored', badge: '✨ Tailored', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  { id: 'pending', label: 'Needs Tailoring', shortLabel: 'Pending', badge: '⏳ Needs Tailoring', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'not_needed', label: 'Standard / Not Needed', shortLabel: 'Standard', badge: '📄 Standard', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.25)' }
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'job-1',
    company: 'Stripe',
    title: 'Senior Frontend Engineer - Developer Experience',
    location: 'San Francisco, CA / Remote',
    workType: 'Remote',
    status: 'offer',
    priority: 'high',
    salaryMin: 165000,
    salaryMax: 195000,
    currency: 'USD',
    salaryUndisclosed: false,
    resumeCuration: 'curated',
    appliedDate: '2026-09-10',
    jobUrl: 'https://stripe.com/jobs/frontend-dev',
    contactName: 'Sarah Lin',
    contactEmail: 'slin@stripe.com',
    resumeVersion: 'Frontend_Lead_v4.pdf',
    tags: ['React', 'TypeScript', 'Design Systems', 'High Pay'],
    notes: 'Offer package includes $185,000 base + $45,000 equity per year + 15% performance bonus. Deadline to decide is Oct 15.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-10', notes: 'Submitted via internal referral.' },
      { id: 't2', stage: 'Recruiter Screening', date: '2026-09-16', notes: 'Chatted with Sarah. Focused on React performance background.' },
      { id: 't3', stage: 'Technical Assessment', date: '2026-09-22', notes: 'Completed 2-hour UI Component Architecture challenge.' },
      { id: 't4', stage: 'Virtual Onsite', date: '2026-09-28', notes: 'System Design + 2 Coding rounds + Manager Chat.' },
      { id: 't5', stage: 'Official Offer', date: '2026-10-01', notes: 'Written offer received! Negotiating starting bonus.' }
    ],
    interviews: [
      { id: 'i1', title: 'Offer Final Review & Team Q&A', date: '2026-10-05T15:00', type: 'Manager Call', completed: false }
    ]
  },
  {
    id: 'job-2',
    company: 'Razorpay',
    title: 'Staff Software Engineer - Payment Gateway Core',
    location: 'Bengaluru, India / Hybrid',
    workType: 'Hybrid',
    status: 'offer',
    priority: 'high',
    salaryMin: 3800000,
    salaryMax: 4800000,
    currency: 'INR',
    appliedDate: '2026-09-12',
    jobUrl: 'https://razorpay.com/careers/staff-core-eng',
    contactName: 'Ananya Sharma',
    contactEmail: 'ananya.s@razorpay.com',
    resumeVersion: 'Staff_Engineer_India.pdf',
    tags: ['Fintech', 'Distributed Systems', 'Go', 'Kafka'],
    notes: 'Offer package: ₹42 Lakhs base + ₹12 Lakhs annual ESOPs + Joining Bonus. Outstanding team in Koramangala, Bengaluru.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-12', notes: 'Referred by senior director.' },
      { id: 't2', stage: 'System Design Round', date: '2026-09-20', notes: 'Architected high-throughput payment webhook processor.' },
      { id: 't3', stage: 'Leadership Interview', date: '2026-09-29', notes: 'Met with VP of Engineering.' }
    ],
    interviews: []
  },
  {
    id: 'job-3',
    company: 'Linear',
    title: 'Product Engineer (Full Stack)',
    location: 'Remote (Worldwide)',
    workType: 'Remote',
    status: 'interviewing',
    priority: 'high',
    salaryMin: 160000,
    salaryMax: 190000,
    currency: 'USD',
    appliedDate: '2026-09-18',
    jobUrl: 'https://linear.app/careers/product-engineer',
    contactName: 'Alex Mercer',
    contactEmail: 'alex@linear.app',
    resumeVersion: 'Product_Engineer_2026.pdf',
    tags: ['Next.js', 'WebSockets', 'GraphQL', 'Fast UI'],
    notes: 'Love the product focus on speed and craftsmanship. Preparing for system architecture round.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-18', notes: 'Applied directly on career portal.' },
      { id: 't2', stage: 'Technical Interview', date: '2026-09-26', notes: 'Built real-time sync prototype in React.' }
    ],
    interviews: [
      { id: 'i1', title: 'System Architecture & Sync Engine', date: '2026-10-03T18:00', type: 'Technical Round 2', completed: false },
      { id: 'i2', title: 'Founder & Cultural Alignment', date: '2026-10-06T16:30', type: 'Final Round', completed: false }
    ]
  },
  {
    id: 'job-4',
    company: 'Swiggy',
    title: 'Lead Frontend Engineer - Consumer Experience',
    location: 'Bengaluru / Remote (India)',
    workType: 'Remote',
    status: 'interviewing',
    priority: 'high',
    salaryMin: 2800000,
    salaryMax: 3600000,
    currency: 'INR',
    appliedDate: '2026-09-22',
    jobUrl: 'https://swiggy.com/careers/lead-fe',
    contactName: 'Vikram Joshi',
    contactEmail: 'v.joshi@swiggy.com',
    resumeVersion: 'Frontend_Lead_v4.pdf',
    tags: ['React Native', 'Performance', 'Microfrontends', 'High Scale'],
    notes: 'Target package 32-35 LPA. Interviewing for instant grocery and quick-commerce UI stack.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-22', notes: 'Direct recruiter reachout via LinkedIn.' },
      { id: 't2', stage: 'Tech Deep-Dive', date: '2026-10-01', notes: 'Discussed mobile web optimizations and PWA performance.' }
    ],
    interviews: [
      { id: 'i1', title: 'Director Round & Design Philosophy', date: '2026-10-08T17:00', type: 'Manager Call', completed: false }
    ]
  },
  {
    id: 'job-5',
    company: 'Supabase',
    title: 'Frontend Developer - Cloud Platform',
    location: 'Remote (Worldwide)',
    workType: 'Remote',
    status: 'applied',
    priority: 'medium',
    salaryMin: 140000,
    salaryMax: 175000,
    currency: 'USD',
    appliedDate: '2026-09-24',
    jobUrl: 'https://supabase.com/careers/frontend',
    contactName: 'David Chen',
    contactEmail: 'david@supabase.io',
    resumeVersion: 'Fullstack_Dev.pdf',
    tags: ['PostgreSQL', 'React', 'Open Source'],
    notes: 'Submitted open source contribution link alongside resume.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-24', notes: 'Application confirmation email received.' }
    ],
    interviews: []
  },
  {
    id: 'job-6',
    company: 'OpenAI',
    title: 'Member of Technical Staff - Web Platform',
    location: 'San Francisco, CA / Remote',
    workType: 'Remote',
    status: 'referral',
    priority: 'high',
    salaryMin: 200000,
    salaryMax: 260000,
    currency: 'USD',
    appliedDate: '',
    plannedApplyDate: '2026-10-25',
    deadline: '2026-10-28',
    jobUrl: 'https://openai.com/careers/web-staff',
    contactName: 'Marcus Vance',
    contactEmail: 'mvance@openai.com',
    referralStatus: 'connection_pending',
    referralContact: 'Marcus Vance',
    referralRole: 'Staff Engineer at OpenAI',
    referralLinkedin: 'https://www.linkedin.com/in/marcus-vance',
    referralDate: '2026-10-20',
    resumeVersion: 'AI_Platform_Focus.pdf',
    tags: ['AI Interface', 'Streaming', 'WebGPU'],
    notes: 'Requested LinkedIn connection with Marcus on Oct 20. Waiting for acceptance before requesting referral link for Web Platform role.',
    timeline: [
      { id: 't1', stage: 'LinkedIn Connection Sent', date: '2026-10-20', notes: 'Sent connection note referencing their WebGPU talk.' }
    ],
    interviews: []
  },
  {
    id: 'job-7',
    company: 'Zomato / Blinkit',
    title: 'Senior Software Engineer - Logistics Tech',
    location: 'Gurugram, Delhi NCR',
    workType: 'Onsite',
    status: 'wishlist',
    priority: 'medium',
    salaryMin: 2400000,
    salaryMax: 3200000,
    currency: 'INR',
    appliedDate: '',
    plannedApplyDate: '2026-10-24',
    deadline: '2026-10-27',
    jobUrl: 'https://zomato.com/careers/sse-logistics',
    contactName: 'Recruiting Team',
    contactEmail: 'careers@zomato.com',
    referralStatus: 'none',
    resumeVersion: 'Software_Engineer_2026.pdf',
    tags: ['Real-time Tracking', 'Go', 'Node.js', 'Redis'],
    notes: 'Need to review their recent engineering blog post before submitting application.',
    timeline: [],
    interviews: []
  },
  {
    id: 'job-8',
    company: 'Datadog',
    title: 'Full Stack Engineer - Dashboard Analytics',
    location: 'New York, NY',
    workType: 'Hybrid',
    status: 'rejected',
    priority: 'low',
    salaryMin: 145000,
    salaryMax: 170000,
    currency: 'USD',
    appliedDate: '2026-08-15',
    jobUrl: 'https://datadog.com/careers/fs-eng',
    contactName: 'Karen White',
    contactEmail: 'karen.w@datadog.com',
    resumeVersion: 'Fullstack_Dev.pdf',
    tags: ['Observability', 'D3.js', 'Go'],
    notes: 'Position closed internally due to headcount restructurings.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-08-15', notes: 'Applied online.' },
      { id: 't2', stage: 'Recruiter Screening', date: '2026-08-20', notes: 'Screening passed.' },
      { id: 't3', stage: 'Status Update', date: '2026-09-02', notes: 'Role put on hold. Rejection received.' }
    ],
    interviews: []
  },
  {
    id: 'job-9',
    company: 'SugarLabs',
    title: 'SDE Intern',
    location: 'Remote',
    workType: 'Remote',
    status: 'wishlist',
    priority: 'medium',
    salaryMin: 60000,
    salaryMax: 60000,
    currency: 'INR',
    salaryPeriod: 'monthly',
    appliedDate: '',
    plannedApplyDate: '2026-10-28',
    deadline: '2026-11-12',
    jobUrl: 'https://sugarlabs.org',
    contactName: 'Community Mentors',
    contactEmail: 'contact@sugarlabs.org',
    referralStatus: 'none',
    resumeVersion: 'Software_Engineer_2026.pdf',
    tags: ['Open Source', 'Python', 'Internship'],
    notes: 'Monthly stipend of ₹60,000 / mo for SDE intern. Open source contribution milestone.',
    visaStatus: 'domestic',
    timezoneShift: 'ist',
    noticePeriod: 'immediate',
    timeline: [],
    interviews: []
  },
  {
    id: 'job-10',
    company: 'Monzo Bank',
    title: 'Senior Fullstack Engineer - Payments & FinTech',
    location: 'London, UK / Hybrid',
    workType: 'Hybrid',
    status: 'interviewing',
    priority: 'high',
    salaryMin: 85000,
    salaryMax: 105000,
    currency: 'GBP',
    salaryPeriod: 'yearly',
    salaryBase: 90000,
    salaryBonus: 10000,
    salaryStocks: 5000,
    appliedDate: '2026-09-29',
    plannedApplyDate: '',
    deadline: '',
    jobUrl: 'https://monzo.com/careers/senior-eng',
    contactName: 'James Wilson',
    contactEmail: 'j.wilson@monzo.com',
    referralStatus: 'referral_received',
    referralContact: 'Ankit Gupta (Senior Eng)',
    referralRole: 'Senior Staff Engineer',
    referralLinkedin: 'https://linkedin.com/in/ankit-gupta-tech',
    referralDate: '2026-09-25',
    resumeVersion: 'Software_Engineer_2026.pdf',
    visaStatus: 'sponsored',
    timezoneShift: 'emea',
    noticePeriod: '30_days',
    tags: ['FinTech', 'React', 'Go', 'UK Skilled Worker'],
    notes: 'UK Skilled Worker Visa sponsorship confirmed by HR. 3-4 hours overlap with IST makes collaboration seamless.',
    timeline: [
      { id: 't1', stage: 'Referral Received', date: '2026-09-25', notes: 'Referred by Ankit from London office.' },
      { id: 't2', stage: 'Applied', date: '2026-09-29', notes: 'Official application submitted.' },
      { id: 't3', stage: 'Recruiter Chat', date: '2026-10-04', notes: 'Discussed visa timeline and UK relocation support.' }
    ],
    interviews: [
      { id: 'i1', title: 'Technical Architecture Round', date: '2026-10-12T16:00', type: 'System Design', completed: false }
    ]
  },
  {
    id: 'job-11',
    company: 'Careem (Uber)',
    title: 'Staff Frontend Architect - Super App Platform',
    location: 'Dubai, UAE',
    workType: 'On-site',
    status: 'wishlist',
    priority: 'high',
    salaryMin: 260000,
    salaryMax: 320000,
    currency: 'AED',
    salaryPeriod: 'yearly',
    salaryBase: 280000,
    salaryBonus: 40000,
    salaryStocks: 0,
    appliedDate: '',
    plannedApplyDate: '2026-10-29',
    deadline: '2026-11-05',
    jobUrl: 'https://careem.com/careers/dubai-fe-lead',
    contactName: 'Dubai Talent Acquisition',
    contactEmail: 'careers@careem.com',
    referralStatus: 'connection_pending',
    referralContact: 'Rohan Mehra',
    referralRole: 'Director of Engineering',
    referralLinkedin: 'https://linkedin.com/in/rohan-mehra-dxb',
    referralDate: '2026-10-20',
    resumeVersion: 'Software_Engineer_2026.pdf',
    visaStatus: 'sponsored',
    timezoneShift: 'emea',
    noticePeriod: '30_days',
    tags: ['Dubai Tech', 'Zero Income Tax', 'React', 'High Pay'],
    notes: 'Tax-free compensation in UAE dirhams (AED). UAE Green Visa sponsored by Careem. Direct flights to India.',
    timeline: [
      { id: 't1', stage: 'Connection Request Sent', date: '2026-10-20', notes: 'Sent connection note on LinkedIn to Rohan.' }
    ],
    interviews: []
  }
];
