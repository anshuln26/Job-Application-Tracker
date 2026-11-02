import type { Application, ApplicationInput, Contact, ContactInput, UserSettings } from '@/types';
import { supabase } from '@/lib/supabase';
import { fromRow, toRow, type ApplicationRow } from './mappers';
import { createDemoApplications, createDemoContacts } from './demo';

/** Storage backend for applications. Signed-in users use Supabase; demo mode uses localStorage. */
export interface Repository {
  list(): Promise<Application[]>;
  create(input: ApplicationInput): Promise<Application>;
  update(id: string, patch: Partial<ApplicationInput>): Promise<Application>;
  remove(id: string): Promise<void>;
  importMany(inputs: ApplicationInput[]): Promise<number>;
}

export function supabaseRepository(userId: string): Repository {
  const db = () => {
    if (!supabase) throw new Error('Supabase is not configured');
    return supabase.from('applications');
  };

  return {
    async list() {
      const { data, error } = await db()
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as ApplicationRow[]).map(fromRow);
    },
    async create(input) {
      const { data, error } = await db()
        .insert({ ...toRow(input), user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return fromRow(data as ApplicationRow);
    },
    async update(id, patch) {
      const { data, error } = await db().update(toRow(patch)).eq('id', id).select().single();
      if (error) throw error;
      return fromRow(data as ApplicationRow);
    },
    async remove(id) {
      const { error } = await db().delete().eq('id', id);
      if (error) throw error;
    },
    async importMany(inputs) {
      if (inputs.length === 0) return 0;
      const { error } = await db().insert(inputs.map((i) => ({ ...toRow(i), user_id: userId })));
      if (error) throw error;
      return inputs.length;
    },
  };
}

const DEMO_KEY = 'applytrack:demo-applications';

export function localRepository(storage: Storage = localStorage): Repository {
  const read = (): Application[] => {
    try {
      const raw = storage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw) as Application[];
    } catch {
      // fall through to fresh demo data
    }
    const seeded = createDemoApplications();
    write(seeded);
    return seeded;
  };
  const write = (apps: Application[]) => {
    try {
      storage.setItem(DEMO_KEY, JSON.stringify(apps));
    } catch {
      // storage full or blocked — demo still works in memory for this page view
    }
  };
  const build = (input: ApplicationInput): Application => {
    const now = new Date().toISOString();
    return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  };

  return {
    async list() {
      return read();
    },
    async create(input) {
      const app = build(input);
      write([app, ...read()]);
      return app;
    },
    async update(id, patch) {
      const apps = read();
      const idx = apps.findIndex((a) => a.id === id);
      if (idx < 0) throw new Error('Application not found');
      const next = { ...apps[idx], ...patch, updatedAt: new Date().toISOString() };
      apps[idx] = next;
      write(apps);
      return next;
    },
    async remove(id) {
      write(read().filter((a) => a.id !== id));
    },
    async importMany(inputs) {
      write([...inputs.map(build), ...read()]);
      return inputs.length;
    },
  };
}

export function resetDemoData(storage: Storage = localStorage) {
  storage.removeItem(DEMO_KEY);
  storage.removeItem('applytrack:demo-contacts');
  storage.removeItem('applytrack:demo-settings');
}

/* ---------- Contacts ---------- */

export interface ContactsRepository {
  list(): Promise<Contact[]>;
  create(input: ContactInput): Promise<Contact>;
  update(id: string, patch: Partial<ContactInput>): Promise<Contact>;
  remove(id: string): Promise<void>;
}

interface ContactRow {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  relationship: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
  application_ids: string[] | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
}

