import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  Database,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  User,
  LogOut,
  UploadCloud,
  ExternalLink
} from 'lucide-react';
import {
  supabase,
  getSupabaseConfig,
  updateSupabaseCredentials,
  testSupabaseConnection
} from '../lib/supabaseClient';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  showToast,
  user,
  onSignOut,
  onSyncToCloud,
  applicationsCount = 0
}) {
  const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'database'
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'local_profile'
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localProfileName, setLocalProfileName] = useState('Anshul (Personal)');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Database Settings State
  const [dbUrl, setDbUrl] = useState(() => getSupabaseConfig().url);
  const [dbKey, setDbKey] = useState(() => getSupabaseConfig().anonKey);
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const result = await testSupabaseConnection(dbUrl, dbKey);
      setDbTestResult(result);
      if (result.success) {
        showToast(result.message);
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      setDbTestResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setTestingDb(false);
    }
  };

  const handleSaveDbSettings = (e) => {
    e.preventDefault();
    if (!dbUrl || !dbKey) {
      showToast('Please provide both Supabase URL and Key', 'error');
      return;
    }
    updateSupabaseCredentials(dbUrl, dbKey);
    showToast('Supabase database configuration updated! Reloading client...');
    setTimeout(() => {
      handleTestDatabase();
    }, 300);
  };

  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'local_profile') {
      const trimmedName = localProfileName.trim() || 'Personal User';
      const localUser = {
        id: 'local-' + trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email: `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@local.vault`,
        user_metadata: { name: trimmedName },
        isLocal: true
      };
      onAuthSuccess(localUser);
      showToast(`Switched to private local vault: ${trimmedName}`);
      onClose();
      return;
    }

    if (!supabase) {
      setErrorMsg('Supabase client is not initialized. Please verify Database Settings.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data?.user && !data.session) {
          showToast('Sign up successful! Please check your email to confirm your account.', 'info');
        } else {
          showToast('Account created and signed in successfully!');
          onAuthSuccess(data.user);
        }
        onClose();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast('Signed in successfully! Applications synced to your private vault.');
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed.';
      if (msg.includes('fetch failed') || msg.includes('Failed to fetch') || msg.includes('ENOTFOUND')) {
        setErrorMsg('Cannot reach Supabase host. Your project domain may be paused or unreachable. Switch to Database Settings tab to check.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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
        zIndex: 1200,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          background: 'var(--bg-surface)',
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary), #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}>
              {activeTab === 'database' ? <Database size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {user ? 'Personal User Vault' : (activeTab === 'database' ? 'Database Configuration' : 'User Authentication & Cloud Vault')}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {user ? 'Your job search data is saved strictly for your account' : 'Sign in to access your personal application database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-surface-hover)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '18px',
          border: '1px solid var(--border-color)',
          gap: '4px'
        }}>
          <button
            type="button"
            className={`btn ${activeTab === 'auth' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
            onClick={() => setActiveTab('auth')}
          >
            <User size={15} /> {user ? 'My Account' : 'User Authentication'}
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'database' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem', justifyContent: 'center' }}
            onClick={() => setActiveTab('database')}
          >
            <Database size={15} /> Database & Cloud Settings
          </button>
        </div>

        {/* Body Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
          
          {/* TAB 1: AUTH & USER VAULT */}
          {activeTab === 'auth' && (
            <div>
              {user ? (
                /* Authenticated User Profile Card */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--status-offer), #059669)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {(user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {user.email}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--status-offer)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} /> {user.isLocal ? 'Personal Local Vault' : 'Cloud PostgreSQL Vault Active'}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-offer" style={{ fontSize: '0.72rem' }}>
                        {applicationsCount} Saved Apps
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      🔒 <strong>Personal Data Isolation:</strong> All applications, salaries, interview notes, and contact details are saved specifically for your user ID (<code>{user.id.slice(0, 16)}...</code>). Other users cannot access your records.
                    </div>
                  </div>

                  {/* Sync to Cloud Action (if local or cloud) */}
                  {onSyncToCloud && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        onSyncToCloud();
                        showToast('Triggered cloud database synchronization!');
                      }}
                      style={{ justifyContent: 'center', gap: '8px', padding: '10px' }}
                    >
                      <UploadCloud size={16} /> Force Sync All Applications to Cloud Database
                    </button>
                  )}

                  {/* Sign Out */}
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    style={{ justifyContent: 'center', gap: '8px', padding: '10px' }}
                  >
                    <LogOut size={16} /> Sign Out of Personal Vault
                  </button>
                </div>
              ) : (
                /* Unauthenticated Sign In / Sign Up Form */
                <div>
                  {/* Mode switcher pills */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrorMsg(''); }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: mode === 'login' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: mode === 'login' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                        color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cloud Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setErrorMsg(''); }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: mode === 'signup' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: mode === 'signup' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                        color: mode === 'signup' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cloud Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('local_profile'); setErrorMsg(''); }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: mode === 'local_profile' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: mode === 'local_profile' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                        color: mode === 'local_profile' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Local Vault
                    </button>
                  </div>

                  {errorMsg && (
                    <div style={{
                      background: 'var(--status-rejected-bg)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--status-rejected)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '14px'
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div>{errorMsg}</div>
                        {errorMsg.includes('Supabase host') && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('database')}
                            style={{
                              marginTop: '6px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-primary)',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline'
                            }}
                          >
                            Open Database Settings to check or update project URL ↗
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {mode === 'local_profile' ? (
                      <div className="form-group">
                        <label className="form-label">Profile / Vault Name</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '38px' }}
                            placeholder="e.g. Anshul (Personal)"
                            value={localProfileName}
                            onChange={(e) => setLocalProfileName(e.target.value)}
                            required
                          />
                          <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Creates an isolated local database on this device that stores your job applications privately.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="email"
                              className="form-input"
                              style={{ paddingLeft: '38px' }}
                              placeholder="you@domain.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Password</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="password"
                              className="form-input"
                              style={{ paddingLeft: '38px' }}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              minLength={6}
                              required
                            />
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '6px', height: '42px', justifyContent: 'center' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={16} className="animate-spin" /> Authenticating...
                        </span>
                      ) : mode === 'login' ? (
                        <>
                          <LogIn size={16} /> Sign In to Personal Vault
                        </>
                      ) : mode === 'signup' ? (
                        <>
                          <UserPlus size={16} /> Create Personal Cloud Vault
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Open Isolated Local Vault
                        </>
                      )}
                    </button>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--status-offer)',
                      marginTop: '4px'
                    }}>
                      <CheckCircle2 size={14} />
                      <span>Row Level Security (RLS) Encrypted & Protected</span>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DATABASE CONFIGURATION & DIAGNOSTICS */}
          {activeTab === 'database' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Connection Diagnostics Card */}
              <div style={{
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Database size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span>PostgreSQL Cloud Connection Status</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestDatabase}
                    disabled={testingDb}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
                  >
                    <RefreshCw size={13} className={testingDb ? 'animate-spin' : ''} />
                    {testingDb ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {dbTestResult ? (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: dbTestResult.success ? 'var(--status-offer-bg)' : 'var(--status-rejected-bg)',
                    color: dbTestResult.success ? 'var(--status-offer)' : 'var(--status-rejected)',
                    border: `1px solid ${dbTestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    lineHeight: 1.4
                  }}>
                    <strong>{dbTestResult.success ? '🟢 Online: ' : '🔴 Connection Alert: '}</strong>
                    {dbTestResult.message}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Target: <code>{dbUrl || 'Not configured'}</code>. Click <strong>Test Connection</strong> to run live health check.
                  </div>
                )}
              </div>

              {/* Edit Database Credentials */}
              <form onSubmit={handleSaveDbSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Supabase Project URL</span>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      Supabase Dashboard <ExternalLink size={11} />
                    </a>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://xyzproject.supabase.co"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Found under: <strong>Project Settings ➔ Configuration ➔ API ➔ Project URL</strong>
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Supabase Anon / Publishable Key</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Found under: <strong>Project Settings ➔ Configuration ➔ API ➔ anon / public API key</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Save Database Settings
                  </button>
                  <button
                    type="button"
                    onClick={handleTestDatabase}
                    disabled={testingDb}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} className={testingDb ? 'animate-spin' : ''} />
                    {testingDb ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </form>

              {/* SQL Schema Notice */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                📄 <strong>Database Schema Migration:</strong> If you are connecting a new project, copy the SQL migration script from <code style={{ color: 'var(--accent-primary)' }}>supabase/schema.sql</code> and execute it in your Supabase SQL Editor.
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
