# 💼 CareerTrack Pro — Advanced Job Application Tracker

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://job-application-tracker-alpha-seven.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%20AA-blueviolet?style=for-the-badge)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

A modern, cloud-synced career management platform designed for global software engineering job seekers and interns. Track applications across stages, manage interview schedules, monitor LinkedIn referrals, visualize compensation analytics in INR and USD, compare offers, and securely sync everything to a PostgreSQL cloud database.

🌐 **Live Application**: [https://job-application-tracker-alpha-seven.vercel.app](https://job-application-tracker-alpha-seven.vercel.app)

---

## 🌟 Key Highlights & Features

### 🇮🇳 / 🌐 1. Dual & Multi-Currency Engine
- **One-Click Currency Switcher**: Seamlessly toggle between **INR (₹)** and **USD ($)** anywhere in the application with instant re-calculations.
- **Indian Financial Notation**: Automatic Lakhs & Crores formatting for Indian candidates (e.g., `₹12.0L - ₹18.5L`, `₹1.2Cr`).
- **Native Multi-Currency Mode**: Track international compensation in original local currencies with real-time conversion rates across 10 global economies:
  - 🇮🇳 **INR** (Indian Rupee)
  - 🇺🇸 **USD** (US Dollar)
  - 🇦🇪 **AED** (UAE Dirham)
  - 🇬🇧 **GBP** (British Pound)
  - 🇪🇺 **EUR** (Euro)
  - 🇦🇺 **AUD** (Australian Dollar)
  - 🇨🇦 **CAD** (Canadian Dollar)
  - 🇯🇵 **JPY** (Japanese Yen)
  - 🇰🇷 **KRW** (South Korean Won)
  - 🇨🇳 **CNY** (Chinese Yuan)
- **Live Conversion Preview**: Built-in interactive currency conversion calculator inside application cards and the job detail modal.

---

### 🎓 / 💼 2. Intern Monthly Stipend & Hourly Wage Support
- **Flexible Compensation Periods**:
  - **Yearly**: Annual CTC for full-time software engineering roles.
  - **Monthly**: Monthly stipend for internship opportunities.
  - **Hourly**: Contract/hourly wage with customizable expected hours per week (defaults to 40 hrs/wk).
- **Smart Dual-View KPI Card**:
  - Automatically switches between **"💼 Avg Target Salary"** (annualized) and **"🎓 Avg Intern Stipend"** (monthly) based on your active pipeline.
  - Interactive pill switcher to manually toggle between Annual and Intern stipend analytics.

---

### 🌍 3. Global Applicant & Remote Relocation Suite
- **Visa Sponsorship & Work Authorization Tracker**:
  - Categorize roles by visa requirements: *US H-1B*, *F-1 OPT/STEM*, *UK Skilled Worker*, *EU Blue Card*, *UAE Golden/Green Visa*, *Need Sponsorship*, *Citizen / Permanent Resident*, or *No Sponsorship Available*.
  - Visual color-coded authorization badges appear on Kanban cards and the table view.
- **Timezone Overlap & Shift Warning**:
  - Visual indicators calculating timezone difference relative to candidate's local time (IST, EST, PST, GMT, CET, JST/KST, AEST).
  - Smart shift flags warn about high night-shift or offset requirements (e.g., `⚡ PST -12.5h · Significant Shift`, `✅ CET -4.5h · Good Overlap`).
- **Notice Period & Availability Tracker**:
  - Track current employment notice period (Immediate, 15 days, 30 days, 60 days, 90 days) with automated countdown to planned end date.

---

### 🚨 4. Smart Action Center & Urgent Attention Banner
- **Approaching Deadlines**: Dynamic countdown alerts (`🚨 Deadline Today`, `⚠️ Deadline in 3 days`, `Expired`).
- **Pending Submissions**: Highlights jobs saved in *Wishlist* or *Waiting for Referral* to prevent missed application windows.
- **Quick Action Triggers**: Mark as applied directly from the urgency banner with one click.

---

### 🤝 5. LinkedIn Referral & Networking Manager
- **Employee Referral Tracking**: Record contact name, job title, and direct LinkedIn profile URL for company referrers.
- **Outreach Timeline**: Track connection request dates, follow-up status, and custom referral notes before submitting formal applications.

---

### 📋 6. Kanban Pipeline & Advanced Table View
- **6 Pipeline Stages**: *Wishlist* ➔ *Waiting for Referral* ➔ *Applied* ➔ *Interviewing* ➔ *Offer Received* ➔ *Rejected*.
- **Drag-and-Drop / Instant Transition**: Easily advance stages from Kanban cards or inline select dropdowns.
- **Batch Operations**: Bulk selection, bulk status update, and bulk delete in Table view.
- **Customizable Filtering**: Filter by keyword, location, work model (Remote, Hybrid, On-site), priority, visa status, or approaching deadlines.

---

### 📊 7. Visual Analytics Dashboard
- Interactive charts powered by **Recharts**:
  - **Application Status Distribution**: Donut breakdown of current pipeline stages.
  - **Conversion Funnel**: From application submission to interview and final offer.
  - **Target Salary Spread**: Bar chart comparing compensation ranges across target companies.
  - **Theme-Adaptive Tooltips**: Fully styled for high contrast in both light and dark themes.

---

### 📅 8. Unified Interview Calendar & Schedule Tracker
- Centralized agenda combining upcoming interview rounds and application deadlines.
- Mark interview rounds (*HR Screen*, *Technical Phone Screen*, *System Design*, *Take-Home Assessment*, *Onsite / Behavioral*) as completed with interactive checkboxes.
- Add new interview events directly to any application.

---

### ⚖️ 9. Job Offer Evaluator & Comparison Matrix
- Side-by-side compensation evaluation including base pay, annual bonus, and equity/stocks.
- Interactive rating sliders for **Remote Flexibility**, **Culture & Team Alignment**, and **Career Growth**.
- Automated 100-point composite scoring with celebratory confetti for the top-ranked offer.

---

### ☀️ / 🌙 10. Dual-Theme Design System (WCAG AA/AAA Compliant)
- **High-Contrast Slate Light Mode**: Custom-crafted light theme with Slate palette (`#0F172A`, `#475569`, `#64748B`) ensuring high readability, elevated card containers, and zero washed-out pastels.
- **Sleek Glassmorphic Dark Mode**: Deep navy backdrops with luminous neon accents and subtle ambient glows.
- **Persistent Theme Preference**: Synchronized with browser `localStorage`.

---

### ☁️ 11. Dual-Mode Cloud Sync & Offline Architecture
- **Cloud Mode**: Real-time cloud sync with Supabase PostgreSQL, email/password authentication, and Row Level Security (RLS).
- **Offline / Local Mode**: 100% functional without an account or internet connection using browser `localStorage`.
- **Zero-Loss Migration**: JSON import/export functionality for effortless data portability and backups.
- **Forward-Compatible Metadata Engine**: Custom metadata serialization (`<!-- CT_META: ... :CT_META -->`) ensures all global fields persist cleanly to PostgreSQL text fields without requiring destructive database schema alterations.

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/) |
| **Icons & UI Micro-Interactions** | [Lucide React](https://lucide.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (Managed PostgreSQL, GoTrue Auth, Row-Level Security, Storage) |
| **Code Quality & Linting** | [Oxlint](https://oxc.rs/) |
| **Deployment & Hosting** | [Vercel](https://vercel.com/) (Continuous Deployment from GitHub `main`) |

---

## 🏗️ Architecture & Database Schema

The cloud database is powered by Supabase PostgreSQL with strict Row Level Security (RLS).

### Database Tables:
* **`public.applications`**:
  * `id` (`TEXT PRIMARY KEY`): Unique application identifier.
  * `user_id` (`UUID NOT NULL REFERENCES auth.users`): Foreign key linked to authenticated user.
  * `company`, `title`, `location`, `work_type`, `status`, `priority`
  * `salary_min`, `salary_max`, `currency`, `applied_date`, `job_url`
  * `contact_name`, `contact_email`, `resume_version`
  * `tags` (`JSONB`), `timeline` (`JSONB`), `interviews` (`JSONB`), `notes` (`TEXT`)
  * `created_at`, `updated_at` (automatic trigger via `handle_updated_at()`)

### Security Model:
* RLS policies restrict all `SELECT`, `INSERT`, `UPDATE`, and `DELETE` queries strictly to `auth.uid() = user_id`.

The full schema migration script is located at [`supabase/schema.sql`](supabase/schema.sql).

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/anshuln26/Job-Application-Tracker.git
cd Job-Application-Tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables (Optional)
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
```

*(Note: If `.env` is omitted, the application operates in 100% offline LocalStorage mode).*

### 4. Start the development server
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 5. Build for production
```bash
npm run build
```

---

## 🚢 Continuous Deployment

This project is configured for one-click continuous deployment with **Vercel** ([`vercel.json`](vercel.json)) and **Netlify** ([`netlify.toml`](netlify.toml)).

1. Every commit pushed to `origin/main` automatically triggers a production build on Vercel.
2. Production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are injected during build time.

---

<div align="center">

### Developed with ❤️ by [Anshul](https://github.com/anshuln26)

*Crafted with love and maintained by [Anshul](https://github.com/anshuln26) • © 2026 All Rights Reserved*

</div>
