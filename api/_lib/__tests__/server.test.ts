// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { assertPublicUrl, parseHtml, parseJobUrl, parseLinkedInGuest } from '../jobParser';
import { buildDigest, pushSummary, renderDigestEmail, type DigestUser } from '../digest';
import { buildIcs } from '../ics';

const publicDns = async () => [{ address: '93.184.216.34' }];
const fakeFetch = (routes: Record<string, string>) => async (url: string) => {
  const text = routes[url];
  return { status: text === undefined ? 404 : 200, text: text ?? '', finalUrl: url };
};

describe('job link parser', () => {
  it('reads schema.org JobPosting JSON-LD', () => {
    const html = `<html><head><script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":"JobPosting","title":"Frontend Engineer &amp; Designer",
      "hiringOrganization":{"@type":"Organization","name":"Acme"},"validThrough":"2026-12-01T00:00:00Z","jobLocationType":"TELECOMMUTE",
      "jobLocation":[{"@type":"Place","address":{"addressLocality":"Pune","addressRegion":"MH","addressCountry":"IN"}}],
      "baseSalary":{"@type":"MonetaryAmount","currency":"inr","value":{"@type":"QuantitativeValue","minValue":1200000,"maxValue":1800000,"unitText":"YEAR"}}}]}
    </script></head></html>`;
    expect(parseHtml(html, 'https://careers.acme.com/jobs/1')).toMatchObject({
      title: 'Frontend Engineer & Designer',
      company: 'Acme',
      location: 'Pune, MH, IN',
      workType: 'Remote',
      deadline: '2026-12-01',
      salaryMin: 1200000,
      salaryMax: 1800000,
      currency: 'INR',
      salaryPeriod: 'yearly',
      source: 'Company site',
    });
  });

  it('falls back to Open Graph titles', () => {
    expect(parseHtml('<meta property="og:title" content="Razorpay hiring SDE II in Bengaluru | LinkedIn">', 'https://www.linkedin.com/jobs/view/1/')).toMatchObject({
      company: 'Razorpay',
      title: 'SDE II',
      location: 'Bengaluru',
      source: 'LinkedIn',
    });
    expect(parseHtml('<title>Backend Engineer at Zerodha | Careers</title><meta property="og:site_name" content="Zerodha">', 'https://zerodha.com/careers/x')).toMatchObject({
      title: 'Backend Engineer',
      company: 'Zerodha',
    });
  });

  it('reads the LinkedIn guest job page', () => {
    const html = `<h2 class="top-card-layout__title font-sans">Software Engineer, Payments</h2>
      <a class="topcard__org-name-link topcard__flavor--black-link" href="#">  Stripe </a>
      <span class="topcard__flavor topcard__flavor--bullet"> Bengaluru, Karnataka, India (Hybrid) </span>`;
    expect(parseLinkedInGuest(html, 'https://www.linkedin.com/jobs/view/1/')).toMatchObject({
      title: 'Software Engineer, Payments',
      company: 'Stripe',
      location: 'Bengaluru, Karnataka, India (Hybrid)',
      workType: 'Hybrid',
    });
  });

  it('uses the Greenhouse API for Greenhouse links', async () => {
    const job = await parseJobUrl(
      'https://job-boards.greenhouse.io/vercel/jobs/6231864004',
      fakeFetch({
        'https://boards-api.greenhouse.io/v1/boards/vercel/jobs/6231864004': JSON.stringify({
          title: 'Account Executive, Commercial',
          company_name: 'Vercel',
          location: { name: 'Remote - Germany' },
          application_deadline: '2026-12-15',
        }),
      }),
      publicDns,
    );
    expect(job).toMatchObject({ title: 'Account Executive, Commercial', company: 'Vercel', workType: 'Remote', deadline: '2026-12-15' });
  });

  it('uses the Lever API for Lever links', async () => {
    const job = await parseJobUrl(
      'https://jobs.lever.co/acme-labs/abc-123',
      fakeFetch({
        'https://api.lever.co/v0/postings/acme-labs/abc-123': JSON.stringify({
          text: 'Platform Engineer',
          categories: { location: 'London' },
          workplaceType: 'hybrid',
          salaryRange: { min: 70000, max: 90000, currency: 'GBP', interval: 'per-year-salary' },
        }),
      }),
      publicDns,
    );
    expect(job).toMatchObject({ title: 'Platform Engineer', company: 'Acme Labs', workType: 'Hybrid', salaryMin: 70000, currency: 'GBP', salaryPeriod: 'yearly' });
  });

  it('blocks private and non-http addresses', async () => {
    await expect(assertPublicUrl('http://169.254.169.254/latest')).rejects.toThrow(/not allowed/);
    await expect(assertPublicUrl('http://localhost:3000')).rejects.toThrow(/not allowed/);
    await expect(assertPublicUrl('http://10.0.0.5')).rejects.toThrow(/not allowed/);
    await expect(assertPublicUrl('file:///etc/passwd')).rejects.toThrow(/http/);
    await expect(assertPublicUrl('https://evil.example', async () => [{ address: '192.168.1.1' }])).rejects.toThrow(/not allowed/);
    await expect(assertPublicUrl('https://ok.example', publicDns)).resolves.toBeInstanceOf(URL);
  });
});

