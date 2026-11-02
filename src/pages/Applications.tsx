import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Download,
  FileUp,
  Inbox,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  useApplications,
  useDeleteApplication,
  useImportApplications,
  useUpdateApplication,
} from '@/hooks/useApplications';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { CompanyAvatar, PriorityLabel, StatusBadge, salaryText } from '@/components/applications/bits';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ConfirmDialog, EmptyState, Input, Menu, Select, Skeleton } from '@/components/ui';
import { STAGES, WORK_TYPES } from '@/lib/constants';
import { download, fromCSV, toCSV } from '@/lib/csv';
import { annualMidpoint } from '@/lib/stats';
import { cn, formatDate } from '@/lib/utils';
import type { Application, Status } from '@/types';

type SortKey = 'company' | 'status' | 'appliedDate' | 'salary' | 'updatedAt';

const STATUS_ORDER = Object.fromEntries(STAGES.map((s, i) => [s.id, i])) as Record<Status, number>;

export default function Applications({ archived = false }: { archived?: boolean }) {
  const { data = [], isLoading } = useApplications();
  const { openNew } = useApplicationDialogs();
  const update = useUpdateApplication();
  const remove = useDeleteApplication();
  const importMany = useImportApplications();
  const fileInput = useRef<HTMLInputElement>(null);

  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const status = (params.get('status') ?? '') as Status | '';
  const workType = params.get('work') ?? '';
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'updatedAt', dir: -1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = data.filter(
      (a) =>
        a.archived === archived &&
        (!status || a.status === status) &&
        (!workType || a.workType === workType) &&
        (!term || `${a.company} ${a.title} ${a.location} ${a.tags.join(' ')} ${a.notes}`.toLowerCase().includes(term)),
    );
    const val = (a: Application): string | number => {
      switch (sort.key) {
        case 'company':
          return a.company.toLowerCase();
        case 'status':
          return STATUS_ORDER[a.status];
        case 'appliedDate':
          return a.appliedDate ?? a.plannedApplyDate ?? '';
        case 'salary':
          return annualMidpoint(a, 'USD') ?? -1;
        default:
          return a.updatedAt;
      }
    };
    return filtered.sort((x, y) => {
      const a = val(x);
      const b = val(y);
      return (a < b ? -1 : a > b ? 1 : 0) * sort.dir;
    });
  }, [data, archived, status, workType, q, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'company' ? 1 : -1 }));

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const setArchived = (ids: string[], value: boolean) => {
    for (const id of ids) update.mutate({ id, patch: { archived: value, archivedAt: value ? new Date().toISOString() : null } });
    setSelected(new Set());
    toast.success(`${value ? 'Archived' : 'Restored'} ${ids.length} application${ids.length === 1 ? '' : 's'}`);
  };

  const bulkStatus = (to: Status) => {
    for (const id of selected) update.mutate({ id, patch: { status: to } });
    setSelected(new Set());
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    for (const id of confirmDelete) remove.mutate(id);
    toast.success(`Deleted ${confirmDelete.length} application${confirmDelete.length === 1 ? '' : 's'}`);
    setSelected(new Set());
    setConfirmDelete(null);
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const inputs = file.name.endsWith('.json')
        ? (JSON.parse(text) as Application[]).map(({ id: _id, createdAt: _c, updatedAt: _u, ...rest }) => rest)
        : fromCSV(text);
      if (inputs.length === 0) return toast.error('No applications found in that file');
      importMany.mutate(inputs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read that file');
    }
  };

  const exportAs = (kind: 'csv' | 'json') => {
    const list = data.filter((a) => a.archived === archived);
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'csv') download(`applications-${stamp}.csv`, toCSV(list));
    else download(`applications-${stamp}.json`, JSON.stringify(list, null, 2), 'application/json');
  };

  const filtersActive = Boolean(q || status || workType);

  return (
    <>
      <PageHeader
        title={archived ? 'Archive' : 'Applications'}
        description={
          archived ? 'Archived applications are hidden from the board, dashboard and analytics.' : `${rows.length} of ${data.filter((a) => !a.archived).length}`
        }
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = '';
              }}
            />
            <Menu
              trigger={(p) => (
                <Button variant="secondary" {...p}>
                  <Download className="size-4" /> Export
                </Button>
              )}
              items={[
                { label: 'Export CSV', onSelect: () => exportAs('csv') },
                { label: 'Export JSON (full backup)', onSelect: () => exportAs('json') },
              ]}
            />
            {!archived && (
              <>
                <Button variant="secondary" onClick={() => fileInput.current?.click()} loading={importMany.isPending}>
                  <FileUp className="size-4" /> Import
                </Button>
                <Button onClick={() => openNew()}>
                  <Plus className="size-4" /> New
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="Search company, role, tag, notes…" className="pl-9" aria-label="Search" />
        </div>
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Filter by stage" className="sm:w-40">
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select value={workType} onChange={(e) => setParam('work', e.target.value)} aria-label="Filter by work type" className="sm:w-40">
            <option value="">Any location</option>
            {WORK_TYPES.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </Select>
          {filtersActive && (
            <Button variant="ghost" size="icon" aria-label="Clear filters" onClick={() => setParams({}, { replace: true })}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {!archived && (
              <Select aria-label="Move selected to stage" className="h-8 w-40 text-xs" value="" onChange={(e) => e.target.value && bulkStatus(e.target.value as Status)}>
                <option value="">Move to…</option>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
            <Button size="sm" variant="secondary" onClick={() => setArchived([...selected], !archived)}>
              {archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
              {archived ? 'Restore' : 'Archive'}
            </Button>
            <Button size="sm" variant="secondary" className="text-danger" onClick={() => setConfirmDelete([...selected])}>
              <Trash2 className="size-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={archived ? <Archive className="size-5" /> : <Inbox className="size-5" />}
          title={filtersActive ? 'No matches' : archived ? 'Nothing archived' : 'No applications yet'}
          description={
            filtersActive
              ? 'Try a different search or clear the filters.'
              : archived
                ? 'Archive applications you no longer want to see day-to-day. You can restore them any time.'
                : 'Add one manually or import a CSV.'
          }
          action={
            !archived && !filtersActive ? (
              <Button onClick={() => openNew()}>
                <Plus className="size-4" /> New application
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {/* Desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-border bg-surface-2/60 text-left text-xs text-muted">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className="size-4 accent-[var(--accent)]" />
                </th>
                <Th label="Company" k="company" sort={sort} onSort={toggleSort} />
                <Th label="Stage" k="status" sort={sort} onSort={toggleSort} />
                <th className="px-3 py-2.5 font-medium">Location</th>
                <Th label="Pay" k="salary" sort={sort} onSort={toggleSort} />
                <Th label="Applied" k="appliedDate" sort={sort} onSort={toggleSort} />
                <th className="px-3 py-2.5 font-medium">Priority</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id} className={cn('group hover:bg-surface-2/50', selected.has(a.id) && 'bg-accent-soft/50')}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${a.company}`}
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="size-4 accent-[var(--accent)]"
                    />
                  </td>
                  <td className="max-w-72 px-3 py-2.5">
                    <Link to={`/app/applications/${a.id}`} className="flex items-center gap-3">
                      <CompanyAvatar name={a.company} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate font-medium group-hover:text-accent">{a.company}</div>
                        <div className="truncate text-xs text-muted">{a.title}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="max-w-44 truncate px-3 py-2.5 text-muted">{a.location || a.workType}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{salaryText(a) ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {a.appliedDate ? formatDate(a.appliedDate, 'd MMM') : a.plannedApplyDate ? `Plan ${formatDate(a.plannedApplyDate, 'd MMM')}` : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <PriorityLabel priority={a.priority} />
                  </td>
                  <td className="px-2">
                    <RowMenu app={a} onArchive={(v) => setArchived([a.id], v)} onDelete={() => setConfirmDelete([a.id])} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <ul className="divide-y divide-border md:hidden">
            {rows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3 py-3">
                <Link to={`/app/applications/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <CompanyAvatar name={a.company} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.company}</div>
                    <div className="truncate text-xs text-muted">{a.title}</div>
                    <div className="mt-1">
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                </Link>
                <RowMenu app={a} onArchive={(v) => setArchived([a.id], v)} onDelete={() => setConfirmDelete([a.id])} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        title={`Delete ${confirmDelete?.length === 1 ? 'application' : `${confirmDelete?.length} applications`}?`}
        description="This permanently removes them, including timeline and interviews. Archive instead if you might want them later."
      />
    </>
  );
}

function Th({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  return (
    <th className="px-3 py-2.5 font-medium" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(k)} className={cn('inline-flex items-center gap-1 hover:text-fg', active && 'text-fg')}>
        {label}
        {active && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  );
}

function RowMenu({ app, onArchive, onDelete }: { app: Application; onArchive: (v: boolean) => void; onDelete: () => void }) {
  const { openEdit } = useApplicationDialogs();
  return (
    <Menu
      trigger={(p) => (
        <Button {...p} variant="ghost" size="icon" aria-label={`Actions for ${app.company}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      )}
      items={[
        ...(app.archived ? [] : [{ label: 'Edit', onSelect: () => openEdit(app) }]),
        { label: app.archived ? 'Restore' : 'Archive', onSelect: () => onArchive(!app.archived) },
        { label: 'Delete', danger: true, onSelect: onDelete },
      ]}
    />
  );
}
