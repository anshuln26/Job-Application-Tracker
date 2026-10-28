import { STAGE_BY_ID, PRIORITIES } from '@/lib/constants';
import { cn, hueFor, initials } from '@/lib/utils';
import { formatRange } from '@/lib/currency';
import { SALARY_PERIODS } from '@/lib/constants';
import type { Application, Priority, Status } from '@/types';
import { Badge } from '@/components/ui';

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = STAGE_BY_ID[status];
  return (
    <Badge className={cn(s.pill, className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </Badge>
  );
}

export function PriorityLabel({ priority }: { priority: Priority }) {
  const p = PRIORITIES.find((x) => x.id === priority)!;
  return <span className={cn('text-xs font-medium', p.cls)}>{p.label}</span>;
}

export function CompanyAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = hueFor(name);
  return (
    <div
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg font-semibold',
        'bg-[hsl(var(--h)_70%_92%)] text-[hsl(var(--h)_55%_32%)] dark:bg-[hsl(var(--h)_30%_20%)] dark:text-[hsl(var(--h)_70%_80%)]',
        size === 'sm' && 'size-7 text-[10px]',
        size === 'md' && 'size-9 text-xs',
        size === 'lg' && 'size-12 text-sm',
      )}
      style={{ '--h': h } as React.CSSProperties}
    >
      {initials(name)}
    </div>
  );
}

export function salaryText(app: Application): string | null {
  if (app.salaryUndisclosed) return 'Not disclosed';
  const range = formatRange(app.salaryMin, app.salaryMax, app.currency);
  if (!range) return null;
  const unit = SALARY_PERIODS.find((p) => p.id === app.salaryPeriod)?.unit ?? '';
  return `${range}${unit}`;
}
