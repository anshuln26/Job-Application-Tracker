import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Columns3,
  Command,
  Globe2,
  Lock,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui';
import { Logo } from '@/components/layout/Logo';
import { APP_NAME, STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Columns3, title: 'Drag-and-drop pipeline', body: 'Move applications from wishlist to offer on a Kanban board. Every move is logged to the timeline.' },
  { icon: CalendarClock, title: 'Never miss a date', body: 'Interviews, deadlines and planned apply dates in one agenda, plus nudges for stale applications.' },
  { icon: BarChart3, title: 'Know what works', body: 'Response rate, conversion funnel and which sources actually lead to interviews.' },
  { icon: Users, title: 'Referral tracking', body: 'Track who you reached out to, when, and whether the referral came through.' },
  { icon: Globe2, title: 'Compare offers anywhere', body: 'Yearly, monthly stipend or hourly pay in 11 currencies, normalized so offers are comparable.' },
  { icon: Lock, title: 'Private by default', body: 'Row-level security in Postgres means only you can ever read your data.' },
];

export default function Landing() {
  const { status, enterDemo } = useAuth();
  const navigate = useNavigate();
  const signedIn = status === 'signed-in' || status === 'demo';

  const tryDemo = () => {
    enterDemo();
    navigate('/app');
  };

  return (
    <div className="min-h-full">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <Link to="/app">
              <Button>Open app</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 text-sm font-medium text-muted hover:text-fg">
                Sign in
              </Link>
              <Link to="/signup">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-24">
        <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Free and open source
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Your whole job search, <span className="text-accent">organized.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted text-pretty sm:text-lg">
          Track every application, interview, referral and offer in one fast workspace — so you can spend your energy on
          the interviews, not the spreadsheet.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={signedIn ? '/app' : '/signup'}>
            <Button size="lg" className="w-56 sm:w-auto">
              {signedIn ? 'Go to dashboard' : 'Create free account'} <ArrowRight className="size-4" />
            </Button>
          </Link>
          {!signedIn && (
            <Button size="lg" variant="secondary" className="w-56 sm:w-auto" onClick={tryDemo}>
              Try the demo — no signup
            </Button>
          )}
        </div>

        <BoardPreview />
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Everything a serious job search needs</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-surface p-6">
                <f.icon className="size-5 text-accent" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-muted">
            <Command className="size-4" /> Keyboard-first: press <kbd className="rounded border border-border px-1">⌘K</kbd> to
            search, <kbd className="rounded border border-border px-1">N</kbd> to add.
          </p>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Ready to land the offer?</h2>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={signedIn ? '/app' : '/signup'}>
            <Button size="lg">Get started</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-subtle">
        © {new Date().getFullYear()} {APP_NAME} ·{' '}
        <a href="https://github.com/anshuln26/Job-Application-Tracker" className="hover:text-fg" target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}

const PREVIEW: Record<string, { c: string; r: string }[]> = {
  wishlist: [{ c: 'Atlassian', r: 'Software Engineer' }],
  applied: [
    { c: 'Vercel', r: 'Software Engineer, DX' },
    { c: 'Monzo', r: 'Fullstack Engineer' },
  ],
  interviewing: [
    { c: 'Linear', r: 'Product Engineer' },
    { c: 'Razorpay', r: 'SDE II' },
  ],
  offer: [{ c: 'Stripe', r: 'Frontend Engineer' }],
};

function BoardPreview() {
  const cols = STAGES.filter((s) => s.id in PREVIEW);
  return (
    <div className="relative mx-auto mt-16 max-w-5xl" aria-hidden>
      <div className="absolute -inset-x-10 -top-10 -z-10 h-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-3 text-left shadow-2xl sm:p-4">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cols.map((s, i) => (
            <div key={s.id} className={cn('rounded-xl bg-surface-2 p-2.5', i > 1 && 'hidden sm:block')}>
              <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-muted">
                <span className={cn('size-2 rounded-full', s.dot)} />
                {s.label}
              </div>
              <div className="space-y-2">
                {PREVIEW[s.id].map((card) => (
                  <div key={card.c} className="rounded-lg border border-border bg-surface p-2.5 shadow-sm">
                    <div className="text-xs font-semibold">{card.c}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted">{card.r}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
