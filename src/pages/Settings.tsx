import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthProvider';
import { usePreferences } from '@/hooks/usePreferences';
import { useApplications } from '@/hooks/useApplications';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Dialog, Field, Input, Segmented, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { CURRENCIES } from '@/lib/currency';
import { download } from '@/lib/csv';
import { resetDemoData } from '@/data/repository';

export default function Settings() {
  const { status, user, displayName, signOut } = useAuth();
  const { theme, setTheme, currency, setCurrency } = usePreferences();
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
          <>
            <Section title="Profile" description="How you appear in the app.">
              <ProfileForm initialName={displayName} email={user.email ?? ''} />
            </Section>
            {provider === 'email' && (
              <Section title="Password">
                <PasswordForm />
              </Section>
            )}
          </>
        )}

        <Section title="Preferences">
          <div className="space-y-4">
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
            <Row label="Display currency" hint="Used for compensation comparisons and new applications.">
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
              Download full backup (JSON)
            </Button>
            {isDemo && (
              <Button
                variant="secondary"
                onClick={() => {
                  resetDemoData();
                  qc.invalidateQueries({ queryKey: ['applications'] });
                  toast.success('Demo data reset');
                }}
              >
                Reset demo data
              </Button>
            )}
          </div>
        </Section>

        {!isDemo && user && (
          <Section title="Delete account" description="Permanently delete your account and every application. This cannot be undone." danger>
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

function Section({ title, description, children, danger }: { title: string; description?: string; children: ReactNode; danger?: boolean }) {
  return (
    <Card className={danger ? 'border-danger/30 p-5' : 'p-5'}>
      <h2 className={danger ? 'font-semibold text-danger' : 'font-semibold'}>{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
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
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Field label="New password" className="flex-1">
        {(id) => <Input id={id} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
      <Button type="submit" loading={saving} disabled={!password}>
        Change password
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
