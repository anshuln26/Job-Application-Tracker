import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Crown, HandCoins, Info, Plus, X } from 'lucide-react';
import { useActiveApplications, useUpdateApplication } from '@/hooks/useApplications';
import { usePreferences } from '@/hooks/usePreferences';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompanyAvatar } from '@/components/applications/bits';
import { Card, CountUp, EmptyState, Select, Skeleton, Switch } from '@/components/ui';
import { CURRENCIES, formatMoney } from '@/lib/currency';
import { INDIA_TAX, computeOffer, convertBreakdown, defaultOfferDetails } from '@/lib/tax';
import { cn } from '@/lib/utils';
import type { Application, OfferDetails } from '@/types';

export default function Offers() {
  const { data: apps, isLoading } = useActiveApplications();
  const { currency, setCurrency } = usePreferences();
  const [extra, setExtra] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  const offers = useMemo(
    () => apps.filter((a) => (a.status === 'offer' || extra.includes(a.id)) && !hidden.includes(a.id)),
    [apps, extra, hidden],
  );
  const candidates = apps.filter((a) => !offers.includes(a) && a.status !== 'rejected');

  const results = useMemo(
    () => offers.map((a) => ({ app: a, b: convertBreakdown(computeOffer(a), currency) })),
    [offers, currency],
  );
  const best = results.length > 1 ? results.reduce((x, y) => (y.b.firstYearValue > x.b.firstYearValue ? y : x)) : null;
  const maxValue = Math.max(1, ...results.map((r) => r.b.firstYearValue));

  return (
    <>
      <PageHeader
        title="Offer comparison"
        description="Compare offers side by side — CTC, monthly in-hand after tax and PF, and first-year value."
        actions={
          <Select aria-label="Compare in currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[520px]" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="size-5" />}
          title="No offers to compare yet"
          description="Applications in the Offer stage show up here automatically. You can also add any application to model a possible offer."
          action={<AddPicker candidates={candidates} onPick={(id) => setExtra((e) => [...e, id])} />}
        />
      ) : (
        <>
          {results.length > 1 && (
            <Card className="mb-4 p-4">
              <h2 className="mb-3 text-sm font-semibold">First-year value ({currency})</h2>
              <div className="space-y-2.5">
                {results.map(({ app, b }) => (
                  <div key={app.id} className="flex items-center gap-3">
                    <span className="w-28 truncate text-sm font-medium sm:w-40">{app.company}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-fg/8">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', best?.app.id === app.id ? 'bg-gradient-accent' : 'bg-fg/25')}
                        style={{ width: `${(b.firstYearValue / maxValue) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatMoney(b.firstYearValue, currency)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map(({ app }) => (
              <OfferCard
                key={app.id}
                app={app}
                displayCurrency={currency}
                best={best?.app.id === app.id}
                removable={app.status !== 'offer'}
                onRemove={() => (app.status === 'offer' ? setHidden((h) => [...h, app.id]) : setExtra((e) => e.filter((x) => x !== app.id)))}
              />
            ))}
            <div className="glass-soft grid min-h-48 place-items-center rounded-2xl border-dashed p-6">
              <AddPicker candidates={candidates} onPick={(id) => setExtra((e) => [...e, id])} />
            </div>
          </div>
        </>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs text-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Estimates only. India: {INDIA_TAX.label} — ₹75,000 standard deduction, 87A rebate up to ₹12L, surcharge, 4% cess, ~₹
        {INDIA_TAX.professionalTax.toLocaleString('en-IN')} professional tax and 12% employee PF on basic. Stocks are shown at face value (taxed when they vest).
        Other countries use the tax % you enter. Currency conversion uses reference rates.
      </p>
    </>
  );
}

function AddPicker({ candidates, onPick }: { candidates: Application[]; onPick: (id: string) => void }) {
  if (!candidates.length) return <p className="text-sm text-muted">Add more applications to compare them here.</p>;
  return (
    <label className="flex flex-col items-center gap-2 text-sm text-muted">
      <span className="bg-gradient-accent grid size-10 place-items-center rounded-2xl text-white">
        <Plus className="size-5" />
      </span>
      Model another offer
      <Select aria-label="Add an application to compare" value="" onChange={(e) => e.target.value && onPick(e.target.value)} className="w-60">
        <option value="">Choose an application…</option>
        {candidates.map((a) => (
          <option key={a.id} value={a.id}>
            {a.company} — {a.title}
          </option>
        ))}
      </Select>
    </label>
  );
}

function OfferCard({
  app,
  displayCurrency,
  best,
  removable,
  onRemove,
}: {
  app: Application;
  displayCurrency: string;
  best: boolean;
  removable: boolean;
  onRemove: () => void;
}) {
  const { mutate: save } = useUpdateApplication();
  const [d, setD] = useState<OfferDetails>(() => app.offerDetails ?? defaultOfferDetails(app));
  const isIndia = computeOffer(app, d).isIndia;
  const first = useRef(true);

  // Save edits shortly after the user stops typing
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => save({ id: app.id, patch: { offerDetails: d } }), 600);
    return () => clearTimeout(t);
  }, [d, app.id, save]);

  const live = convertBreakdown(computeOffer(app, d), displayCurrency);
  const set = <K extends keyof OfferDetails>(k: K, v: OfferDetails[K]) => setD((p) => ({ ...p, [k]: v }));
  const money = (n: number) => formatMoney(n, displayCurrency);

  return (
    <div className={cn('glass relative flex flex-col rounded-3xl p-5', best && 'ring-gradient')}>
      {best && (
        <span className="bg-gradient-accent glow absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">
          <Crown className="size-3" /> Best first-year value
        </span>
      )}
      <div className="flex items-start gap-3">
        <CompanyAvatar name={app.company} size="lg" />
        <div className="min-w-0 flex-1">
          <Link to={`/app/applications/${app.id}`} className="block truncate font-semibold hover:text-accent">
            {app.company}
          </Link>
          <p className="truncate text-xs text-muted">{app.title}</p>
          <p className="text-[11px] text-subtle">Amounts in {app.currency} per year</p>
        </div>
        {removable && (
          <button type="button" onClick={onRemove} aria-label="Remove from comparison" className="rounded-lg p-1 text-subtle hover:bg-fg/5 hover:text-fg">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-fg/[0.03] p-4 text-center">
        <div className="text-xs font-medium text-muted">Monthly in-hand</div>
        <div className="text-gradient mt-1 text-3xl font-bold tracking-tight tabular-nums">
          <CountUp value={live.monthlyInHand} format={(n) => formatMoney(Math.round(n), displayCurrency, { compact: false })} />
        </div>
        <div className="mt-1 text-[11px] text-subtle">
          {Math.round(live.effectiveTaxRate * 100)}% effective tax{d.pf ? ' · after PF' : ''}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <NumberField label="Fixed / base" value={d.base} onChange={(v) => set('base', v)} />
        <NumberField label="Variable bonus" value={d.bonus} onChange={(v) => set('bonus', v)} />
        <NumberField label="Joining bonus" value={d.joiningBonus} onChange={(v) => set('joiningBonus', v)} />
        <NumberField label="Stocks / ESOPs per yr" value={d.stocks} onChange={(v) => set('stocks', v)} />
        <NumberField label="Other benefits" value={d.other} onChange={(v) => set('other', v)} />
        {isIndia ? (
          <NumberField label="Basic % of fixed" value={d.basicPercent} onChange={(v) => set('basicPercent', Math.min(100, Math.max(0, v ?? 0)))} />
        ) : (
          <NumberField label="Est. tax %" value={d.foreignTaxPercent} onChange={(v) => set('foreignTaxPercent', v)} />
        )}
      </div>
      {isIndia && (
        <label className="mt-3 flex items-center justify-between text-xs text-muted">
          Deduct 12% employee PF
          <Switch checked={d.pf} onChange={(v) => set('pf', v)} label="Deduct employee PF" />
        </label>
      )}

      <dl className="mt-4 space-y-1.5 border-t border-border/50 pt-4 text-sm">
        <Row label="CTC" value={money(live.ctc)} />
        <Row label="Income tax" value={`− ${money(live.tax)}`} />
        {live.employeePf > 0 && <Row label="Employee PF (savings)" value={`− ${money(live.employeePf)}`} />}
        <Row label="First-year cash" value={money(live.firstYearCash)} />
        <Row label="First-year total value" value={money(live.firstYearValue)} strong />
      </dl>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-subtle">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="h-8 w-full rounded-lg border border-border/70 bg-surface/60 px-2 text-sm tabular-nums focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className={cn('text-muted', strong && 'font-medium text-fg')}>{label}</dt>
      <dd className={cn('tabular-nums', strong && 'font-semibold')}>{value}</dd>
    </div>
  );
}
