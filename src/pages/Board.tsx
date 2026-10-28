import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CalendarClock, Plus, UserCheck } from 'lucide-react';
import { useActiveApplications, useMoveApplication } from '@/hooks/useApplications';
import { useApplicationDialogs } from '@/components/applications/ApplicationDialogs';
import { CompanyAvatar, salaryText } from '@/components/applications/bits';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Skeleton } from '@/components/ui';
import { STAGES, type StageMeta } from '@/lib/constants';
import { cn, parseDate, relativeDays } from '@/lib/utils';
import type { Application, Status } from '@/types';

export default function Board() {
  const { data: apps, isLoading } = useActiveApplications();
  const move = useMoveApplication();
  const { openNew } = useApplicationDialogs();
  const [dragging, setDragging] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const by: Record<Status, Application[]> = { wishlist: [], referral: [], applied: [], interviewing: [], offer: [], rejected: [] };
    for (const a of apps) by[a.status].push(a);
    const prio = { high: 0, medium: 1, low: 2 };
    for (const k of Object.keys(by) as Status[]) {
      by[k].sort((x, y) => prio[x.priority] - prio[y.priority] || y.updatedAt.localeCompare(x.updatedAt));
    }
    return by;
  }, [apps]);

  const onDragStart = (e: DragStartEvent) => setDragging(apps.find((a) => a.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const app = apps.find((a) => a.id === e.active.id);
    const to = e.over?.id as Status | undefined;
    if (app && to) move(app, to);
  };

  return (
    <>
      <PageHeader
        title="Board"
        description="Drag cards between stages. Moves are added to each application's timeline."
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="size-4" /> New
          </Button>
        }
      />
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {STAGES.map((s) => (
            <Skeleton key={s.id} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          autoScroll={{ threshold: { x: 0.06, y: 0.1 }, acceleration: 6 }}
          onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <div className="scrollbar-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
            {STAGES.map((stage) => (
              <Column key={stage.id} stage={stage} apps={columns[stage.id]} onAdd={() => openNew(stage.id)} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>{dragging && <CardBody app={dragging} lifted />}</DragOverlay>
        </DndContext>
      )}
    </>
  );
}

function Column({ stage, apps, onAdd }: { stage: StageMeta; apps: Application[]; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <section
      ref={setNodeRef}
      aria-label={stage.label}
      className={cn(
        'flex w-72 shrink-0 snap-start flex-col rounded-xl border border-transparent bg-surface-2/60 p-2 transition',
        isOver && 'border-accent bg-accent-soft',
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pb-2 pt-1">
        <span className={cn('size-2 rounded-full', stage.dot)} />
        <h2 className="text-sm font-semibold">{stage.label}</h2>
        <span className="text-xs text-subtle">{apps.length}</span>
        <button type="button" onClick={onAdd} aria-label={`Add to ${stage.label}`} className="ml-auto rounded-md p-1 text-subtle hover:bg-surface hover:text-fg">
          <Plus className="size-4" />
        </button>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2">
        {apps.map((a) => (
          <DraggableCard key={a.id} app={a} />
        ))}
        {apps.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-border py-6 text-xs text-subtle">Drop here</div>
        )}
      </div>
    </section>
  );
}

function DraggableCard({ app }: { app: Application }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/app/applications/${app.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/app/applications/${app.id}`);
        listeners?.onKeyDown?.(e);
      }}
      aria-label={`${app.company}, ${app.title}. Press space to move.`}
      className={cn('cursor-grab touch-manipulation rounded-lg active:cursor-grabbing', isDragging && 'opacity-30')}
    >
      <CardBody app={app} />
    </div>
  );
}

function CardBody({ app, lifted }: { app: Application; lifted?: boolean }) {
  const salary = salaryText(app);
  const nextInterview = app.interviews
    .filter((i) => !i.completed && (parseDate(i.date)?.getTime() ?? 0) >= Date.now() - 864e5)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const due = app.status === 'wishlist' || app.status === 'referral' ? app.plannedApplyDate || app.deadline : null;

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-surface p-3 shadow-sm transition hover:border-accent/40',
        lifted && 'rotate-2 shadow-xl ring-2 ring-accent/40',
      )}
    >
      <div className="flex items-start gap-2.5">
        <CompanyAvatar name={app.company} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{app.company}</h3>
          <p className="truncate text-xs text-muted">{app.title}</p>
        </div>
        {app.priority === 'high' && <span className="mt-1 size-2 shrink-0 rounded-full bg-rose-500" title="High priority" />}
      </div>
      {(salary || app.location) && (
        <p className="mt-2 truncate text-xs text-subtle">{[salary, app.location || app.workType].filter(Boolean).join(' · ')}</p>
      )}
      {(nextInterview || due || app.referralStatus === 'referral_received') && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {nextInterview && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
              <CalendarClock className="size-3" /> {relativeDays(nextInterview.date.slice(0, 10))}
            </span>
          )}
          {due && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
              Apply {relativeDays(due)}
            </span>
          )}
          {app.referralStatus === 'referral_received' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <UserCheck className="size-3" /> Referred
            </span>
          )}
        </div>
      )}
    </article>
  );
}
