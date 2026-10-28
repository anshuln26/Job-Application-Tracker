import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useActiveApplications } from '@/hooks/useApplications';
import { usePreferences } from '@/hooks/usePreferences';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, EmptyState, Select } from '@/components/ui';
import { CompanyAvatar } from '@/components/applications/bits';
import { annualMidpoint, bySource, countByStatus, summarize, weeklyActivity } from '@/lib/stats';
import { CURRENCIES, formatMoney } from '@/lib/currency';
import { STAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STAGE_HEX: Record<string, string> = {
  wishlist: '#94a3b8',
  referral: '#8b5cf6',
  applied: '#0ea5e9',
  interviewing: '#f59e0b',
  offer: '#10b981',
  rejected: '#f43f5e',
};

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--fg)',
};

export default function Analytics() {
  const { data: apps } = useActiveApplications();
  const { currency, setCurrency } = usePreferences();

  const s = useMemo(() => summarize(apps), [apps]);
  const counts = useMemo(() => countByStatus(apps), [apps]);
  const weekly = useMemo(() => weeklyActivity(apps, 10), [apps]);
  const sources = useMemo(() => bySource(apps), [apps]);
  const pay = useMemo(
    () =>
      apps
        .map((a) => ({ app: a, value: annualMidpoint(a, currency) }))
        .filter((x): x is { app: (typeof apps)[number]; value: number } => x.value !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [apps, currency],
  );

  if (apps.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" />
        <EmptyState icon={<BarChart3 className="size-5" />} title="No data yet" description="Charts appear once you've added a few applications." />
      </>
    );
  }

  // Funnel: how many applications reached at least each step
  const reachedInterview = counts.interviewing + counts.offer + apps.filter((a) => a.status === 'rejected' && a.interviews.length > 0).length;
  const funnel = [
    { label: 'Submitted', value: s.submitted },
    { label: 'Interviewed', value: reachedInterview },
    { label: 'Offer', value: counts.offer },
  ];
  const stageData = STAGES.map((st) => ({ name: st.label, id: st.id, value: counts[st.id] }));
  const maxPay = pay[0]?.value ?? 1;

  return (
    <>
      <PageHeader title="Analytics" description="How your search is going, at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Submitted" value={s.submitted} />
        <Metric label="Response rate" value={`${s.responseRate}%`} hint="reached interview" />
        <Metric label="Offer rate" value={`${s.offerRate}%`} />
        <Metric label="Rejected" value={s.rejected} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Applications per week</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={weekly} margin={{ left: -24, right: 4, top: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--subtle)' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--subtle)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="count" name="Applications" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">By stage</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={stageData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={86} tick={{ fontSize: 12, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="value" name="Applications" radius={[0, 4, 4, 0]}>
                  {stageData.map((d) => (
                    <Cell key={d.id} fill={STAGE_HEX[d.id]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Conversion funnel</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => {
              const pct = funnel[0].value ? Math.round((f.value / funnel[0].value) * 100) : 0;
              return (
                <div key={f.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{f.label}</span>
                    <span className="text-muted">
                      {f.value} · {pct}%
                    </span>
                  </div>
                  <div className="h-7 overflow-hidden rounded-md bg-surface-2">
                    <div
                      className={cn('h-full rounded-md', i === 0 ? 'bg-sky-500' : i === 1 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.max(pct, f.value ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Which sources work</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-muted">Set a source on your applications to see this.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-subtle">
                <tr>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 text-right font-medium">Applied</th>
                  <th className="pb-2 text-right font-medium">Interview+</th>
                  <th className="pb-2 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((r) => (
                  <tr key={r.source}>
                    <td className="py-2">{r.source}</td>
                    <td className="py-2 text-right text-muted">{r.total}</td>
                    <td className="py-2 text-right text-muted">{r.progressed}</td>
                    <td className="py-2 text-right font-medium">{Math.round((r.progressed / r.total) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Compensation comparison</h2>
              <p className="text-xs text-muted">Midpoint, annualized and converted at reference rates.</p>
            </div>
            <Select aria-label="Display currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-8 w-24 text-xs">
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          {pay.length === 0 ? (
            <p className="text-sm text-muted">Add salary ranges to compare offers.</p>
          ) : (
            <ul className="space-y-2.5">
              {pay.map(({ app, value }) => (
                <li key={app.id} className="flex items-center gap-3">
                  <CompanyAvatar name={app.company} size="sm" />
                  <div className="w-32 min-w-0 shrink-0 sm:w-48">
                    <div className="truncate text-sm font-medium">{app.company}</div>
                    <div className="truncate text-xs text-muted">{app.title}</div>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${(value / maxPay) * 100}%`, background: STAGE_HEX[app.status] }} />
                  </div>
                  <span className="w-20 text-right text-sm font-medium tabular-nums">{formatMoney(value, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-subtle">{hint}</div>}
    </Card>
  );
}
