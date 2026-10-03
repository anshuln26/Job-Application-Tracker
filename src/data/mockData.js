export const STAGES = [
  { id: 'wishlist', label: 'Wishlist', icon: 'Bookmark', color: 'var(--status-wishlist)', bg: 'var(--status-wishlist-bg)' },
  { id: 'applied', label: 'Applied', icon: 'Send', color: 'var(--status-applied)', bg: 'var(--status-applied-bg)' },
  { id: 'interviewing', label: 'Interviewing', icon: 'Calendar', color: 'var(--status-interview)', bg: 'var(--status-interview-bg)' },
  { id: 'offer', label: 'Offer Received', icon: 'Trophy', color: 'var(--status-offer)', bg: 'var(--status-offer-bg)' },
  { id: 'rejected', label: 'Rejected', icon: 'XCircle', color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)' },
];

export const WORK_TYPES = ['Remote', 'Hybrid', 'Onsite'];
export const PRIORITIES = [
  { id: 'high', label: 'High Priority', color: 'var(--priority-high)', bg: 'var(--priority-high-bg)' },
  { id: 'medium', label: 'Medium Priority', color: 'var(--priority-med)', bg: 'var(--priority-med-bg)' },
  { id: 'low', label: 'Low Priority', color: 'var(--priority-low)', bg: 'var(--priority-low-bg)' },
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
    currency: '$',
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
    company: 'Linear',
    title: 'Product Engineer (Full Stack)',
    location: 'San Francisco, CA',
    workType: 'Hybrid',
    status: 'interviewing',
    priority: 'high',
    salaryMin: 160000,
    salaryMax: 190000,
    currency: '$',
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
    id: 'job-3',
    company: 'Vercel',
    title: 'Staff UI Software Engineer',
    location: 'Remote (US/Global)',
    workType: 'Remote',
    status: 'interviewing',
    priority: 'high',
    salaryMin: 170000,
    salaryMax: 205000,
    currency: '$',
    appliedDate: '2026-09-15',
    jobUrl: 'https://vercel.com/careers/ui-staff',
    contactName: 'Elena Rostova',
    contactEmail: 'elena.r@vercel.com',
    resumeVersion: 'Frontend_Lead_v4.pdf',
    tags: ['Next.js', 'Compiler', 'Turbopack', 'Tailwind'],
    notes: 'Passed screening and initial take-home code review.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-15', notes: 'Applied via website.' },
      { id: 't2', stage: 'Recruiter Call', date: '2026-09-20', notes: 'Discussed experience with Server Components & SSR.' }
    ],
    interviews: [
      { id: 'i1', title: 'Live Coding: Edge Runtime & Rendering', date: '2026-10-04T14:00', type: 'Coding Pair', completed: false }
    ]
  },
  {
    id: 'job-4',
    company: 'Supabase',
    title: 'Frontend Developer - Cloud Platform',
    location: 'Remote',
    workType: 'Remote',
    status: 'applied',
    priority: 'medium',
    salaryMin: 140000,
    salaryMax: 175000,
    currency: '$',
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
    id: 'job-5',
    company: 'Figma',
    title: 'Design Systems Engineer',
    location: 'New York, NY',
    workType: 'Hybrid',
    status: 'applied',
    priority: 'medium',
    salaryMin: 155000,
    salaryMax: 185000,
    currency: '$',
    appliedDate: '2026-09-28',
    jobUrl: 'https://figma.com/careers/ds-engineer',
    contactName: '',
    contactEmail: '',
    resumeVersion: 'Frontend_Lead_v4.pdf',
    tags: ['Canvas API', 'WebGL', 'Design Tokens'],
    notes: 'Awaiting recruiter response. Follow up set for Oct 8.',
    timeline: [
      { id: 't1', stage: 'Applied', date: '2026-09-28', notes: 'Applied on company portal.' }
    ],
    interviews: []
  },
  {
    id: 'job-6',
    company: 'OpenAI',
    title: 'Member of Technical Staff - Web Platform',
    location: 'San Francisco, CA',
    workType: 'Onsite',
    status: 'wishlist',
    priority: 'high',
    salaryMin: 200000,
    salaryMax: 260000,
    currency: '$',
    appliedDate: '',
    jobUrl: 'https://openai.com/careers/web-staff',
    contactName: 'Marcus Vance',
    contactEmail: 'mvance@openai.com',
    resumeVersion: 'AI_Platform_Focus.pdf',
    tags: ['AI Interface', 'Streaming', 'WebGPU'],
    notes: 'Reaching out to Marcus on LinkedIn for a warm intro before applying.',
    timeline: [],
    interviews: []
  },
  {
    id: 'job-7',
    company: 'Notion',
    title: 'Senior Web Engineer - Core Editor',
    location: 'San Francisco, CA',
    workType: 'Hybrid',
    status: 'wishlist',
    priority: 'medium',
    salaryMin: 150000,
    salaryMax: 180000,
    currency: '$',
    appliedDate: '',
    jobUrl: 'https://notion.so/careers/editor-eng',
    contactName: '',
    contactEmail: '',
    resumeVersion: 'Frontend_Lead_v4.pdf',
    tags: ['Rich Text', 'CRDTs', 'Performance'],
    notes: 'Tailoring cover letter highlighting rich text editor experience.',
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
    currency: '$',
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
  }
];
