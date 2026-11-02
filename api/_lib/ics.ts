/** iCalendar (RFC 5545) feed for interviews, deadlines and follow-ups (pure, unit-tested). */

interface FeedData {
  applications: {
    id: string;
    company: string;
    title: string;
    status: string;
    planned_apply_date: string | null;
    deadline: string | null;
    interviews: { id: string; date: string; type: string; title?: string; completed: boolean }[] | null;
  }[];
  contacts: { id: string; name: string; company: string | null; next_follow_up: string }[];
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\r?\n/g, '\\n');
const compact = (d: string) => d.replace(/-/g, '');

/** Fold long lines to 75 octets as the spec requires. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 73) out.push((i ? ' ' : '') + line.slice(i, i + 73));
  return out.join('\r\n');
}

const nextDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
};

export function buildIcs(data: FeedData, appUrl: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ApplyTrack//Job search//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ApplyTrack',
    'X-WR-CALDESC:Interviews\\, deadlines and follow-ups from ApplyTrack',
    'REFRESH-INTERVAL;VALUE=DURATION:PT3H',
    'X-PUBLISHED-TTL:PT3H',
  ];

  const allDay = (uid: string, date: string, summary: string, url: string) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@applytrack`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date)}`,
      `DTEND;VALUE=DATE:${nextDay(date)}`,
      fold(`SUMMARY:${esc(summary)}`),
      fold(`URL:${url}`),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  };

  for (const a of data.applications) {
    const url = `${appUrl}/app/applications/${a.id}`;
    for (const iv of a.interviews ?? []) {
      const m = iv.date?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (!m) continue;
      const start = `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00`;
      const endDate = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] + 1, +m[5]));
      const end = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '');
      lines.push(
        'BEGIN:VEVENT',
        `UID:${a.id}-${iv.id}@applytrack`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        fold(`SUMMARY:${esc(`${iv.completed ? '✓ ' : ''}${a.company}: ${iv.title || iv.type}`)}`),
        fold(`DESCRIPTION:${esc(`${iv.type} — ${a.title}\n${url}`)}`),
        fold(`URL:${url}`),
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Interview reminder',
        'TRIGGER:-PT30M',
        'END:VALARM',
        'END:VEVENT',
      );
    }
    if (a.deadline && a.status !== 'rejected') allDay(`${a.id}-deadline`, a.deadline, `⏳ Deadline: ${a.company} — ${a.title}`, url);
    if (a.planned_apply_date && (a.status === 'wishlist' || a.status === 'referral'))
      allDay(`${a.id}-apply`, a.planned_apply_date, `📝 Apply: ${a.company} — ${a.title}`, url);
  }

  for (const c of data.contacts) {
    allDay(`contact-${c.id}`, c.next_follow_up, `💬 Follow up: ${c.name}${c.company ? ` (${c.company})` : ''}`, `${appUrl}/app/contacts`);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
