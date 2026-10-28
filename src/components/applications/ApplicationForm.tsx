import { useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import {
  PRE_APPLY,
  PRIORITIES,
  REFERRAL_STATUSES,
  RESUME_CURATION,
  SALARY_PERIODS,
  SOURCES,
  STAGES,
  VISA_STATUSES,
  WORK_TYPES,
} from '@/lib/constants';
import { CURRENCIES } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { ApplicationInput } from '@/types';

interface Props {
  initial: ApplicationInput;
  submitLabel: string;
  onSubmit: (value: ApplicationInput) => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ApplicationForm({ initial, submitLabel, onSubmit, onCancel, saving }: Props) {
  const [v, setV] = useState<ApplicationInput>(initial);
  const [tagDraft, setTagDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [more, setMore] = useState(
    Boolean(initial.salaryMin || initial.referralStatus !== 'none' || initial.contactName || initial.notes),
  );

  const set = <K extends keyof ApplicationInput>(k: K, value: ApplicationInput[K]) =>
    setV((prev) => ({ ...prev, [k]: value }));
  const preApply = PRE_APPLY.includes(v.status);

  const addTag = () => {
    const t = tagDraft.trim().replace(/,$/, '');
    if (t && !v.tags.includes(t)) set('tags', [...v.tags, t]);
    setTagDraft('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.company.trim()) errs.company = 'Company is required';
    if (!v.title.trim()) errs.title = 'Role is required';
    if (v.salaryMin && v.salaryMax && v.salaryMin > v.salaryMax) errs.salary = 'Minimum is higher than maximum';
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs.salary) setMore(true);
      return;
    }
    const value = { ...v };
    if (tagDraft.trim()) value.tags = [...value.tags, tagDraft.trim()];
    if (preApply) value.appliedDate = value.appliedDate || null;
    onSubmit(value);
  };

  const num = (s: string) => (s === '' ? null : Number(s));

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company *" error={errors.company}>
          {(id) => (
            <Input id={id} autoFocus value={v.company} onChange={(e) => set('company', e.target.value)} placeholder="Acme Inc." />
          )}
        </Field>
        <Field label="Role *" error={errors.title}>
          {(id) => (
            <Input id={id} value={v.title} onChange={(e) => set('title', e.target.value)} placeholder="Software Engineer" />
          )}
        </Field>
        <Field label="Stage">
          {(id) => (
            <Select id={id} value={v.status} onChange={(e) => set('status', e.target.value as ApplicationInput['status'])}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Priority">
          {(id) => (
            <Select id={id} value={v.priority} onChange={(e) => set('priority', e.target.value as ApplicationInput['priority'])}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Location">
          {(id) => (
            <Input id={id} value={v.location} onChange={(e) => set('location', e.target.value)} placeholder="Bengaluru, India" />
          )}
        </Field>
        <Field label="Work type">
          {(id) => (
            <Select id={id} value={v.workType} onChange={(e) => set('workType', e.target.value as ApplicationInput['workType'])}>
              {WORK_TYPES.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </Select>
          )}
        </Field>
        {preApply ? (
          <Field label="Plan to apply on">
            {(id) => (
              <Input id={id} type="date" value={v.plannedApplyDate ?? ''} onChange={(e) => set('plannedApplyDate', e.target.value || null)} />
            )}
          </Field>
        ) : (
          <Field label="Applied on">
            {(id) => (
              <Input id={id} type="date" value={v.appliedDate ?? ''} onChange={(e) => set('appliedDate', e.target.value || null)} />
            )}
          </Field>
        )}
        <Field label="Application deadline">
          {(id) => <Input id={id} type="date" value={v.deadline ?? ''} onChange={(e) => set('deadline', e.target.value || null)} />}
        </Field>
        <Field label="Job posting URL" className="sm:col-span-2">
          {(id) => (
            <Input id={id} type="url" inputMode="url" value={v.jobUrl} onChange={(e) => set('jobUrl', e.target.value)} placeholder="https://…" />
          )}
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setMore((m) => !m)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-muted hover:text-fg"
        aria-expanded={more}
      >
        Compensation, referral, contact & notes
        <ChevronDown className={cn('size-4 transition', more && 'rotate-180')} />
      </button>

      {more && (
        <div className="space-y-6">
          <Section title="Compensation">
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent)]"
                checked={v.salaryUndisclosed}
                onChange={(e) => set('salaryUndisclosed', e.target.checked)}
              />
              Salary not disclosed
            </label>
            {!v.salaryUndisclosed && (
              <>
                <Field label="Minimum" error={errors.salary}>
                  {(id) => (
                    <Input id={id} type="number" min={0} inputMode="decimal" value={v.salaryMin ?? ''} onChange={(e) => set('salaryMin', num(e.target.value))} />
                  )}
                </Field>
                <Field label="Maximum">
                  {(id) => (
                    <Input id={id} type="number" min={0} inputMode="decimal" value={v.salaryMax ?? ''} onChange={(e) => set('salaryMax', num(e.target.value))} />
                  )}
                </Field>
                <Field label="Currency">
                  {(id) => (
                    <Select id={id} value={v.currency} onChange={(e) => set('currency', e.target.value)}>
                      {CURRENCIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Pay period">
                  {(id) => (
                    <Select id={id} value={v.salaryPeriod} onChange={(e) => set('salaryPeriod', e.target.value as ApplicationInput['salaryPeriod'])}>
                      {SALARY_PERIODS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {v.salaryPeriod === 'hourly' && (
                  <Field label="Hours per week">
                    {(id) => (
                      <Input id={id} type="number" min={1} max={80} value={v.hoursPerWeek} onChange={(e) => set('hoursPerWeek', Number(e.target.value) || 40)} />
                    )}
                  </Field>
                )}
              </>
            )}
            <Field label="Visa / work authorization">
              {(id) => (
                <Select id={id} value={v.visaStatus} onChange={(e) => set('visaStatus', e.target.value as ApplicationInput['visaStatus'])}>
                  {VISA_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </Section>

          <Section title="Resume & source">
            <Field label="Source">
              {(id) => (
                <>
                  <Input id={id} list={`${id}-list`} value={v.source} onChange={(e) => set('source', e.target.value)} placeholder="LinkedIn" />
                  <datalist id={`${id}-list`}>
                    {SOURCES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <Field label="Resume version">
              {(id) => (
                <Input id={id} value={v.resumeVersion} onChange={(e) => set('resumeVersion', e.target.value)} placeholder="Resume_Frontend_v3.pdf" />
              )}
            </Field>
            <Field label="Resume tailoring" className="sm:col-span-2">
              {(id) => (
                <Select id={id} value={v.resumeCuration} onChange={(e) => set('resumeCuration', e.target.value as ApplicationInput['resumeCuration'])}>
                  {RESUME_CURATION.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </Section>

          <Section title="Referral">
            <Field label="Referral status" className="sm:col-span-2">
              {(id) => (
                <Select id={id} value={v.referralStatus} onChange={(e) => set('referralStatus', e.target.value as ApplicationInput['referralStatus'])}>
                  {REFERRAL_STATUSES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {v.referralStatus !== 'none' && (
              <>
                <Field label="Referrer">
                  {(id) => <Input id={id} value={v.referralContact} onChange={(e) => set('referralContact', e.target.value)} />}
                </Field>
                <Field label="Their role">
                  {(id) => <Input id={id} value={v.referralRole} onChange={(e) => set('referralRole', e.target.value)} />}
                </Field>
                <Field label="LinkedIn URL">
                  {(id) => <Input id={id} type="url" value={v.referralLinkedin} onChange={(e) => set('referralLinkedin', e.target.value)} />}
                </Field>
                <Field label="Reached out on">
                  {(id) => <Input id={id} type="date" value={v.referralDate ?? ''} onChange={(e) => set('referralDate', e.target.value || null)} />}
                </Field>
              </>
            )}
          </Section>

          <Section title="Recruiter / contact">
            <Field label="Name">
              {(id) => <Input id={id} value={v.contactName} onChange={(e) => set('contactName', e.target.value)} />}
            </Field>
            <Field label="Email">
              {(id) => <Input id={id} type="email" value={v.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />}
            </Field>
          </Section>

          <Section title="Notes & tags">
            <Field label="Tags" className="sm:col-span-2" hint="Press Enter or comma to add">
              {(id) => (
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5 focus-within:border-accent">
                  {v.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs">
                      {t}
                      <button type="button" aria-label={`Remove ${t}`} className="text-subtle hover:text-fg" onClick={() => set('tags', v.tags.filter((x) => x !== t))}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    id={id}
                    className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-subtle"
                    value={tagDraft}
                    placeholder={v.tags.length ? '' : 'React, Internship…'}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag();
                      } else if (e.key === 'Backspace' && !tagDraft && v.tags.length) {
                        set('tags', v.tags.slice(0, -1));
                      }
                    }}
                    onBlur={addTag}
                  />
                </div>
              )}
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              {(id) => <Textarea id={id} value={v.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything worth remembering…" />}
            </Field>
          </Section>
        </div>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-4 flex justify-end gap-2 border-t border-border bg-surface px-5 py-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
