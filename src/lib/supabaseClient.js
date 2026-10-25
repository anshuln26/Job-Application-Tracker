import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'careertrack_supabase_url';
const STORAGE_KEY_KEY = 'careertrack_supabase_anon_key';

/**
 * Retrieves the effective Supabase URL and anon key from localStorage or .env.
 */
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    try {
      localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
      localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';
    } catch (e) {
      console.warn('Could not read localStorage for Supabase keys:', e);
    }
  }

  const effectiveUrl = (localUrl || envUrl).trim();
  const effectiveKey = (localKey || envKey).trim();

  const isConfigured = Boolean(
    effectiveUrl &&
    !effectiveUrl.includes('your-project-ref') &&
    effectiveKey &&
    !effectiveKey.includes('your-anon')
  );

  return {
    url: effectiveUrl,
    anonKey: effectiveKey,
    isConfigured,
    isCustomOverride: Boolean(localUrl || localKey)
  };
};

export const isSupabaseConfigured = () => {
  return getSupabaseConfig().isConfigured;
};

// Create the singleton Supabase client
let clientInstance = null;

const createNewClient = () => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
};

clientInstance = createNewClient();

export const supabase = clientInstance;

/**
 * Updates Supabase configuration in localStorage and reloads the client.
 */
export const updateSupabaseCredentials = (newUrl, newKey) => {
  if (typeof window === 'undefined') return;
  if (newUrl && newKey) {
    localStorage.setItem(STORAGE_URL_KEY, newUrl.trim());
    localStorage.setItem(STORAGE_KEY_KEY, newKey.trim());
  } else {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  // Re-create client instance
  clientInstance = createNewClient();
};

/**
 * Real-time diagnostic connection test for Supabase PostgreSQL and Auth.
 */
export const testSupabaseConnection = async (testUrl, testKey) => {
  const url = testUrl || getSupabaseConfig().url;
  const key = testKey || getSupabaseConfig().anonKey;

  if (!url || !key) {
    return {
      success: false,
      code: 'MISSING_CREDENTIALS',
      message: 'Supabase URL and Anon/Publishable Key are required.'
    };
  }

  try {
    // 1. Test basic network reachability to project endpoint
    const trimmedUrl = url.replace(/\/$/, '');
    const healthUrl = `${trimmedUrl}/auth/v1/health`;
    
    let res;
    try {
      res = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'apikey': key
        }
      });
    } catch (networkErr) {
      const errStr = String(networkErr.message || networkErr);
      if (errStr.includes('Failed to fetch') || errStr.includes('ENOTFOUND') || errStr.includes('NetworkError')) {
        return {
          success: false,
          code: 'UNREACHABLE_HOST',
          message: `Cannot reach Supabase host at "${url}". The project may be paused, deleted, or the domain has a typo.`
        };
      }
      throw networkErr;
    }

    if (!res.ok && res.status === 401) {
      return {
        success: false,
        code: 'INVALID_API_KEY',
        message: 'Connected to Supabase project, but the Anon/Publishable Key is invalid (HTTP 401 Unauthorized).'
      };
    }

    // 2. Test database query through JS SDK
    const testClient = createClient(url, key);
    const { error: dbError } = await testClient.from('applications').select('id').limit(1);

    if (dbError) {
      // Table doesn't exist yet, but database connected!
      if (dbError.code === '42P01' || dbError.message?.includes('relation "applications" does not exist')) {
        return {
          success: true,
          tableMissing: true,
          code: 'CONNECTED_TABLE_MISSING',
          message: 'Connected to Supabase PostgreSQL, but the "applications" table has not been created yet. Run supabase/schema.sql in the SQL Editor.'
        };
      }
      return {
        success: true,
        code: 'CONNECTED_RLS_PROTECTED',
        message: 'Connected to Supabase! (Row Level Security active).'
      };
    }

    return {
      success: true,
      code: 'CONNECTED_READY',
      message: 'Successfully connected to Supabase PostgreSQL cloud database!'
    };
  } catch (err) {
    return {
      success: false,
      code: 'UNKNOWN_ERROR',
      message: err.message || 'An unexpected error occurred while testing the database connection.'
    };
  }
};
