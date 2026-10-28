import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/layout/Logo';
import { APP_NAME } from '@/lib/constants';

const appUrl = (path: string) => `${window.location.origin}${path}`;

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <Logo className="size-8" />
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: appUrl('/app'), queryParams: { prompt: 'select_account' } },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };
  return (
    <Button variant="secondary" className="w-full" size="lg" onClick={onClick} loading={loading}>
      {!loading && (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
          <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z" />
          <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-subtle">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function DemoLink() {
  const { enterDemo } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="font-medium text-accent hover:underline"
      onClick={() => {
        enterDemo();
        navigate('/app');
      }}
    >
      try the demo
    </button>
  );
}

function NotConfigured() {
  return (
    <p className="rounded-lg bg-surface-2 p-3 text-sm text-muted">
      Accounts are unavailable because Supabase isn't configured for this deployment. You can still <DemoLink />.
    </p>
  );
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setUnconfirmed(false);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      if (error.code === 'email_not_confirmed') setUnconfirmed(true);
      setError(
        error.code === 'invalid_credentials'
          ? 'Incorrect email or password. If you signed up with Google, use "Continue with Google".'
          : error.message,
      );
      return;
    }
    navigate(from, { replace: true });
  };

  const resend = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: appUrl('/app') } });
    if (error) toast.error(error.message);
    else toast.success('Confirmation email sent');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your job search workspace."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>{' '}
          or <DemoLink />.
        </>
      }
    >
      {!isSupabaseConfigured ? (
        <NotConfigured />
      ) : (
        <>
          <GoogleButton />
          <Divider />
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email">
              {(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Field label="Password">
              {(id) => (
                <Input id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              )}
            </Field>
            {error && (
              <div role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                {error}
                {unconfirmed && (
                  <button type="button" onClick={resend} className="mt-1 block font-medium underline">
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign in
            </Button>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-muted hover:text-fg">
                Forgot password?
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: appUrl('/app') },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Email confirmation disabled → we already have a session
    if (data.session) navigate('/app', { replace: true });
    else setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
            <MailCheck className="size-6" />
          </div>
          <p className="text-sm text-muted">
            We sent a confirmation link to <strong className="text-fg">{sentTo}</strong>. Click it to activate your account.
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={async () => {
              const { error } = await supabase!.auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: appUrl('/app') } });
              if (error) toast.error(error.message);
              else toast.success('Sent again');
            }}
          >
            Resend email
          </Button>
          <Link to="/login" className="mt-2 text-sm font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever. Your data stays private to you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured ? (
        <NotConfigured />
      ) : (
        <>
          <GoogleButton />
          <Divider />
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Name">
              {(id) => <Input id={id} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
            </Field>
            <Field label="Email">
              {(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            <Field label="Password" hint="At least 8 characters">
              {(id) => (
                <Input id={id} type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              )}
            </Field>
            {error && (
              <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl('/reset-password') });
    setLoading(false);
    if (error && error.status === 429) {
      toast.error('Too many requests — please wait a minute and try again.');
      return;
    }
    // Same message whether or not the account exists, so this can't be used to discover emails
    setSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={sent ? undefined : "Enter your email and we'll send you a reset link."}
      footer={
        <Link to="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-muted">
          If an account exists for <strong className="text-fg">{email}</strong>, a password reset link is on its way.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            {(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!isSupabaseConfigured}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPassword() {
  const { status, recovering, clearRecovery } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    clearRecovery();
    toast.success('Password updated');
    navigate('/app', { replace: true });
  };

  if (status === 'loading') return null;

  if (!recovering && status !== 'signed-in') {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is invalid or has already been used.">
        <Link to="/forgot-password">
          <Button className="w-full" size="lg">
            Request a new link
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" hint="At least 8 characters">
          {(id) => <Input id={id} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Confirm password">
          {(id) => <Input id={id} type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