const user = (over: Partial<DigestUser> = {}): DigestUser => ({
  user_id: 'u',
  email: 'a@x.com',
  name: 'Anshul N',
  timezone: 'Asia/Kolkata',
  email_digest: true,
  push_enabled: true,
  subscriptions: [],
  applications: [],
  contacts: [],
  ...over,
});

describe('reminder digest', () => {
  // 03:00 UTC = 08:30 IST on 2 Nov
  const now = new Date('2026-11-02T03:00:00Z');

  it('collects interviews, deadlines, planned applications and follow-ups in the user time zone', () => {
    const d = buildDigest(
      user({
        applications: [
          { id: '1', company: 'Linear', title: 'PE', status: 'interviewing', applied_date: '2026-10-01', planned_apply_date: null, deadline: null,
            interviews: [
              { id: 'a', date: '2026-11-02T18:00', type: 'Technical', completed: false },
              { id: 'b', date: '2026-11-03T10:00', type: 'System design', title: 'Design round', completed: false },
              { id: 'c', date: '2026-11-02T09:00', type: 'Screen', completed: true },
              { id: 'd', date: '2026-11-09T09:00', type: 'Final', completed: false },
            ] },
          { id: '2', company: 'Atlassian', title: 'SWE', status: 'wishlist', applied_date: null, planned_apply_date: '2026-11-02', deadline: '2026-11-04', interviews: [] },
          { id: '3', company: 'Old Co', title: 'Dev', status: 'applied', applied_date: '2026-10-01', planned_apply_date: null, deadline: null, interviews: null },
          { id: '4', company: 'Gone', title: 'Dev', status: 'rejected', applied_date: '2026-10-01', planned_apply_date: null, deadline: '2026-11-03', interviews: [] },
        ],
        contacts: [{ id: 'c1', name: 'Priya', company: 'Stripe', next_follow_up: '2026-11-01' }],
      }),
      now,
    );
    expect(d.items.map((i) => `${i.kind}:${i.when}:${i.text}`)).toEqual([
      'interview:today:Linear: Technical at 18:00',
      'interview:tomorrow:Linear: Design round at 10:00',
      'deadline:Wed 4 Nov:Atlassian application deadline (SWE)',
      'apply:today:Apply to Atlassian — SWE',
      'follow-up:overdue:Follow up with Priya (Stripe)',
    ]);
    expect(d.stale).toBe(1);
  });

  it('renders an escaped email and a push summary', () => {
    const u = user({ name: '<script>' });
    const d = { items: [{ kind: 'interview' as const, when: 'today', text: 'A & B: Screen', path: '/app/applications/1' }], stale: 0 };
    const mail = renderDigestEmail(u, d, 'https://app.example');
    expect(mail.html).toContain('A &amp; B: Screen');
    expect(mail.html).not.toContain('<script>');
    expect(mail.subject).toMatch(/1 interview/);
    expect(pushSummary(d)).toEqual({ title: 'ApplyTrack reminder', body: 'A & B: Screen (today)', url: '/app/applications/1' });
    expect(pushSummary({ items: [], stale: 3 })).toBeNull();
  });
});

describe('calendar feed', () => {
  it('builds valid iCalendar events', () => {
    const ics = buildIcs(
      {
        applications: [
          { id: 'app1', company: 'Acme, Inc', title: 'SWE', status: 'interviewing', planned_apply_date: null, deadline: '2026-11-20',
            interviews: [{ id: 'i1', date: '2026-11-05T23:30', type: 'Technical', completed: false }] },
        ],
        contacts: [{ id: 'c1', name: 'Priya', company: null, next_follow_up: '2026-11-07' }],
      },
      'https://app.example',
      new Date('2026-11-02T00:00:00Z'),
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261105T233000');
    expect(ics).toContain('DTEND:20261106T003000');
    expect(ics).toContain('SUMMARY:Acme\\, Inc: Technical');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261120');
    expect(ics).toContain('DTEND;VALUE=DATE:20261121');
    expect(ics).toContain('Follow up: Priya');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });
});
