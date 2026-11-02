import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { BellRing, CalendarSync, Copy, Download, ExternalLink, Mail, MonitorSmartphone, RefreshCw, Share, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { usePreferences } from '@/hooks/usePreferences';
import { useApplications } from '@/hooks/useApplications';
import { apiPost, useServerStatus, useSettings } from '@/hooks/useSettings';
import { PageHeader } from '@/components/layout/PageHeader';
import { AuthenticatorSetup, EmailCodeSetup } from '@/components/security/TwoFactor';
import { Button, Card, Dialog, Field, Input, Segmented, Select, Switch } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { CURRENCIES } from '@/lib/currency';
import { download } from '@/lib/csv';
import { isIOS, pushSupported, subscribeToPush, unsubscribeFromPush, useInstallPrompt } from '@/lib/pwa';
import { resetDemoData } from '@/data/repository';

export default function Settings() {
  const { status, user, displayName, signOut } = useAuth();
  const { theme, setTheme, currency, setCurrency } = usePreferences();
  const { settings, update } = useSettings();
  const { data = [] } = useApplications();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isDemo = status === 'demo';
  const provider = user?.app_metadata?.provider as string | undefined;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />

      <div className="space-y-4">
        {!isDemo && user && (
          <Section title="Profile" description="How you appear in the app.">
            <ProfileForm initialName={displayName} email={user.email ?? ''} />
          </Section>
        )}

        <Section
          title="Security"
          description="Two-step verification asks for a second code when you sign in. The database refuses your data to any session that skipped it."
          icon={<ShieldCheck className="size-4" />}
        >
          {isDemo ? (
            <SignUpNote />
          ) : (
            <div className="space-y-3">
              <AuthenticatorSetup />
              <EmailCodeSetup />
              <p className="text-xs text-subtle">
                SMS codes need Supabase's paid phone add-on and an SMS provider, so they aren't offered on the free plan.
              </p>
              {provider === 'email' && <PasswordForm />}
            </div>
          )}
        </Section>

        <Section title="Notifications" description="Reminders for interviews, deadlines, planned applications and follow-ups." icon={<BellRing className="size-4" />}>
          {isDemo ? <SignUpNote /> : <Notifications emailDigest={settings.emailDigest} pushEnabled={settings.pushEnabled} onChange={update} />}
        </Section>

        <Section
          title="Calendar sync"
          description="Subscribe once and interviews, deadlines and follow-ups appear in Google Calendar, Outlook or Apple Calendar automatically."
          icon={<CalendarSync className="size-4" />}
        >
          {isDemo ? <SignUpNote /> : <CalendarFeed token={settings.calendarToken} />}
        </Section>

        <Section title="App" description="Install ApplyTrack on your phone or computer — it opens in its own window and works offline." icon={<MonitorSmartphone className="size-4" />}>
          <InstallApp />
        </Section>

        <Section title="Goals & preferences">
          <div className="space-y-4">
            <Row label="Weekly application goal" hint="Shown on your dashboard with a streak counter.">
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.weeklyGoal}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 1 && n <= 100) update({ weeklyGoal: n });
                }}
                className="w-24"
                aria-label="Weekly application goal"
              />
            </Row>
            <Row label="Time zone" hint="Used for reminder emails and notifications.">
              <Select aria-label="Time zone" value={settings.timezone} onChange={(e) => update({ timezone: e.target.value })} className="w-56">
                {timeZones(settings.timezone).map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </Select>
            </Row>
            <Row label="Theme">
              <Segmented
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </Row>
            <Row label="Display currency" hint="Used for comparisons and new applications.">
              <Select aria-label="Display currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28">
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Row>
          </div>
        </Section>

        <Section title="Your data" description={`${data.length} applications${isDemo ? ' (sample data)' : ''}.`}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => download(`applytrack-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json')}
            >
              <Download className="size-4" /> Download full backup (JSON)
            </Button>
            {isDemo && (
              <Button
                variant="secondary"
                onClick={() => {
                  resetDemoData();
                  qc.invalidateQueries();
                  toast.success('Demo data reset');
                }}
              >
                Reset demo data
              </Button>
            )}
          </div>
        </Section>

        {!isDemo && user && (
          <Section title="Delete account" description="Permanently delete your account and everything in it. This cannot be undone." danger>
            <DeleteAccount
              email={user.email ?? ''}
              onDeleted={async () => {
                await signOut();
                navigate('/', { replace: true });
              }}
            />
          </Section>
        )}
      </div>
    </div>
  );
}

function timeZones(current: string): string[] {
  const common = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'];
  let all: string[] = [];
  try {
    all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
  } catch {
    // older browsers
  }
  return [...new Set([current, ...common, ...all])];
}

function Section({ title, description, children, danger, icon }: { title: string; description?: string; children: ReactNode; danger?: boolean; icon?: ReactNode }) {
  return (
    <Card className={danger ? 'border-danger/30 p-5' : 'p-5'}>
      <h2 className={`flex items-center gap-2 font-semibold ${danger ? 'text-danger' : ''}`}>
        {icon && <span className="bg-gradient-accent grid size-7 place-items-center rounded-lg text-white">{icon}</span>}
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-subtle">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SignUpNote() {
  return <p className="glass-soft rounded-xl p-3 text-sm text-muted">Create a free account to use this — demo data lives only in your browser.</p>;
}

/* ---------- Notifications ---------- */

function Notifications({
  emailDigest,
  pushEnabled,
  onChange,
}: {
  emailDigest: boolean;
  pushEnabled: boolean;
  onChange: (p: { emailDigest?: boolean; pushEnabled?: boolean }) => void;
}) {
  const { data: server } = useServerStatus();
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const supported = pushSupported();

  const enablePush = async () => {
    if (!server?.vapidPublicKey || !supabase) return;
    setBusy(true);
    try {
      const sub = await subscribeToPush(server.vapidPublicKey);
      const { error } = await supabase.rpc('save_push_subscription', {
        p_endpoint: sub.endpoint,
        p_p256dh: sub.p256dh,
        p_auth: sub.auth,
        p_user_agent: navigator.userAgent,
      });
      if (error) throw error;
      onChange({ pushEnabled: true });
      toast.success('Notifications enabled on this device');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable notifications');
    } finally {
      setBusy(false);
    }
  };

  const disablePush = async () => {
    const endpoint = await unsubscribeFromPush().catch(() => null);
    if (endpoint && supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    onChange({ pushEnabled: false });
    toast.success('Notifications turned off on this device');
  };

  const test = async () => {
    try {
      const { sent } = await apiPost<{ sent: number }>('/api/push-test', session?.access_token);
      toast.success(`Test sent to ${sent} device${sent === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send a test');
    }
  };

  return (
    <div className="space-y-3">
      <div className="glass-soft flex items-start gap-3 rounded-2xl p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fg/5 text-muted">
          <Mail className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Daily email digest</div>
          <p className="text-xs text-muted">
            {server?.email
              ? 'Every morning at ~8 AM IST, only on days with something to do.'
              : 'Needs an email sender on the server (see the README). You can switch it on now and it starts once that is set up.'}
          </p>
        </div>
        <Switch checked={emailDigest} onChange={(v) => onChange({ emailDigest: v })} label="Daily email digest" />
      </div>

      <div className="glass-soft flex flex-wrap items-start gap-3 rounded-2xl p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fg/5 text-muted">
          <BellRing className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Phone & desktop notifications</div>
          <p className="text-xs text-muted">
            {!supported
              ? isIOS()
                ? 'On iPhone, first install the app (Share → Add to Home Screen), then turn this on from the installed app.'
                : "This browser doesn't support notifications."
              : !server?.push
                ? 'Push notifications are not configured on the server yet.'
                : pushEnabled
                  ? 'On for this account. Each device you enable gets reminders.'
                  : 'Get a notification for interviews today/tomorrow, deadlines and follow-ups.'}
          </p>
        </div>
        <div className="flex gap-2">
          {pushEnabled && server?.push && (
            <Button size="sm" variant="secondary" onClick={test}>
              Send test
            </Button>
          )}
          {pushEnabled ? (
            <Button size="sm" variant="secondary" onClick={disablePush}>
              Turn off here
            </Button>
          ) : (
            <Button size="sm" onClick={enablePush} loading={busy} disabled={!supported || !server?.push}>
              Enable
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Calendar ---------- */

function CalendarFeed({ token }: { token: string | null }) {
  const { refresh } = useSettings();
  const [busy, setBusy] = useState(false);
  const feed = token ? `${window.location.origin}/api/calendar?token=${token}` : null;
  const webcal = feed?.replace(/^https?:/, 'webcal:');

  const rotate = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc('rotate_calendar_token');
    setBusy(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success(token ? 'New link created — the old one stopped working' : 'Calendar link created');
  };

  const off = async () => {
    if (!supabase) return;
    const { error } = await supabase.rpc('disable_calendar_feed');
    if (error) return toast.error(error.message);
    await refresh();
    toast.success('Calendar link turned off');
  };

  if (!feed) {
    return (
      <Button onClick={rotate} loading={busy}>
        <CalendarSync className="size-4" /> Create my calendar link
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input readOnly value={feed} aria-label="Calendar feed URL" className="font-mono text-xs" onFocus={(e) => e.target.select()} />
        <Button
          variant="secondary"
          size="icon"
          aria-label="Copy link"
          onClick={() => navigator.clipboard.writeText(feed).then(() => toast.success('Link copied'))}
        >
          <Copy className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal!)}`} target="_blank" rel="noopener noreferrer">
          <Button>
            <ExternalLink className="size-4" /> Add to Google Calendar
          </Button>
        </a>
        <a href={webcal}>
          <Button variant="secondary">Apple / Outlook</Button>
        </a>
        <Button variant="ghost" onClick={rotate} loading={busy}>
          <RefreshCw className="size-4" /> New link
        </Button>
        <Button variant="ghost" onClick={off}>
          Turn off
        </Button>
      </div>
      <p className="text-xs text-subtle">
        Keep this link private — anyone with it can see your interview dates. Google refreshes subscribed calendars every few hours.
      </p>
    </div>
  );
}

/* ---------- Install ---------- */

function InstallApp() {
  const install = useInstallPrompt();
  if (install.installed) return <p className="text-sm text-muted">✅ You're using the installed app.</p>;
  if (install.canPrompt) {
    return (
      <Button onClick={install.install}>
        <Download className="size-4" /> Install ApplyTrack
      </Button>
    );
  }
  return (
    <div className="glass-soft rounded-xl p-3 text-sm text-muted">
      {isIOS() ? (
        <>
          On iPhone/iPad: tap <Share className="inline size-4" /> <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>.
        </>
      ) : (
        <>
          Open your browser menu and choose <strong>Install ApplyTrack</strong> (Chrome, Edge) or <strong>Add to Home screen</strong> (Android).
        </>
      )}
    </div>
  );
}

/* ---------- Profile / password / delete ---------- */

function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase!.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
      <Field label="Email">{(id) => <Input id={id} value={email} disabled />}</Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={saving} disabled={name.trim() === initialName}>
          Save
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Use at least 8 characters');
    setSaving(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Password changed');
      setPassword('');
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end">
      <Field label="Change password" className="flex-1">
        {(id) => <Input id={id} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />}
      </Field>
      <Button type="submit" variant="secondary" loading={saving} disabled={!password}>
        Update password
      </Button>
    </form>
  );
}

function DeleteAccount({ email, onDeleted }: { email: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    const { error } = await supabase!.rpc('delete_my_account');
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Account deleted');
    onDeleted();
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete account?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={typed !== email} loading={loading} onClick={confirm}>
              Delete forever
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Download a backup first if you want to keep your data. Type <strong className="text-fg">{email}</strong> to confirm.
        </p>
        <Input className="mt-3" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type your email to confirm" />
      </Dialog>
    </>
  );
}
