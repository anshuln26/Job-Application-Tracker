import type { Application, ApplicationInput } from '@/types';
import { supabase } from '@/lib/supabase';
import { fromRow, toRow, type ApplicationRow } from './mappers';
import { createDemoApplications } from './demo';

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
}
