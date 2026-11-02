import { useState, type FormEvent } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { normalizeCurrency } from '@/lib/currency';
import type { ApplicationInput } from '@/types';

interface Parsed {
  title?: string;
  company?: string;
  location?: string;
  workType?: ApplicationInput['workType'];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryPeriod?: ApplicationInput['salaryPeriod'];
  deadline?: string;
  source?: string;
  jobUrl: string;
}

/** Paste a job posting link → fills company, role, location, pay and deadline. */
export function JobLinkAutofill({ onFill }: { onFill: (patch: Partial<ApplicationInput>) => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const link = url.trim();
    if (!/^https?:\/\//i.test(link)) {
      toast.error('Paste a full link starting with https://');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/parse-job?url=${encodeURIComponent(link)}`);
      const data = (await res.json().catch(() => ({}))) as Parsed & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Auto-fill is not available right now');
      const patch: Partial<ApplicationInput> = { jobUrl: link };
      if (data.company) patch.company = data.company;
      if (data.title) patch.title = data.title;
      if (data.location) patch.location = data.location;
      if (data.workType) patch.workType = data.workType;
      if (data.deadline) patch.deadline = data.deadline;
      if (data.source) patch.source = data.source;
      if (data.salaryMin || data.salaryMax) {
        patch.salaryMin = data.salaryMin ?? null;
        patch.salaryMax = data.salaryMax ?? null;
        if (data.currency) patch.currency = normalizeCurrency(data.currency);
        if (data.salaryPeriod) patch.salaryPeriod = data.salaryPeriod;
      }
      onFill(patch);
      const filled = [data.company && 'company', data.title && 'role', data.location && 'location', data.deadline && 'deadline', (data.salaryMin || data.salaryMax) && 'pay']
        .filter(Boolean)
        .join(', ');
      toast.success(`Filled ${filled}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ring-gradient glass-soft rounded-2xl p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
        <Sparkles className="size-3.5 text-accent" /> Auto-fill from a job link
        <span className="font-normal text-subtle">— LinkedIn, Greenhouse, Lever, Ashby, Workday & most career pages</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text').trim();
              if (/^https?:\/\//i.test(text)) {
                e.preventDefault();
                setUrl(text);
                setTimeout(() => document.getElementById('autofill-go')?.click(), 0);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            type="url"
            inputMode="url"
            aria-label="Job posting link"
            placeholder="Paste a link — it fills in automatically"
            className="h-9 w-full rounded-xl border border-border/80 bg-surface/70 pl-9 pr-3 text-sm placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-4 focus:ring-ring/20"
          />
        </div>
        <Button id="autofill-go" onClick={() => submit()} loading={loading} disabled={!url.trim()}>
          Auto-fill
        </Button>
      </div>
    </div>
  );
}
