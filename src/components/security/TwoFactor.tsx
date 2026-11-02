import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { KeyRound, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { apiPost, useServerStatus } from '@/hooks/useSettings';
import { Button, Dialog, Input } from '@/components/ui';

export function CodeInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      aria-label="6-digit code"
      placeholder="••••••"
      className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
    />
  );
}

/* ---------- Sign-in challenge ---------- */

export function TwoFactorChallenge() {
  const { secondFactor, session, refreshSecondFactor, signOut } = useAuth();
  const [method, setMethod] = useState<'totp' | 'email'>(secondFactor?.totp ? 'totp' : 'email');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const verify = async (e?: FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6 || !supabase) return;
    setBusy(true);
    try {
      if (method === 'totp') {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp.find((f) => f.status === 'verified');
        if (!factor) throw new Error('No authenticator app is set up');
        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
        if (error) throw new Error('That code is not right. Check your authenticator app.');
      } else {
        const { data, error } = await supabase.rpc('verify_email_otp', { p_code: code });
        if (error) throw error;
        if (!data) throw new Error('That code is wrong or expired. Request a new one.');
      }
      await refreshSecondFactor();
      toast.success('Verified');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (code.length === 6) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- verify reads the latest code
  }, [code]);

  const sendEmail = async () => {
    setBusy(true);
    try {
      await apiPost('/api/2fa/email-code', session?.access_token, { purpose: 'login' });
      setSent(true);
      toast.success('Code sent — check your inbox');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {secondFactor?.totp && secondFactor.email && (
        <div className="grid grid-cols-2 gap-2">
          {(['totp', 'email'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m);
                setCode('');
              }}
              className={`glass-soft flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm ${method === m ? 'ring-gradient font-semibold' : 'text-muted'}`}
            >
              {m === 'totp' ? <Smartphone className="size-4" /> : <Mail className="size-4" />}
              {m === 'totp' ? 'Authenticator' : 'Email code'}
            </button>
          ))}
        </div>
      )}

      {method === 'totp' ? (
        <p className="text-sm text-muted">Open your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…) and enter the 6-digit code for ApplyTrack.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">We'll email a 6-digit code to {session?.user.email}.</p>
          <Button variant="secondary" className="w-full" onClick={sendEmail} loading={busy && !sent}>
            <Mail className="size-4" /> {sent ? 'Send another code' : 'Email me a code'}
          </Button>
        </div>
      )}

      {(method === 'totp' || sent) && (
        <form onSubmit={verify} className="space-y-3">
          <CodeInput value={code} onChange={setCode} autoFocus />
          <Button type="submit" size="lg" className="w-full" loading={busy} disabled={code.length !== 6}>
            Verify
          </Button>
        </form>
      )}

      <button type="button" onClick={signOut} className="block w-full text-center text-sm text-muted hover:text-fg">
        Sign in with a different account
      </button>
    </div>
  );
}

/* ---------- Settings: authenticator app ---------- */

export function AuthenticatorSetup() {
  const { secondFactor, refreshSecondFactor } = useAuth();
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!supabase) return;
    setBusy(true);
    // Clear any half-finished enrolment first
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${Date.now()}` });
    setBusy(false);
    if (error) return toast.error(error.message);
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!enroll || !supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
    setBusy(false);
    if (error) {
      setCode('');
      return toast.error('That code is not right — try the latest one from the app');
    }
    setEnroll(null);
    setCode('');
    await refreshSecondFactor();
    toast.success('Authenticator app enabled');
  };

  const remove = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.mfa.listFactors();
    for (const f of data?.totp ?? []) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (error) return toast.error(error.message);
    }
    await supabase.auth.refreshSession();
    await refreshSecondFactor();
    toast.success('Authenticator app removed');
  };

  return (
    <Method
      icon={<Smartphone className="size-4" />}
      title="Authenticator app"
      description="Google Authenticator, Microsoft Authenticator, Authy or 1Password. Works offline."
      enabled={Boolean(secondFactor?.totp)}
      action={
        secondFactor?.totp ? (
          <Button variant="secondary" size="sm" onClick={remove}>
            Remove
          </Button>
        ) : (
          <Button size="sm" onClick={start} loading={busy && !enroll}>
            Set up
          </Button>
        )
      }
    >
      <Dialog open={enroll !== null} onClose={() => setEnroll(null)} title="Set up your authenticator app" size="sm">
        {enroll && (
          <form onSubmit={confirm} className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
              <li>Open your authenticator app and add a new account.</li>
              <li>Scan this QR code (or enter the key below).</li>
              <li>Type the 6-digit code it shows.</li>
            </ol>
            <div className="mx-auto w-fit rounded-2xl bg-white p-3">
              <img src={enroll.qr} alt="QR code for your authenticator app" className="size-44" />
            </div>
            <p className="break-all rounded-xl bg-fg/5 p-2 text-center font-mono text-xs select-all">{enroll.secret}</p>
            <CodeInput value={code} onChange={setCode} autoFocus />
            <Button type="submit" className="w-full" loading={busy} disabled={code.length !== 6}>
              Turn on
            </Button>
          </form>
        )}
      </Dialog>
    </Method>
  );
}

/* ---------- Settings: email codes ---------- */

export function EmailCodeSetup() {
  const { secondFactor, session, refreshSecondFactor } = useAuth();
  const { data: server } = useServerStatus();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      await apiPost('/api/2fa/email-code', session?.access_token, { purpose: 'enable' });
      setOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('verify_email_otp', { p_code: code, p_enable: true });
    setBusy(false);
    if (error || !data) {
      setCode('');
      return toast.error(error?.message ?? 'That code is wrong or expired');
    }
    setOpen(false);
    setCode('');
    await refreshSecondFactor();
    toast.success('Email codes enabled');
  };

  const disable = async () => {
    if (!supabase) return;
    const { error } = await supabase.rpc('disable_email_2fa');
    if (error) return toast.error(error.message);
    await refreshSecondFactor();
    toast.success('Email codes turned off');
  };

  return (
    <Method
      icon={<Mail className="size-4" />}
      title="Email code"
      description={
        server?.email
          ? `A 6-digit code is emailed to ${session?.user.email} each time you sign in.`
          : 'Needs an email sender on the server (see the README) before it can be turned on.'
      }
      enabled={Boolean(secondFactor?.email)}
      action={
        secondFactor?.email ? (
          <Button variant="secondary" size="sm" onClick={disable}>
            Turn off
          </Button>
        ) : (
          <Button size="sm" onClick={start} loading={busy && !open} disabled={!server?.email}>
            Set up
          </Button>
        )
      }
    >
      <Dialog open={open} onClose={() => setOpen(false)} title="Check your email" size="sm">
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm text-muted">Enter the 6-digit code we sent to {session?.user.email}.</p>
          <CodeInput value={code} onChange={setCode} autoFocus />
          <Button type="submit" className="w-full" loading={busy} disabled={code.length !== 6}>
            Turn on
          </Button>
        </form>
      </Dialog>
    </Method>
  );
}

function Method({
  icon,
  title,
  description,
  enabled,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  action: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-soft flex items-start gap-3 rounded-2xl p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fg/5 text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {title}
          {enabled && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="size-3" /> On
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      {action}
      {children}
    </div>
  );
}

export function TwoFactorIcon() {
  return (
    <span className="bg-gradient-accent glow grid size-12 place-items-center rounded-2xl text-white">
      <KeyRound className="size-5" />
    </span>
  );
}
