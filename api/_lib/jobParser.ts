/**
 * Turns a job posting URL into structured fields. Uses public ATS APIs where
 * they exist (Greenhouse, Lever, Ashby), LinkedIn's guest job page, and falls
 * back to schema.org JobPosting JSON-LD or Open Graph tags on any other page.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface ParsedJob {
  title?: string;
  company?: string;
  location?: string;
  workType?: 'Remote' | 'Hybrid' | 'On-site';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryPeriod?: 'yearly' | 'monthly' | 'hourly';
  deadline?: string;
  source?: string;
  jobUrl: string;
}

type Fetcher = (url: string) => Promise<{ status: number; text: string; finalUrl: string }>;

/* ---------- URL safety ---------- */

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:');
}

type Resolver = (host: string) => Promise<{ address: string }[]>;
const dnsResolver: Resolver = (host) => lookup(host, { all: true });

export async function assertPublicUrl(raw: string, resolve: Resolver = dnsResolver): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('That does not look like a valid link');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only http(s) links are supported');
  if (url.username || url.password) throw new Error('Links with credentials are not supported');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('That address is not allowed');
  const addresses = isIP(host) ? [{ address: host }] : await resolve(host);
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new Error('That address is not allowed');
  return url;
}

const MAX_BYTES = 1_500_000;

/** fetch with timeout, size cap and redirect re-validation. */
export const safeFetch: Fetcher = async (start) => {
  let current = start;
  for (let hop = 0; hop < 4; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; ApplyTrackBot/1.0; +https://github.com/anshuln26/Job-Application-Tracker)',
        accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        'accept-language': 'en',
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location')!, url).toString();
      continue;
    }
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    return { status: res.status, text: Buffer.concat(chunks).toString('utf8'), finalUrl: url.toString() };
  }
  throw new Error('Too many redirects');
};

/* ---------- Helpers ---------- */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

const clean = (s: unknown): string | undefined => {
  if (typeof s !== 'string') return undefined;
  const v = decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return v || undefined;
};

const titleCase = (slug: string) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

function workTypeFrom(...hints: (string | undefined)[]): ParsedJob['workType'] | undefined {
  const text = hints.filter(Boolean).join(' ').toLowerCase();
  if (!text) return undefined;
  if (text.includes('hybrid')) return 'Hybrid';
  if (/remote|telecommute|work from home|wfh/.test(text)) return 'Remote';
  if (/on-?site|in office|office/.test(text)) return 'On-site';
  return undefined;
}

function periodFrom(unit: string | undefined): ParsedJob['salaryPeriod'] | undefined {
  const u = (unit ?? '').toUpperCase();
  if (u.startsWith('HOUR')) return 'hourly';
  if (u.startsWith('MONTH')) return 'monthly';
  if (u.startsWith('YEAR') || u.startsWith('ANNUAL')) return 'yearly';
  return undefined;
}

function sourceFor(host: string): string {
  if (host.includes('linkedin.')) return 'LinkedIn';
  if (/naukri|indeed|glassdoor|wellfound|instahyre|internshala|monster|foundit/.test(host)) return 'Job board';
  return 'Company site';
}

const dateOnly = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined);

/* ---------- JSON-LD / meta parsing (pure, unit-tested) ---------- */

function findJobPosting(node: unknown): Record<string, unknown> | undefined {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findJobPosting(n);
      if (hit) return hit;
    }
    return undefined;
  }
  const obj = node as Record<string, unknown>;
  const type = obj['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return obj;
  return findJobPosting(obj['@graph']);
}

function locationFrom(jobLocation: unknown): string | undefined {
  const list = Array.isArray(jobLocation) ? jobLocation : jobLocation ? [jobLocation] : [];
  const names = list
    .map((loc) => {
      const addr = (loc as { address?: unknown })?.address;
      if (typeof addr === 'string') return clean(addr);
      const a = (addr ?? {}) as Record<string, unknown>;
      const country = typeof a.addressCountry === 'object' ? (a.addressCountry as { name?: string })?.name : a.addressCountry;
      return [a.addressLocality, a.addressRegion, country].map(clean).filter(Boolean).join(', ') || clean((loc as { name?: string }).name);
    })
    .filter(Boolean);
  return [...new Set(names)].slice(0, 3).join(' / ') || undefined;
}

