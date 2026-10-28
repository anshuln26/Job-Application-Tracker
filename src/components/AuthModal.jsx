import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
  resendVerificationCode,
  verifySignupCode,
  requestPasswordReset,
  verifyAndResetPassword,
  updateUserPassword,
  signInWithGoogle
} from '../lib/authService';
import { getSupabaseConfig } from '../lib/supabaseClient';

const supabaseUrl = getSupabaseConfig().url.replace(/\/$/, '');
const supabaseRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  showToast,
  user,
  onSignOut,
  applicationsCount = 0,
  isGate = false,
  isRecoveryMode = false,
  onContinueAsGuest
}) {
  // Mode: 'login' | 'signup' | 'verify_signup' | 'forgot_password' | 'email_link_sent' | 'reset_password_otp' | 'recovery_set_password' | 'google_setup_help'
  const [mode, setMode] = useState(isRecoveryMode ? 'recovery_set_password' : 'login');
  const [prevRecoveryMode, setPrevRecoveryMode] = useState(isRecoveryMode);

  if (isRecoveryMode !== prevRecoveryMode) {
    setPrevRecoveryMode(isRecoveryMode);
    if (isRecoveryMode) {
      setMode('recovery_set_password');
    }
  }

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 6-Digit OTP State (Only entered by user from email, NEVER displayed on screen)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Refs for 6-digit OTP inputs
  const otpInputRefs = useRef([]);

  // Timer for resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP box when entering verification mode
  useEffect(() => {
    if ((mode === 'verify_signup' || mode === 'reset_password_otp') && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  if (!isOpen && !isGate && !isRecoveryMode) return null;

  // Handle OTP digit change with auto-focus
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    
    // Support paste of 6-digit code from email
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setOtp(newOtp);

    // Auto-advance
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 1. Submit Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        showToast?.(`Welcome back, ${res.user.name}!`);
        onAuthSuccess(res.user);
        if (!isGate) onClose?.();
      } else {
        if (res.unconfirmed) {
          setErrorMsg(res.error);
          setEmail(res.email || email);
          await resendVerificationCode(res.email || email, 'signup');
          setResendCooldown(30);
          setMode('verify_signup');
          setInfoMsg('Please enter the 6-digit code received in your email inbox.');
        } else {
          setErrorMsg(res.error || 'Invalid email or password.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUpWithEmail(name, email, password);
      if (res.success && res.requiresVerification) {
        setOtp(['', '', '', '', '', '']);
        setResendCooldown(30);
        setMode('verify_signup');
        setInfoMsg(`We've dispatched a 6-digit verification code to ${email}. Check your email.`);
      } else if (res.success && res.user) {
        showToast?.(`Account created! Welcome, ${res.user.name}.`);
        onAuthSuccess(res.user);
        if (!isGate) onClose?.();
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Account creation encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Verify Signup OTP
  const handleVerifySignup = async (e) => {
    e?.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the code from your email.');
      return;
    }

    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await verifySignupCode(email, fullCode);
      if (res.success) {
        showToast?.('Email verified successfully! Welcome aboard.');
        if (res.user) {
          onAuthSuccess(res.user);
        } else {
          setMode('login');
          setInfoMsg('Email verified! You can now log in with your credentials.');
        }
        if (!isGate && res.user) onClose?.();
      } else {
        setErrorMsg(res.error || 'Invalid or expired 6-digit verification code.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Request Password Reset (Step 1)
  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid account email.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setOtp(['', '', '', '', '', '']);
        setResendCooldown(30);
        setMode('email_link_sent');
      } else {
        setErrorMsg(res.error || 'Failed to dispatch reset email.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send recovery email.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Password Reset via 6-Digit OTP (Step 2 - Manual Code)
  const handleResetPasswordOtp = async (e) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit code received in your email.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      const res = await verifyAndResetPassword(email, fullCode, newPassword);
      if (res.success) {
        showToast?.('Password successfully updated!');
        if (res.user) {
          onAuthSuccess(res.user);
          if (!isGate) onClose?.();
        } else {
          setMode('login');
          setPassword('');
          setInfoMsg('Password updated! Please log in with your new password.');
        }
      } else {
        setErrorMsg(res.error || 'Invalid 6-digit code from email.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Submit Password Reset via Email Link (Step 2 - Recovery URL Link)
  const handleRecoveryLinkPasswordSet = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        showToast?.('Password securely updated! Welcome back.');
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        if (res.user) {
          onAuthSuccess(res.user);
        }
        onClose?.();
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setInfoMsg('Sending new verification email...');

    try {
      const res = await resendVerificationCode(
        email,
        mode === 'reset_password_otp' ? 'recovery' : 'signup'
      );
      if (res.success) {
        setResendCooldown(30);
        setInfoMsg(`New verification email dispatched to ${email}. Check your inbox.`);
        showToast?.('Verification email sent!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend email.');
    }
  };

  // Genuine Google OAuth Sign-in with Pre-flight Protection
  const handleGoogleOAuth = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        if (res.needsConfig) {
          setMode('google_setup_help');
        } else {
          setErrorMsg(res.error || 'Google OAuth failed to initialize.');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google OAuth error.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Dialog for already logged-in user (not guest)
  if (user && !user.isGuest && !isGate && !isRecoveryMode) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}
        onClick={onClose}
      >
        <div
          className="glass-panel animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border-color)',
            padding: '28px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Account Profile
            </h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ width: '32px', height: '32px' }}>
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}
          >
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`}
              alt={user.name}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {user.name || 'Personal Account'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: 'rgba(52, 168, 83, 0.15)',
                    color: '#34A853',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={11} /> Verified Account
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)'
                  }}
                >
                  Supabase Cloud
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Personal Applications</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{applicationsCount} Active Jobs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Data Isolation</span>
              <span style={{ fontWeight: 600, color: '#34A853' }}>100% Encrypted & Isolated</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              await onSignOut();
              setMode('login');
              setErrorMsg('');
              setInfoMsg('');
            }}
            style={{ width: '100%', height: '44px', fontWeight: 600, color: 'var(--status-rejected)' }}
          >
            Sign Out of Account
          </button>
        </div>
      </div>
    );
  }

  // Authentication Container (Gate or Modal)
  return (
    <div
      style={{
        position: isGate ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: isGate ? '100vh' : 'auto',
        background: isGate
          ? 'radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.15) 0%, var(--bg-base) 70%)'
          : 'rgba(0, 0, 0, 0.8)',
        backdropFilter: isGate ? 'none' : 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px 16px'
      }}
      onClick={isGate ? undefined : onClose}
    >
      {/* Brand Header for Gate */}
      {isGate && (
        <div style={{ textAlign: 'center', marginBottom: '28px' }} className="animate-fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              CareerTrack <span style={{ color: 'var(--primary)' }}>Pro</span>
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, maxWidth: '420px' }}>
            Enterprise-grade Job Application & Offer Intelligence. Sign in to access your personal vault.
          </p>
        </div>
      )}

      {/* Main Auth Card */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color)',
          padding: '30px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          {mode !== 'login' && mode !== 'signup' ? (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setInfoMsg('');
              }}
              style={{ width: '32px', height: '32px' }}
              title="Back to Sign In"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Secure Vault
              </span>
            </div>
          )}

          {!isGate && (
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ width: '32px', height: '32px' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--status-rejected)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div
            style={{
              background: 'rgba(52, 168, 83, 0.1)',
              border: '1px solid rgba(52, 168, 83, 0.25)',
              color: '#34A853',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* ----------------- MODE: SIGN IN ----------------- */}
        {mode === 'login' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Welcome Back
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Sign in to your personal job tracker vault
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '18px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-primary)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 20px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                OR SIGN IN WITH EMAIL
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: '44px', fontSize: '0.925rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign up
              </button>
            </div>

            {onContinueAsGuest && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 14px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <User size={14} />
                  <span>Enter as Guest User (Try without an account) &rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- MODE: SIGN UP ----------------- */}
        {mode === 'signup' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Create an Account
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Start tracking job applications with your isolated personal vault
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '18px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 20px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                OR REGISTER WITH EMAIL
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '40px', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: '44px', fontSize: '0.925rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Creating Account...' : 'Create Free Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Log in
              </button>
            </div>

            {onContinueAsGuest && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 14px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <User size={14} />
                  <span>Enter as Guest User (Try without an account) &rarr;</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- MODE: VERIFY EMAIL (6-DIGIT OTP) ----------------- */}
        {mode === 'verify_signup' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <KeyRound size={26} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Verify Your Email
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                We've sent a 6-digit verification code to <br />
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
                Please check your email inbox and enter the code below.
              </p>
            </div>

            <form onSubmit={handleVerifySignup}>
              {/* 6-Digit Boxes - Zero code leakage */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '22px' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '46px',
                      height: '52px',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      borderRadius: '10px',
                      background: 'var(--bg-surface-hover)',
                      border: digit ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || otp.join('').length !== 6}
                style={{ width: '100%', height: '44px', fontSize: '0.925rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Verifying...' : 'Verify & Activate Account'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} className={resendCooldown > 0 ? 'animate-spin' : ''} />
                {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend Email'}
              </button>
            </div>
          </div>
        )}

        {/* ----------------- MODE: FORGOT PASSWORD (STEP 1) ----------------- */}
        {mode === 'forgot_password' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Reset Your Password
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Enter your account email to receive a secure password reset email.
              </p>
            </div>

            <form onSubmit={handleRequestPasswordReset}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: '44px', fontSize: '0.925rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Sending Instructions...' : 'Send Password Reset Email'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Remember your password? Log in
              </button>
            </div>
          </div>
        )}

        {/* ----------------- MODE: EMAIL SENT CONFIRMATION ----------------- */}
        {mode === 'email_link_sent' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(52, 168, 83, 0.15)',
                color: '#34A853',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Reset Email Dispatched!
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              We've dispatched a secure password reset email to: <br />
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
              Check your inbox and click the <strong>Reset Password</strong> link to set your new password.
            </p>

            <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                <Info size={14} style={{ color: 'var(--primary)' }} /> Received a 6-digit recovery code?
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                If your email contains a 6-digit numeric token instead of a clickable link, you can enter it directly.
              </p>
              <button
                type="button"
                onClick={() => setMode('reset_password_otp')}
                style={{
                  marginTop: '8px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Enter 6-digit code manually →
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMode('login')}
              style={{ width: '100%', height: '42px', fontWeight: 600 }}
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* ----------------- MODE: RESET PASSWORD VIA 6-DIGIT CODE ----------------- */}
        {mode === 'reset_password_otp' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Enter Code & New Password
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Enter the 6-digit code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPasswordOtp}>
              {/* 6-Digit Boxes - Zero code leakage */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '44px',
                      height: '48px',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      textAlign: 'center',
                      borderRadius: '10px',
                      background: 'var(--bg-surface-hover)',
                      border: digit ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '40px', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || otp.join('').length !== 6}
                style={{ width: '100%', height: '44px', fontSize: '0.925rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* ----------------- MODE: SET NEW PASSWORD (FROM EMAIL RECOVERY LINK) ----------------- */}
        {mode === 'recovery_set_password' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(52, 168, 83, 0.15)',
                  color: '#34A853',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <Lock size={26} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Set New Password
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Verified via your email reset link. Choose your new password.
              </p>
            </div>

            <form onSubmit={handleRecoveryLinkPasswordSet}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', paddingRight: '40px', height: '42px', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', height: '42px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: '44px', fontSize: '0.925rem', fontWeight: 700, borderRadius: '10px' }}
              >
                {loading ? 'Saving Password...' : 'Save Password & Enter Vault'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.history) {
                      window.history.replaceState(null, '', window.location.pathname);
                    }
                    setMode('login');
                    setErrorMsg('');
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel and Back to Sign In
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ----------------- MODE: GOOGLE SETUP GUIDANCE ----------------- */}
        {mode === 'google_setup_help' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(234, 67, 53, 0.12)',
                  color: '#EA4335',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                Google OAuth Activation Required
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                In your Supabase project (<strong>{supabaseRef}</strong>), Google provider requires OAuth credentials.
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px', padding: '14px', marginBottom: '18px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Quick 2-Minute Setup in Supabase:
              </div>
              <ol style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Create an OAuth 2.0 Client ID in Google Cloud Console.</li>
                <li>Set Authorized Redirect URI to:<br />
                  <code style={{ fontSize: '0.725rem', background: 'var(--bg-base)', padding: '2px 4px', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {supabaseUrl}/auth/v1/callback
                  </code>
                </li>
                <li>In Supabase Dashboard → <strong>Authentication</strong> → <strong>Providers</strong> → <strong>Google</strong>: Toggle ON and paste your Client ID & Secret.</li>
              </ol>
            </div>

            <a
              href={`https://supabase.com/dashboard/project/${supabaseRef}/auth/providers`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}
            >
              <span>Open Supabase Auth Providers</span>
              <ExternalLink size={14} />
            </a>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              style={{ width: '100%', height: '42px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              Sign In with Email & Password
            </button>
          </div>
        )}
      </div>

      {/* Footer info for Gate */}
      {isGate && (
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          CareerTrack Pro · Cloud-Backed with Supabase PostgreSQL · Developed with ❤️ by Anshul
        </div>
      )}
    </div>
  );
}
