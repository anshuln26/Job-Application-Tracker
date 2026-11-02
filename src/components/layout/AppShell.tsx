import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Archive,
  BarChart3,
  CalendarDays,
  Columns3,
  LayoutDashboard,
  List,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Kbd, Menu } from '@/components/ui';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { usePreferences } from '@/hooks/usePreferences';
import { APP_NAME } from '@/lib/constants';
import { cn, initials } from '@/lib/utils';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/board', label: 'Board', icon: Columns3 },
  { to: '/app/applications', label: 'Applications', icon: List },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
];

export function AppShell() {
  const { status, displayName, signOut } = useAuth();
  const { openNew } = useApplicationDialogs();
  const { theme, setTheme } = usePreferences();
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
    <div className="flex min-h-full">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 lg:flex">
        <Link to="/app" className="mb-6 flex items-center gap-2 px-2">
          <Logo />
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <Button className="mb-4 w-full justify-between" onClick={() => openNew()}>
          <span className="flex items-center gap-2">
            <Plus className="size-4" /> New application
          </span>
          <Kbd>N</Kbd>
        </Button>

        <nav className="space-y-0.5" aria-label="Main">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
          <NavItem to="/app/archive" label="Archive" icon={Archive} />
        </nav>

        <div className="mt-auto space-y-0.5">
          <NavItem to="/app/settings" label="Settings" icon={Settings} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-6">
          <Link to="/app" className="flex items-center gap-2 lg:hidden" aria-label={`${APP_NAME} home`}>
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-subtle shadow-sm hover:text-muted sm:max-w-sm"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search applications…</span>
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
                  className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
                >
                  {initials(displayName || 'U')}
                </button>
              )}
              items={[
                { label: 'Settings', icon: <Settings className="size-4" />, onSelect: () => navigate('/app/settings') },
                {
                  label: status === 'demo' ? 'Exit demo' : 'Sign out',
                  icon: <LogOut className="size-4" />,
                  onSelect: onSignOut,
                },
              ]}
            />
          </div>
        </header>

        {status === 'demo' && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-border bg-accent-soft px-4 py-2 text-center text-xs text-fg">
            <span>You're exploring with sample data. Changes stay in this browser.</span>
            <Link to="/signup" className="font-semibold text-accent hover:underline">
              Create a free account →
            </Link>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV.slice(0, 2).map((n) => (
          <MobileItem key={n.to} {...n} />
        ))}
        <button
          type="button"
          onClick={() => openNew()}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-accent"
          aria-label="New application"
        >
          <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg shadow">
            <Plus className="size-5" />
          </span>
        </button>
        {NAV.slice(2, 4).map((n) => (
          <MobileItem key={n.to} {...n} />
        ))}
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
          'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition',
          isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      <Icon className="size-4" />
      {label}
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