export function parseHtml(html: string, pageUrl: string): ParsedJob {
  const url = new URL(pageUrl);
  const out: ParsedJob = { jobUrl: pageUrl, source: sourceFor(url.hostname) };

  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const job = findJobPosting(data);
    if (!job) continue;
    const org = job.hiringOrganization as { name?: string } | string | undefined;
    out.title = clean(job.title);
    out.company = clean(typeof org === 'string' ? org : org?.name);
    out.location = locationFrom(job.jobLocation);
    out.workType = job.jobLocationType === 'TELECOMMUTE' ? 'Remote' : workTypeFrom(out.location, clean(job.employmentType));
    out.deadline = dateOnly(job.validThrough);
    const salary = job.baseSalary as { currency?: string; value?: Record<string, unknown> | number } | undefined;
    if (salary) {
      const v = typeof salary.value === 'object' ? salary.value : { value: salary.value };
      const min = Number(v?.minValue ?? v?.value);
      const max = Number(v?.maxValue ?? v?.value);
      if (min > 0) out.salaryMin = min;
      if (max > 0) out.salaryMax = max;
      if (salary.currency) out.currency = String(salary.currency).toUpperCase();
      out.salaryPeriod = periodFrom(v?.unitText as string | undefined);
    }
    break;
  }

  const meta = (prop: string) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, 'i');
    const hit = html.match(re);
    return clean(hit?.[1] ?? hit?.[2]);
  };

  if (!out.title) {
    const raw = meta('og:title') ?? clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    if (raw) {
      // "Software Engineer at Acme", "Software Engineer - Acme | Careers", "Acme hiring Software Engineer in Pune"
      const hiring = raw.match(/^(.+?) hiring (.+?)(?: in (.+?))?(?: \| LinkedIn)?$/i);
      const at = raw.match(/^(.+?) at (.+?)(?:\s[|–-]\s.*)?$/i);
      if (hiring) {
        out.company ??= hiring[1];
        out.title = hiring[2];
        out.location ??= hiring[3];
      } else if (at) {
        out.title = at[1];
        out.company ??= at[2];
      } else {
        out.title = raw.split(/\s[|–-]\s/)[0];
      }
    }
  }
  out.company ??= meta('og:site_name');
  out.workType ??= workTypeFrom(out.location, out.title);
  return out;
}

/* ---------- Provider-specific strategies ---------- */

export function parseLinkedInGuest(html: string, jobUrl: string): ParsedJob {
  const pick = (re: RegExp) => clean(html.match(re)?.[1]);
  const location = pick(/topcard__flavor--bullet[^>]*>([\s\S]*?)<\/span>/i);
  const title = pick(/top-card-layout__title[^>]*>([\s\S]*?)<\/h[12]>/i);
  return {
    jobUrl,
    source: 'LinkedIn',
    title,
    company: pick(/topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/i) ?? pick(/topcard__flavor[^>]*>([\s\S]*?)<\/span>/i),
    location,
    workType: workTypeFrom(location, title),
  };
}

function linkedInJobId(url: URL): string | undefined {
  return url.searchParams.get('currentJobId') ?? url.pathname.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})/)?.[1];
}

export async function parseJobUrl(raw: string, fetcher: Fetcher = safeFetch, resolve?: Resolver): Promise<ParsedJob> {
  const url = await assertPublicUrl(raw, resolve);
  const host = url.hostname.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  const jobUrl = url.toString();

  // Greenhouse: boards.greenhouse.io/{board}/jobs/{id}
  if (host.endsWith('greenhouse.io') && parts.length >= 3 && parts[1] === 'jobs') {
    const res = await fetcher(`https://boards-api.greenhouse.io/v1/boards/${parts[0]}/jobs/${parts[2]}`);
    if (res.status === 200) {
      const j = JSON.parse(res.text);
      const location = clean(j.location?.name);
      return {
        jobUrl,
        source: 'Company site',
        title: clean(j.title),
        company: clean(j.company_name) ?? titleCase(parts[0]),
        location,
        workType: workTypeFrom(location),
        deadline: dateOnly(j.application_deadline),
      };
    }
  }

  // Lever: jobs.lever.co/{company}/{id}
  if (host === 'jobs.lever.co' && parts.length >= 2) {
    const res = await fetcher(`https://api.lever.co/v0/postings/${parts[0]}/${parts[1]}`);
    if (res.status === 200) {
      const j = JSON.parse(res.text);
      const location = clean(j.categories?.location);
      const range = j.salaryRange;
      return {
        jobUrl,
        source: 'Company site',
        title: clean(j.text),
        company: titleCase(parts[0]),
        location,
        workType: workTypeFrom(j.workplaceType, location),
        salaryMin: range?.min || undefined,
        salaryMax: range?.max || undefined,
        currency: range?.currency,
        salaryPeriod: periodFrom(range?.interval?.replace('per-', '')),
      };
    }
  }

  // Ashby: jobs.ashbyhq.com/{org}/{id}
  if (host === 'jobs.ashbyhq.com' && parts.length >= 2) {
    const res = await fetcher(`https://api.ashbyhq.com/posting-api/job-board/${parts[0]}?includeCompensation=true`);
    if (res.status === 200) {
      const job = (JSON.parse(res.text).jobs ?? []).find((j: { id: string }) => j.id === parts[1]);
      if (job) {
        return {
          jobUrl,
          source: 'Company site',
          title: clean(job.title),
          company: titleCase(parts[0]),
          location: clean(job.location),
          workType: job.isRemote ? 'Remote' : workTypeFrom(job.workplaceType, job.location),
        };
      }
    }
  }

  // LinkedIn: the logged-in page is not readable, the guest endpoint is
  if (host.endsWith('linkedin.com')) {
    const id = linkedInJobId(url);
    if (id) {
      const res = await fetcher(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`);
      if (res.status === 200) {
        const parsed = parseLinkedInGuest(res.text, `https://www.linkedin.com/jobs/view/${id}/`);
        if (parsed.title) return parsed;
      }
    }
  }

  const res = await fetcher(jobUrl);
  if (res.status >= 400) throw new Error(`The page returned an error (${res.status})`);
  return parseHtml(res.text, res.finalUrl);
}
