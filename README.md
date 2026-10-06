# 💼 CareerTrack Pro — Job Application Tracker

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://job-application-tracker-alpha-seven.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

A modern, cloud-synced web application built to streamline and organize the software engineering job hunt. Track applications across stages, manage interview schedules, visualize pipeline analytics, compare job offers, and securely sync everything to a PostgreSQL cloud database.

🌐 **Live Application**: [https://job-application-tracker-alpha-seven.vercel.app](https://job-application-tracker-alpha-seven.vercel.app)

---

## ✨ Features

- 📋 **Interactive Kanban Pipeline**: Track applications across stages (*Wishlist*, *Applied*, *Interviewing*, *Offer Received*, *Archived/Rejected*) with intuitive status controls and quick actions.
- 📊 **Visual Analytics Dashboard**: Interactive charts powered by Recharts showing application status distributions, response rates, interview conversion ratios, and target salary spreads.
- 📅 **Interview Calendar & Deadlines**: Keep track of upcoming phone screens, technical rounds, behavioral interviews, and follow-up deadlines in an organized timeline view.
- ⚖️ **Offer Comparison Tool**: Compare job offers side-by-side with compensation breakdowns (base salary, bonus, equity), benefits, remote flexibility, and ratings to make informed career decisions.
- 🔍 **Real-time Search & Filtering**: Instantly search by company, role, location, tags, notes, or priority.
- ☁️ **Dual-Mode Architecture (Cloud + Offline)**:
  - **Cloud Mode**: Real-time cloud sync with Supabase PostgreSQL and email/password authentication.
  - **Local Mode**: Works 100% offline using browser `localStorage` when disconnected.
- 🔒 **Enterprise-Grade Security (RLS)**: PostgreSQL Row-Level Security ensures users can only read, insert, update, and delete their own data.
- 📄 **Resume Storage Integration**: Pre-configured Supabase storage bucket (`resumes`) for managing versioned PDF resumes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Lucide React (Icons), Canvas Confetti
- **Data Visualization**: Recharts
- **Database & Auth**: Supabase (Managed PostgreSQL, GoTrue Auth, Row-Level Security, Storage)
- **Deployment & Hosting**: Vercel (Continuous Deployment from GitHub `main`)
- **Linting & Code Quality**: Oxlint

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

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
```

*(Note: The app will run in local storage mode if `.env` is omitted).*

### 4. Start the development server
```bash
npm run dev
# or
npm start
```

Visit `http://localhost:5173` in your browser.

---

## 🚢 Deployment

This project is configured for one-click continuous deployment with **Vercel** ([`vercel.json`](vercel.json)) and **Netlify** ([`netlify.toml`](netlify.toml)).

### Continuous Deployment Workflow:
1. Every commit pushed to `origin/main` automatically triggers a production build on Vercel.
2. Production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are injected during build time.

---

<div align="center">

### Developed with ❤️ by [Anshul](https://github.com/anshuln26)

*Crafted with love and maintained by [Anshul](https://github.com/anshuln26) • © 2026 All Rights Reserved*

</div>