const contactFromRow = (r: ContactRow): Contact => ({
  id: r.id,
  name: r.name,
  company: r.company ?? '',
  role: r.role ?? '',
  relationship: r.relationship as Contact['relationship'],
  email: r.email ?? '',
  phone: r.phone ?? '',
  linkedin: r.linkedin ?? '',
  notes: r.notes ?? '',
  applicationIds: r.application_ids ?? [],
  lastContacted: r.last_contacted,
  nextFollowUp: r.next_follow_up,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

function contactToRow(c: Partial<ContactInput>): Partial<ContactRow> {
  const row: Partial<ContactRow> = {};
  if (c.name !== undefined) row.name = c.name.trim();
  if (c.company !== undefined) row.company = c.company;
  if (c.role !== undefined) row.role = c.role;
  if (c.relationship !== undefined) row.relationship = c.relationship;
  if (c.email !== undefined) row.email = c.email;
  if (c.phone !== undefined) row.phone = c.phone;
  if (c.linkedin !== undefined) row.linkedin = c.linkedin;
  if (c.notes !== undefined) row.notes = c.notes;
  if (c.applicationIds !== undefined) row.application_ids = c.applicationIds;
  if (c.lastContacted !== undefined) row.last_contacted = c.lastContacted || null;
  if (c.nextFollowUp !== undefined) row.next_follow_up = c.nextFollowUp || null;
  return row;
}

export function supabaseContacts(userId: string): ContactsRepository {
  const db = () => supabase!.from('contacts');
  return {
    async list() {
      const { data, error } = await db().select('*').eq('user_id', userId).order('name');
      if (error) throw error;
      return (data as ContactRow[]).map(contactFromRow);
    },
    async create(input) {
      const { data, error } = await db().insert({ ...contactToRow(input), user_id: userId }).select().single();
      if (error) throw error;
      return contactFromRow(data as ContactRow);
    },
    async update(id, patch) {
      const { data, error } = await db().update(contactToRow(patch)).eq('id', id).select().single();
      if (error) throw error;
      return contactFromRow(data as ContactRow);
    },
    async remove(id) {
      const { error } = await db().delete().eq('id', id);
      if (error) throw error;
    },
  };
}

const DEMO_CONTACTS_KEY = 'applytrack:demo-contacts';

export function localContacts(storage: Storage = localStorage): ContactsRepository {
  const read = (): Contact[] => {
    try {
      const raw = storage.getItem(DEMO_CONTACTS_KEY);
      if (raw) return JSON.parse(raw) as Contact[];
    } catch {
      // reseed
    }
    const seeded = createDemoContacts();
    write(seeded);
    return seeded;
  };
  const write = (list: Contact[]) => {
    try {
      storage.setItem(DEMO_CONTACTS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };
  return {
    async list() {
      return read().sort((a, b) => a.name.localeCompare(b.name));
    },
    async create(input) {
      const now = new Date().toISOString();
      const c = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      write([...read(), c]);
      return c;
    },
    async update(id, patch) {
      const list = read();
      const i = list.findIndex((c) => c.id === id);
      if (i < 0) throw new Error('Contact not found');
      list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
      write(list);
      return list[i];
    },
    async remove(id) {
      write(read().filter((c) => c.id !== id));
    },
  };
}

/* ---------- Settings ---------- */

export const DEFAULT_SETTINGS: UserSettings = {
  weeklyGoal: 10,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  emailDigest: false,
  pushEnabled: false,
  emailTwoFactor: false,
  calendarToken: null,
};

export type EditableSettings = Partial<Pick<UserSettings, 'weeklyGoal' | 'timezone' | 'emailDigest' | 'pushEnabled'>>;

export interface SettingsRepository {
  get(): Promise<UserSettings>;
  update(patch: EditableSettings): Promise<UserSettings>;
}

interface SettingsRow {
  weekly_goal: number;
  timezone: string;
  email_digest: boolean;
  push_enabled: boolean;
  email_2fa: boolean;
  calendar_token: string | null;
}

const settingsFromRow = (r: SettingsRow | null): UserSettings =>
  r
    ? {
        weeklyGoal: r.weekly_goal,
        timezone: r.timezone,
        emailDigest: r.email_digest,
        pushEnabled: r.push_enabled,
        emailTwoFactor: r.email_2fa,
        calendarToken: r.calendar_token,
      }
    : DEFAULT_SETTINGS;

export function supabaseSettings(userId: string): SettingsRepository {
  const db = () => supabase!.from('user_settings');
  return {
    async get() {
      const { data, error } = await db().select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return settingsFromRow(data as SettingsRow | null);
    },
    async update(patch) {
      const row: Record<string, unknown> = {};
      if (patch.weeklyGoal !== undefined) row.weekly_goal = patch.weeklyGoal;
      if (patch.timezone !== undefined) row.timezone = patch.timezone;
      if (patch.emailDigest !== undefined) row.email_digest = patch.emailDigest;
      if (patch.pushEnabled !== undefined) row.push_enabled = patch.pushEnabled;
      const updated = await db().update(row).eq('user_id', userId).select().maybeSingle();
      if (updated.error) throw updated.error;
      if (updated.data) return settingsFromRow(updated.data as SettingsRow);
      const inserted = await db()
        .insert({ user_id: userId, timezone: DEFAULT_SETTINGS.timezone, ...row })
        .select()
        .single();
      if (inserted.error) throw inserted.error;
      return settingsFromRow(inserted.data as SettingsRow);
    },
  };
}

const DEMO_SETTINGS_KEY = 'applytrack:demo-settings';

export function localSettings(storage: Storage = localStorage): SettingsRepository {
  const read = (): UserSettings => {
    try {
      // A smaller goal makes the demo's ring and streak meaningful
      return { ...DEFAULT_SETTINGS, weeklyGoal: 3, ...JSON.parse(storage.getItem(DEMO_SETTINGS_KEY) ?? '{}') };
    } catch {
      return DEFAULT_SETTINGS;
    }
  };
  return {
    async get() {
      return read();
    },
    async update(patch) {
      const next = { ...read(), ...patch };
      try {
        storage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    },
  };
}
