import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Archive,
  BarChart3,
  CalendarDays,
  Columns3,
  Download,
  HandCoins,
  LayoutDashboard,
  List,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Kbd, Menu } from '@/components/ui';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { usePreferences } from '@/hooks/usePreferences';
import { APP_NAME } from '@/lib/constants';
import { useInstallPrompt } from '@/lib/pwa';
import { cn, initials } from '@/lib/utils';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';
import { Ambient } from './Ambient';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/board', label: 'Board', icon: Columns3 },
  { to: '/app/applications', label: 'Applications', icon: List },
  { to: '/app/contacts', label: 'Contacts', icon: Users },
  { to: '/app/offers', label: 'Offers', icon: HandCoins },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppShell() {
  const { status, displayName, signOut } = useAuth();
  const { openNew } = useApplicationDialogs();
  const { theme, setTheme } = usePreferences();
  const install = useInstallPrompt();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isDark =
    theme === 'dark' || (theme === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n' && !document.querySelector('[role=dialog]')) {
        e.preventDefault();
        openNew();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openNew]);

  const onSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh">
      <Ambient />

      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 p-3 lg:block">
        <div className="glass flex h-full flex-col rounded-3xl px-3 py-4">
          <Link to="/app" className="mb-6 flex items-center gap-2.5 px-2">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">{APP_NAME}</span>
          </Link>

          <Button className="mb-5 w-full justify-between" onClick={() => openNew()}>
            <span className="flex items-center gap-2">
              <Plus className="size-4" /> New application
            </span>
            <kbd className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">N</kbd>
          </Button>

          <nav className="space-y-0.5" aria-label="Main">
            {NAV.map((n) => (
              <NavItem key={n.to} {...n} />
            ))}
            <NavItem to="/app/archive" label="Archive" icon={Archive} />
          </nav>

          <div className="mt-auto space-y-2">
            {install.canPrompt && !install.installed && (
              <button
                type="button"
                onClick={install.install}
                className="glass-soft flex w-full items-center gap-3 rounded-2xl p-3 text-left text-xs transition hover:bg-fg/5"
              >
                <span className="bg-gradient-accent grid size-8 shrink-0 place-items-center rounded-xl text-white">
                  <Download className="size-4" />
                </span>
                <span>
                  <span className="block font-semibold">Install the app</span>
                  <span className="text-subtle">Works offline, opens from your dock</span>
                </span>
              </button>
            )}
            <NavItem to="/app/settings" label="Settings" icon={Settings} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 px-3 pt-3 lg:pl-0">
          <div className="glass flex h-14 items-center gap-2 rounded-2xl px-3 sm:px-4">
            <Link to="/app" className="flex items-center gap-2 lg:hidden" aria-label={`${APP_NAME} home`}>
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-surface/50 px-3 text-sm text-subtle transition hover:bg-surface/80 hover:text-muted sm:max-w-sm"
            >
              <Search className="size-4 shrink-0" />
              <span className="truncate">Search applications, contacts…</span>
              <span className="ml-auto hidden sm:block">
                <Kbd>⌘K</Kbd>
              </span>
            </button>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Menu
                trigger={(p) => (
                  <button
                    {...p}
                    type="button"
                    aria-label="Account menu"
                    className="bg-gradient-accent glow grid size-9 place-items-center rounded-full text-xs font-semibold text-white"
                  >
                    {initials(displayName || 'U')}
                  </button>
                )}
                items={[
                  { label: 'Contacts', icon: <Users className="size-4" />, onSelect: () => navigate('/app/contacts') },
                  { label: 'Offers', icon: <HandCoins className="size-4" />, onSelect: () => navigate('/app/offers') },
                  { label: 'Analytics', icon: <BarChart3 className="size-4" />, onSelect: () => navigate('/app/analytics') },
                  { label: 'Archive', icon: <Archive className="size-4" />, onSelect: () => navigate('/app/archive') },
                  { label: 'Settings', icon: <Settings className="size-4" />, onSelect: () => navigate('/app/settings') },
                  {
                    label: status === 'demo' ? 'Exit demo' : 'Sign out',
                    icon: <LogOut className="size-4" />,
                    onSelect: onSignOut,
                  },
                ]}
              />
            </div>
          </div>
        </header>

        {status === 'demo' && (
          <div className="px-3 pt-3 lg:pl-0">
            <div className="glass-soft flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl px-4 py-2 text-center text-xs">
              <span>You're exploring with sample data. Changes stay in this browser.</span>
              <Link to="/signup" className="text-gradient font-semibold hover:underline">
                Create a free account →
              </Link>
            </div>
          </div>
        )}

        <main key={location.pathname} className="mx-auto w-full max-w-7xl flex-1 animate-enter px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
        <div className="glass-strong grid grid-cols-5 rounded-2xl pb-[env(safe-area-inset-bottom)]">
          {NAV.slice(0, 2).map((n) => (
            <MobileItem key={n.to} {...n} />
          ))}
          <button type="button" onClick={() => openNew()} className="grid place-items-center py-2" aria-label="New application">
            <span className="bg-gradient-accent glow grid size-11 -translate-y-3 place-items-center rounded-2xl text-white">
              <Plus className="size-5" />
            </span>
          </button>
          <MobileItem {...NAV[2]} />
          <MobileItem {...NAV[5]} />
        </div>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function NavItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof List; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition',
          isActive ? 'bg-surface/80 text-fg shadow-sm' : 'text-muted hover:bg-fg/5 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="bg-gradient-accent absolute inset-y-2 left-0 w-1 rounded-full" />}
          <Icon className={cn('size-4', isActive && 'text-accent')} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function MobileItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof List; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium', isActive ? 'text-accent' : 'text-subtle')
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  );
}
