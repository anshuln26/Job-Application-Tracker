import { supabase, isSupabaseConfigured } from './supabaseClient';

const USERS_DB_KEY = 'careertrack_users_registry_v2';
const SESSION_KEY = 'careertrack_active_session_v2';
const PENDING_VERIFICATION_KEY = 'careertrack_pending_verification';

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
 * Generate cryptographically sound 6-digit OTP code
 */
export const generate6DigitCode = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (100000 + (arr[0] % 900000)).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
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
      console.warn('Supabase sign-in error:', supabaseErr.message);
      
      // If error is explicit bad credentials or unconfirmed, return directly
      if (
        supabaseErr.message?.toLowerCase().includes('invalid login credentials') ||
        supabaseErr.message?.toLowerCase().includes('email not confirmed')
      ) {
        return {
          success: false,
          unconfirmed: supabaseErr.message?.toLowerCase().includes('not confirmed'),
          email: cleanEmail,
          error: supabaseErr.message
        };
      }
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
 * Sign Up with Name, Email & Password (Dispatches 6-digit verification code)
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

  // Generate 6-digit verification code
  const otpCode = generate6DigitCode();

  // 1. Register with Supabase
  if (supabase && isSupabaseConfigured()) {
    try {
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

      // Even if user already registered or needs confirmation
      if (error && !error.message?.includes('already registered')) {
        console.warn('Supabase signUp notice:', error.message);
      }

      // Store 6-digit verification code in Supabase database
      const { error: rpcErr } = await supabase.rpc('create_verification_code', {
        p_email: cleanEmail,
        p_code: otpCode,
        p_type: 'signup'
      });

      if (rpcErr) {
        console.warn('RPC create_verification_code notice:', rpcErr);
      }
    } catch (err) {
      console.warn('Supabase cloud signup exception:', err);
    }
  }

  // Cache pending verification locally so password is known for auto-login after code verification
  localStorage.setItem(
    PENDING_VERIFICATION_KEY,
    JSON.stringify({
      email: cleanEmail,
      name: cleanName,
      password,
      code: otpCode,
      createdAt: Date.now()
    })
  );

  return {
    success: true,
    requiresVerification: true,
    email: cleanEmail,
    code: otpCode,
    name: cleanName
  };
};

/**
 * Resend 6-Digit Verification Code
 */
export const resendVerificationCode = async (email, type = 'signup') => {
  const cleanEmail = email.trim().toLowerCase();
  const newOtp = generate6DigitCode();

  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.rpc('create_verification_code', {
        p_email: cleanEmail,
        p_code: newOtp,
        p_type: type
      });
      if (type === 'recovery') {
        await supabase.auth.resetPasswordForEmail(cleanEmail);
      }
    } catch (e) {
      console.warn('Failed to resend cloud code:', e);
    }
  }

  // Update cached pending code
  try {
    const raw = localStorage.getItem(PENDING_VERIFICATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email === cleanEmail) {
        parsed.code = newOtp;
        parsed.createdAt = Date.now();
        localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(parsed));
      }
    }
  } catch {}

  return { success: true, code: newOtp };
};

/**
 * Verify 6-Digit Signup Code & Activate Account
 */
export const verifySignupCode = async (email, code, passwordOverride = null) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  let pendingPassword = passwordOverride;
  let pendingName = cleanEmail.split('@')[0];

  try {
    const raw = localStorage.getItem(PENDING_VERIFICATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email === cleanEmail) {
        pendingPassword = pendingPassword || parsed.password;
        pendingName = parsed.name || pendingName;
      }
    }
  } catch {}

  // 1. Verify via Supabase RPC
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('verify_signup_code', {
        p_email: cleanEmail,
        p_code: cleanCode
      });

      if (error) throw error;
      if (!data?.success) {
        return { success: false, error: data?.error || 'Invalid or expired 6-digit code.' };
      }

      // If we have password, perform automatic cloud login
      if (pendingPassword) {
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pendingPassword
        });

        if (loginRes.data?.user) {
          const userObj = {
            id: loginRes.data.user.id,
            email: cleanEmail,
            name: pendingName,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pendingName)}`,
            authProvider: 'email',
            isCloud: true
          };
          setActiveUserSession(userObj);
          localStorage.removeItem(PENDING_VERIFICATION_KEY);
          return { success: true, user: userObj };
        }
      }

      // If password not in memory, user is verified and can sign in
      localStorage.removeItem(PENDING_VERIFICATION_KEY);
      return {
        success: true,
        needsLogin: true,
        message: 'Email successfully verified! Please sign in with your credentials.'
      };
    } catch (err) {
      console.warn('Supabase verification error:', err);
      return { success: false, error: err.message || 'Verification failed. Please try again.' };
    }
  }

  return { success: false, error: 'Database service is unavailable.' };
};

/**
 * Request Password Reset (Dispatches 6-Digit Recovery Code)
 */
export const requestPasswordReset = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const recoveryCode = generate6DigitCode();

  if (supabase && isSupabaseConfigured()) {
    try {
      // 1. Create recovery code in Supabase
      const { error: rpcErr } = await supabase.rpc('create_verification_code', {
        p_email: cleanEmail,
        p_code: recoveryCode,
        p_type: 'recovery'
      });
      if (rpcErr) console.warn('RPC create recovery code error:', rpcErr);

      // 2. Also trigger Supabase native email dispatch
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail);
      } catch (emailErr) {
        console.warn('Native reset password email dispatch warning:', emailErr);
      }
    } catch (e) {
      console.warn('Supabase recovery request error:', e);
    }
  }

  return {
    success: true,
    email: cleanEmail,
    code: recoveryCode
  };
};

/**
 * Verify 6-Digit Code & Reset Password
 */
export const verifyAndResetPassword = async (email, code, newPassword) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit verification code.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('verify_reset_password_code', {
        p_email: cleanEmail,
        p_code: cleanCode,
        p_new_password: newPassword
      });

      if (error) throw error;
      if (!data?.success) {
        return { success: false, error: data?.error || 'Invalid or expired verification code.' };
      }

      // Automatically sign in with the new password
      const loginRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: newPassword
      });

      if (loginRes.data?.user) {
        const userObj = {
          id: loginRes.data.user.id,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
          authProvider: 'email',
          isCloud: true
        };
        setActiveUserSession(userObj);
        return { success: true, user: userObj, message: 'Password reset successfully!' };
      }

      return {
        success: true,
        needsLogin: true,
        message: 'Password reset successfully! Please sign in with your new password.'
      };
    } catch (err) {
      console.warn('Supabase password reset error:', err);
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
  }

  return { success: false, error: 'Database service is unavailable.' };
};

/**
 * Genuine Google OAuth Sign-in Redirect
 */
export const signInWithGoogle = async () => {
  if (supabase && isSupabaseConfigured()) {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
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
      console.warn('Supabase sign-out error:', e);
    }
  }
  setActiveUserSession(null);
  return { success: true };
};

export const signOutUser = signOut;
