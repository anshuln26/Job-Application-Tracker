/** Builds the daily reminder digest for one user (pure, unit-tested). */

export interface DigestInterview {
  id: string;
  date: string;
  type: string;
  title?: string;
  completed: boolean;
}

export interface DigestUser {
  user_id: string;
  email: string;
  name: string;
  timezone: string;
  email_digest: boolean;
  push_enabled: boolean;
  subscriptions: { endpoint: string; p256dh: string; auth: string }[];
  applications: {
    id: string;
    company: string;
    title: string;
    status: string;
    applied_date: string | null;
    planned_apply_date: string | null;
    deadline: string | null;
    interviews: DigestInterview[] | null;
  }[];
  contacts: { id: string; name: string; company: string | null; next_follow_up: string }[];
}

export interface DigestItem {
  kind: 'interview' | 'deadline' | 'apply' | 'follow-up';
  when: 'today' | 'tomorrow' | string;
  text: string;
  path: string;
}

export interface Digest {
  items: DigestItem[];
  stale: number;
}

/** YYYY-MM-DD for `now` in an IANA time zone. */
export function localDate(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const dayLabel = (date: string, today: string) =>
  date === today ? 'today' : date === addDays(today, 1) ? 'tomorrow' : new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function buildDigest(user: DigestUser, now = new Date()): Digest {
  const today = localDate(now, user.timezone || 'Asia/Kolkata');
  const tomorrow = addDays(today, 1);
  const in3 = addDays(today, 3);
  const items: DigestItem[] = [];
  let stale = 0;

  for (const a of user.applications) {
    const path = `/app/applications/${a.id}`;
    for (const iv of a.interviews ?? []) {
      const day = iv.date?.slice(0, 10);
      if (iv.completed || (day !== today && day !== tomorrow)) continue;
      const time = iv.date.slice(11, 16);
      items.push({
        kind: 'interview',
        when: dayLabel(day, today),
        text: `${a.company}: ${iv.title || iv.type}${time ? ` at ${time}` : ''}`,
        path,
      });
    }
    const active = a.status !== 'rejected' && a.status !== 'offer';
    if (active && a.deadline && a.deadline >= today && a.deadline <= in3) {
      items.push({ kind: 'deadline', when: dayLabel(a.deadline, today), text: `${a.company} application deadline (${a.title})`, path });
    }
    if ((a.status === 'wishlist' || a.status === 'referral') && a.planned_apply_date && a.planned_apply_date <= today) {
      items.push({ kind: 'apply', when: a.planned_apply_date === today ? 'today' : 'overdue', text: `Apply to ${a.company} — ${a.title}`, path });
    }
    if (a.status === 'applied' && a.applied_date && a.applied_date <= addDays(today, -14)) stale++;
  }

  for (const c of user.contacts) {
    if (c.next_follow_up <= today) {
      items.push({
        kind: 'follow-up',
        when: c.next_follow_up === today ? 'today' : 'overdue',
        text: `Follow up with ${c.name}${c.company ? ` (${c.company})` : ''}`,
        path: '/app/contacts',
      });
    }
  }

  const order = { interview: 0, deadline: 1, apply: 2, 'follow-up': 3 };
  items.sort((x, y) => order[x.kind] - order[y.kind]);
  return { items, stale };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const LABELS: Record<DigestItem['kind'], string> = {
  interview: 'Interviews',
  deadline: 'Deadlines',
  apply: 'Planned applications',
  'follow-up': 'Follow-ups',
};

export function renderDigestEmail(user: DigestUser, digest: Digest, appUrl: string) {
  const first = user.name.split(' ')[0] || 'there';
  const groups = (Object.keys(LABELS) as DigestItem['kind'][])
    .map((kind) => ({ kind, items: digest.items.filter((i) => i.kind === kind) }))
    .filter((g) => g.items.length);

  const text = [
    `Hi ${first}, here's your job search for today.`,
    '',
    ...groups.flatMap((g) => [LABELS[g.kind], ...g.items.map((i) => `• ${i.text} (${i.when})`), '']),
    digest.stale ? `${digest.stale} application(s) have had no response for 2+ weeks — consider following up.` : '',
    '',
    `Open ApplyTrack: ${appUrl}/app`,
    `Turn these emails off in Settings: ${appUrl}/app/settings`,
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:linear-gradient(135deg,#6366f1,#a855f7);border-radius:16px 16px 0 0;padding:20px 24px;color:#fff">
    <div style="font-size:13px;opacity:.85">ApplyTrack daily digest</div>
    <div style="font-size:20px;font-weight:600;margin-top:4px">Hi ${esc(first)}, here's your day</div>
  </div>
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:8px 24px 24px">
    ${groups
      .map(
        (g) => `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;margin:20px 0 8px">${LABELS[g.kind]}</h3>
      ${g.items
        .map(
          (i) => `<a href="${appUrl}${i.path}" style="display:block;text-decoration:none;color:#18181b;padding:10px 12px;border:1px solid #e4e4e7;border-radius:10px;margin-bottom:6px">
        ${esc(i.text)} <span style="color:#6366f1;font-size:12px;font-weight:600">· ${esc(i.when)}</span></a>`,
        )
        .join('')}`,
      )
      .join('')}
    ${digest.stale ? `<p style="margin-top:20px;font-size:14px;color:#52525b">⏰ ${digest.stale} application${digest.stale === 1 ? ' has' : 's have'} had no response for 2+ weeks — a polite follow-up often helps.</p>` : ''}
    <a href="${appUrl}/app" style="display:inline-block;margin-top:20px;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px">Open ApplyTrack</a>
  </div>
  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px">You get this because daily digests are on. <a href="${appUrl}/app/settings" style="color:#6b7280">Turn off</a></p>
</div></body></html>`;

  const subject = digest.items.some((i) => i.kind === 'interview')
    ? `📅 ${digest.items.filter((i) => i.kind === 'interview').length} interview(s) coming up`
    : `Your job search today: ${digest.items.length} thing${digest.items.length === 1 ? '' : 's'} to do`;

  return { subject, text, html };
}

export function pushSummary(digest: Digest): { title: string; body: string; url: string } | null {
  const important = digest.items.filter((i) => i.kind !== 'apply' || i.when === 'today');
  if (!important.length) return null;
  const first = important[0];
  return {
    title: important.length === 1 ? 'ApplyTrack reminder' : `ApplyTrack: ${important.length} reminders`,
    body: important.length === 1 ? `${first.text} (${first.when})` : important.slice(0, 3).map((i) => `• ${i.text}`).join('\n'),
    url: important.length === 1 ? first.path : '/app',
  };
}
