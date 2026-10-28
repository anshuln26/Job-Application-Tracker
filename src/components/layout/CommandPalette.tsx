import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { useApplications } from '@/hooks/useApplications';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { CompanyAvatar, StatusBadge } from '@/components/applications/bits';
import { cn } from '@/lib/utils';

const PAGES = [
  { label: 'Dashboard', to: '/app' },
  { label: 'Board', to: '/app/board' },
  { label: 'Applications', to: '/app/applications' },
  { label: 'Calendar', to: '/app/calendar' },
  { label: 'Analytics', to: '/app/analytics' },
  { label: 'Archive', to: '/app/archive' },
  { label: 'Settings', to: '/app/settings' },
];

type Item =
  | { kind: 'action'; id: string; label: string; run: () => void }
  | { kind: 'page'; id: string; label: string; run: () => void }
  | { kind: 'app'; id: string; label: string; run: () => void; app: NonNullable<ReturnType<typeof useApplications>['data']>[number] };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mounting fresh on every open resets the query and selection
  return open ? <Palette onClose={onClose} /> : null;
}

function Palette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data = [] } = useApplications();
  const { openNew } = useApplicationDialogs();

  useEffect(() => {
    requestAnimationFrame(() => input.current?.focus());
  }, []);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    const go = (to: string) => () => {
      navigate(to);
      onClose();
    };
    const apps: Item[] = data
      .filter((a) => !term || `${a.company} ${a.title} ${a.location} ${a.tags.join(' ')}`.toLowerCase().includes(term))
      .slice(0, 8)
      .map((a) => ({ kind: 'app', id: a.id, label: `${a.company} — ${a.title}`, app: a, run: go(`/app/applications/${a.id}`) }));
    const pages: Item[] = PAGES.filter((p) => !term || p.label.toLowerCase().includes(term)).map((p) => ({
      kind: 'page',
      id: p.to,
      label: p.label,
      run: go(p.to),
    }));
    const actions: Item[] = [
      {
        kind: 'action',
        id: 'new',
        label: 'New application',
        run: () => {
          onClose();
          openNew();
        },
      },
    ];
    return [...actions, ...apps, ...pages];
  }, [q, data, navigate, onClose, openNew]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[active]?.run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-subtle" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search companies, roles, pages…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `pi-${items[active].id}` : undefined}
          />
        </div>
        <ul id="palette-list" role="listbox" className="scrollbar-thin max-h-80 overflow-y-auto p-1.5">
          {items.map((it, i) => (
            <li
              key={`${it.kind}-${it.id}`}
              id={`pi-${it.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={it.run}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm',
                i === active ? 'bg-surface-2' : '',
              )}
            >
              {it.kind === 'app' ? (
                <>
                  <CompanyAvatar name={it.app.company} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.app.company}</div>
                    <div className="truncate text-xs text-muted">{it.app.title}</div>
                  </div>
                  <StatusBadge status={it.app.status} />
                </>
              ) : (
                <>
                  <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted">
                    {it.kind === 'action' ? <Plus className="size-4" /> : <ArrowRight className="size-4" />}
                  </span>
                  <span className="flex-1">{it.label}</span>
                  {it.kind === 'page' && <span className="text-xs text-subtle">Page</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
