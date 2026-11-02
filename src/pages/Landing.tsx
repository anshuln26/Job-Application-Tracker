import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarClock,
  Columns3,
  HandCoins,
  Link2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Button, SpotlightCard } from '@/components/ui';
import { Logo } from '@/components/layout/Logo';
import { Ambient } from '@/components/layout/Ambient';
import { APP_NAME, STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Link2, title: 'Paste a link, done', body: 'Drop in a LinkedIn, Greenhouse, Lever or careers-page link and the company, role, location and pay fill themselves in.' },
  { icon: Columns3, title: 'Drag-and-drop pipeline', body: 'Move applications from wishlist to offer. Every move is logged to the timeline — and offers get confetti.' },
  { icon: BellRing, title: 'Reminders that reach you', body: 'Daily email digest and phone notifications for interviews, deadlines and follow-ups.' },
  { icon: CalendarClock, title: 'Synced to your calendar', body: 'Subscribe once in Google Calendar, Outlook or Apple Calendar and interviews show up automatically.' },
  { icon: Users, title: 'Your network, organized', body: 'Recruiters, referrers and hiring managers linked to roles, with follow-up dates you won’t forget.' },
  { icon: HandCoins, title: 'Compare offers honestly', body: 'Monthly in-hand after Indian new-regime tax and PF, joining bonus and stocks — side by side.' },
  { icon: Target, title: 'Goals & streaks', body: 'Set a weekly target, keep a streak alive, and see your activity heatmap grow.' },
  { icon: BarChart3, title: 'Know what works', body: 'Response rate, conversion funnel and which sources actually lead to interviews.' },
  { icon: ShieldCheck, title: 'Private and secure', body: 'Row-level security in Postgres, plus optional two-step verification by authenticator app or email code.' },
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
    <div className="min-h-dvh overflow-x-hidden">
      <Ambient />
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4">
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
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="glass mx-auto mb-6 inline-flex animate-enter items-center gap-2 rounded-full px-3 py-1 text-xs text-muted">
          <Sparkles className="size-3.5 text-accent" /> Free, open source, installable on your phone
        </p>
        <h1 className="mx-auto max-w-4xl animate-enter text-4xl font-semibold tracking-tight text-balance sm:text-7xl" style={{ animationDelay: '60ms' }}>
          Your whole job search, <span className="text-gradient">beautifully organized.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl animate-enter text-base text-muted text-pretty sm:text-lg" style={{ animationDelay: '120ms' }}>
          Track every application, interview, referral and offer in one fast workspace — with reminders, calendar sync and
          honest offer math built in.
        </p>
        <div className="mt-9 flex animate-enter flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '180ms' }}>
          <Link to={signedIn ? '/app' : '/signup'}>
            <Button size="lg" className="w-60 sm:w-auto">
              {signedIn ? 'Go to dashboard' : 'Create free account'} <ArrowRight className="size-4" />
            </Button>
          </Link>
          {!signedIn && (
            <Button size="lg" variant="secondary" className="w-60 sm:w-auto" onClick={tryDemo}>
              Try the demo — no signup
            </Button>
          )}
        </div>

        <BoardPreview />
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-4xl">
            Everything a serious job search needs
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted">From the first application to signing the offer.</p>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="animate-enter" style={{ animationDelay: `${i * 50}ms` }}>
                <SpotlightCard className="h-full p-6">
                  <span className="bg-gradient-accent glow grid size-10 place-items-center rounded-xl text-white">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="glass ring-gradient mx-auto max-w-3xl rounded-3xl px-6 py-12 text-center">
          <Smartphone className="mx-auto size-8 text-accent" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Ready to land the offer?</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Set up in a minute. Install it on your phone and get reminded before every interview.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to={signedIn ? '/app' : '/signup'}>
              <Button size="lg">Get started free</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="pb-10 text-center text-xs text-subtle">
        © {new Date().getFullYear()} {APP_NAME} ·{' '}
        <a href="https://github.com/anshuln26/Job-Application-Tracker" className="hover:text-fg" target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}

const PREVIEW: Record<string, { c: string; r: string; tag?: string }[]> = {
  wishlist: [{ c: 'Atlassian', r: 'Software Engineer', tag: 'Apply tomorrow' }],
  applied: [
    { c: 'Vercel', r: 'Software Engineer, DX' },
    { c: 'Monzo', r: 'Fullstack Engineer' },
  ],
  interviewing: [
    { c: 'Linear', r: 'Product Engineer', tag: 'Interview in 2 days' },
    { c: 'Razorpay', r: 'SDE II' },
  ],
  offer: [{ c: 'Stripe', r: 'Frontend Engineer', tag: '₹2.4L / mo in-hand' }],
};

function BoardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  // Subtle 3D tilt that follows the pointer
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1400px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
    };
    const reset = () => (el.style.transform = 'perspective(1400px) rotateX(6deg)');
    reset();
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', reset);
    };
  }, []);

  const cols = STAGES.filter((s) => s.id in PREVIEW);
  return (
    <div className="relative mx-auto mt-16 max-w-5xl animate-enter" style={{ animationDelay: '260ms' }} aria-hidden>
      <div className="bg-gradient-accent absolute -inset-x-10 -top-10 -z-10 h-80 rounded-full opacity-30 blur-3xl" />
      <div ref={ref} className="glass-strong rounded-3xl p-3 text-left shadow-2xl transition-transform duration-300 ease-out sm:p-4">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-fg/5" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cols.map((s, i) => (
            <div key={s.id} className={cn('glass-soft rounded-2xl p-2.5', i > 1 && 'hidden sm:block')}>
              <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-muted">
                <span className={cn('size-2 rounded-full', s.dot)} />
                {s.label}
              </div>
              <div className="space-y-2">
                {PREVIEW[s.id].map((card) => (
                  <div key={card.c} className={cn('glass rounded-xl p-2.5', s.id === 'offer' && 'ring-gradient')}>
                    <div className="text-xs font-semibold">{card.c}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted">{card.r}</div>
                    {card.tag && <div className="mt-1.5 inline-block rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">{card.tag}</div>}
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
