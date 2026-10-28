import { supabase, isSupabaseConfigured, getSupabaseConfig } from './supabaseClient';

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
      // Fallback
    }
  }
  let hash = 0;
  const str = password + 'ct_salt_2026';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
};

const getUsersRegistry = () => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
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
  
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        // If email not confirmed, signal for 6-digit verification
        if (
          error.message?.toLowerCase().includes('email not confirmed') ||
          error.status === 400 && error.message?.toLowerCase().includes('not confirmed')
        ) {
          return {
            success: false,
            unconfirmed: true,
            email: cleanEmail,
            error: 'Your email address is not yet verified. Please enter the 6-digit verification code.'
          };
        }
        throw error;
      }

      if (data?.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email?.toLowerCase().trim(),
          name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
          authProvider: 'email',
          isCloud: true
        };
        setActiveUserSession(userObj);
        return { success: true, user: userObj };
      }
    } catch (supabaseErr) {
      console.warn('Supabase sign-in error:', supabaseErr.message);
      
      if (supabaseErr.message?.toLowerCase().includes('not confirmed')) {
        return {
          success: false,
          unconfirmed: true,
          email: cleanEmail,
          error: 'Your email address is not yet verified. Please enter the 6-digit verification code.'
        };
      }
      if (supabaseErr.message?.toLowerCase().includes('invalid login credentials')) {
        return {
          success: false,
          email: cleanEmail,
          error: 'Invalid password or credentials. If you originally created this account with Google OAuth, please use "Continue with Google", or click "Forgot password?" to set a password.'
        };
      }
      return {
        success: false,
        email: cleanEmail,
        error: supabaseErr.message || 'Invalid email or password.'
      };
    }
  }

  // Fallback to local user registry if offline / cloud down
  const users = getUsersRegistry();
  const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!existingUser) {
    return {
      success: false,
      error: 'Invalid login credentials. Please check your email and password or sign up.'
    };
  }

  const hashedInput = await hashPassword(password);
  if (existingUser.passwordHash !== hashedInput) {
    return {
      success: false,
      error: 'Invalid login credentials. Please check your email and password.'
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
 * Sign Up with Name, Email & Password (Supabase emails a 6-digit verification code)
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

  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, error: 'Database service is unavailable.' };
  }

  const { error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`
      }
    }
  });

  if (error && !error.message?.includes('already registered')) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    requiresVerification: true,
    email: cleanEmail,
    name: cleanName
  };
};

/**
 * Resend 6-Digit Verification Code
 */
export const resendVerificationCode = async (email, type = 'signup') => {
  const cleanEmail = email.trim().toLowerCase();

  if (supabase && isSupabaseConfigured()) {
    try {
      if (type === 'recovery') {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: redirectUrl });
      } else {
        await supabase.auth.resend({ type: 'signup', email: cleanEmail });
      }
    } catch (e) {
      console.warn('Failed to resend cloud code:', e);
    }
  }

  return { success: true };
};

const toUserObj = (user, fallbackEmail) => {
  const email = (user.email || fallbackEmail).toLowerCase().trim();
  const name = user.user_metadata?.full_name || email.split('@')[0];
  return {
    id: user.id,
    email,
    name,
    avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    authProvider: 'email',
    isCloud: true
  };
};

/**
 * Verify 6-Digit Signup Code & Activate Account
 */
export const verifySignupCode = async (email, code) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'signup'
    });

    if (error) {
      return { success: false, error: error.message || 'Invalid or expired 6-digit code.' };
    }

    if (data?.user && data?.session) {
      const userObj = toUserObj(data.user, cleanEmail);
      setActiveUserSession(userObj);
      return { success: true, user: userObj };
    }

    return {
      success: true,
      needsLogin: true,
      message: 'Email successfully verified! Please sign in with your credentials.'
    };
  }

  return { success: false, error: 'Database service is unavailable.' };
};

/**
 * Request Password Reset (Supabase emails a reset link and 6-digit recovery code)
 */
export const requestPasswordReset = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (supabase && isSupabaseConfigured()) {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });
    if (error) console.warn('Supabase resetPasswordForEmail notice:', error.message);
  }

  // Always report success so the form can't be used to probe which emails exist
  return {
    success: true,
    email: cleanEmail
  };
};

/**
 * Update user password directly (used after clicking email recovery link)
 */
export const updateUserPassword = async (newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      if (data?.user) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
          avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.user.email)}`,
          authProvider: 'email',
          isCloud: true
        };
        setActiveUserSession(userObj);
        return { success: true, user: userObj, message: 'Password updated successfully!' };
      }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  }

  return { success: false, error: 'Database service unavailable.' };
};

/**
 * Verify 6-Digit Code & Reset Password
 */
export const verifyAndResetPassword = async (email, code, newPassword) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Please enter the 6-digit code received in your email.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: 'recovery'
      });
      if (error) throw error;
      if (!data?.session) {
        return { success: false, error: 'Invalid or expired 6-digit code.' };
      }

      const { data: updated, error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;

      const userObj = toUserObj(updated.user, cleanEmail);
      setActiveUserSession(userObj);
      return { success: true, user: userObj, message: 'Password reset successfully!' };
    } catch (err) {
      console.warn('Supabase password reset error:', err);
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
  }

  return { success: false, error: 'Database service is unavailable.' };
};

/**
 * Genuine Google OAuth Sign-in with Provider Pre-flight Check
 */
export const signInWithGoogle = async () => {
  if (supabase && isSupabaseConfigured()) {
    try {
      // 1. Pre-flight probe to ensure Supabase Google Provider is configured and active
      // Prevents browser top-level navigation into raw 400 JSON screen
      try {
        const probe = await fetch(`${getSupabaseConfig().url.replace(/\/$/, '')}/auth/v1/authorize?provider=google`);
        if (!probe.ok) {
          const probeJson = await probe.json().catch(() => ({}));
          if (probeJson.msg?.includes('provider is not enabled')) {
            return {
              success: false,
              needsConfig: true,
              error: 'Google OAuth provider is not yet enabled in the Supabase Cloud dashboard.'
            };
          }
        }
      } catch (probeErr) {
        console.warn('Google provider probe warning:', probeErr);
      }

      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, redirecting: true, url: data?.url };
    } catch (e) {
      return { success: false, error: e.message || 'Google OAuth failed to initialize.' };
    }
  }

  return { success: false, error: 'Cloud database is not connected.' };
};

/**
 * Sign Out
 */
export const signOut = async () => {
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign-out network notice:', e);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localErr) {
        console.warn('Supabase local sign-out notice:', localErr);
      }
    }
  }

  // Clear any residual Supabase auth tokens from localStorage
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // Ignore storage iteration errors
  }

  setActiveUserSession(null);
  return { success: true };
};

export const signOutUser = signOut;
