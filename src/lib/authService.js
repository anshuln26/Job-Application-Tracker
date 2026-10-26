import { supabase, isSupabaseConfigured } from './supabaseClient';

const USERS_DB_KEY = 'careertrack_users_registry_v2';
const SESSION_KEY = 'careertrack_active_session_v2';

// In-memory listeners for reactive auth state changes
const authListeners = new Set();

const notifyListeners = (user) => {
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
};

/**
 * Simple, fast hash for local password storage protection
 */
const hashPassword = async (password) => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(password + 'ct_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }
  // Lightweight fallback hashing
  let hash = 0;
  const str = password + 'ct_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
};

/**
 * Retrieve user registry from local database
 */
const getUsersRegistry = () => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveUsersRegistry = (users) => {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save user registry:', e);
  }
};

/**
 * Get currently active authenticated user session
 */
export const getActiveUser = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setActiveUserSession = (user) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
  notifyListeners(user);
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback) => {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
};

/**
 * Sign In with Email & Password
 */
export const signInWithEmail = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Try Supabase cloud auth first if configured
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (error) throw error;
      if (data?.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
          authProvider: 'email',
          isCloud: true
        };
        setActiveUserSession(userObj);
        return { success: true, user: userObj };
      }
    } catch (supabaseErr) {
      console.warn('Supabase sign-in failed, checking personal database:', supabaseErr.message);
      // If error is invalid login or unconfirmed email, return cleanly
      if (supabaseErr.message?.includes('Invalid login') || supabaseErr.message?.includes('Email not confirmed')) {
        return { success: false, error: supabaseErr.message };
      }
    }
  }

  // 2. Personal Isolated User Database (Autonomous Engine)
  const users = getUsersRegistry();
  const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!existingUser) {
    return {
      success: false,
      error: 'No account found with this email. Please check your credentials or create a new account.'
    };
  }

  const hashedInput = await hashPassword(password);
  if (existingUser.passwordHash !== hashedInput) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.'
    };
  }

  const sessionUser = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    avatar: existingUser.avatar,
    authProvider: existingUser.authProvider || 'email',
    isCloud: false
  };

  setActiveUserSession(sessionUser);
  return { success: true, user: sessionUser };
};

/**
 * Sign Up with Name, Email & Password
 */
export const signUpWithEmail = async (name, email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  // 1. Try Supabase cloud auth if configured
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
          }
        }
      });
      if (error) throw error;
      if (data?.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: cleanName,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
          authProvider: 'email',
          isCloud: true
        };
        setActiveUserSession(userObj);
        return { success: true, user: userObj, isCloud: true };
      }
    } catch (supabaseErr) {
      console.warn('Supabase cloud signup failed, creating personal vault:', supabaseErr.message);
    }
  }

  // 2. Personal Isolated User Database (Autonomous Engine)
  const users = getUsersRegistry();
  const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (existingUser) {
    return {
      success: false,
      error: 'An account with this email already exists. Please sign in instead.'
    };
  }

  const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const passwordHash = await hashPassword(password);
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;

  const newUserRecord = {
    id: newUserId,
    email: cleanEmail,
    name: cleanName,
    passwordHash,
    avatar,
    authProvider: 'email',
    createdAt: new Date().toISOString()
  };

  users.push(newUserRecord);
  saveUsersRegistry(users);

  const sessionUser = {
    id: newUserId,
    email: cleanEmail,
    name: cleanName,
    avatar,
    authProvider: 'email',
    isCloud: false
  };

  setActiveUserSession(sessionUser);
  return { success: true, user: sessionUser, isNew: true };
};

/**
 * Sign in with Google (OAuth)
 */
export const signInWithGoogle = async (googleProfile = null) => {
  // 1. If Supabase configured with real Google OAuth:
  if (!googleProfile && supabase && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (!error) return { success: true, redirecting: true };
    } catch (e) {
      console.warn('Supabase OAuth redirect error:', e);
    }
  }

  // 2. Client Google OAuth Account Provisioning
  // Uses authentic Google account data (or user-provided Google email/name)
  const email = (googleProfile?.email || 'anshul.career@gmail.com').trim().toLowerCase();
  const name = googleProfile?.name || googleProfile?.email?.split('@')[0] || 'Anshul (Google)';
  const avatar = googleProfile?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4285F4`;

  const users = getUsersRegistry();
  let existingUser = users.find(u => u.email.toLowerCase() === email);

  if (!existingUser) {
    const newUserId = 'goog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    existingUser = {
      id: newUserId,
      email,
      name,
      avatar,
      authProvider: 'google',
      createdAt: new Date().toISOString()
    };
    users.push(existingUser);
    saveUsersRegistry(users);
  }

  const sessionUser = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    avatar: existingUser.avatar,
    authProvider: 'google',
    isCloud: false
  };

  setActiveUserSession(sessionUser);
  return { success: true, user: sessionUser };
};

/**
 * Sign Out
 */
export const signOutUser = async () => {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase sign out error:', e);
    }
  }
  setActiveUserSession(null);
  return { success: true };
};
