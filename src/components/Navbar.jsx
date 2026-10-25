import React, { useRef } from 'react';
import {
  Briefcase,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Calendar as CalendarIcon,
  Plus,
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  Search,
  Scale,
  Database,
  LogIn,
  LogOut
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  theme,
  setTheme,
  onExportData,
  onImportData,
  onResetData,
  totalApps,
  user,
  isConfigured,
  onOpenAuthModal,
  onSignOut,
  displayCurrency = 'INR',
  setDisplayCurrency
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', marginBottom: '24px', padding: '16px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary), #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px var(--accent-glow)'
          }}>
            <Briefcase size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              CareerTrack Pro
              <span className="badge badge-applied" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{totalApps} Apps</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Smart Job Search & Offer Tracker</p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: '1', maxWidth: '360px', minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search company, title, tag, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
          />
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button
            className={`btn ${activeView === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('kanban')}
          >
            <LayoutGrid size={15} /> Board
          </button>
          <button
            className={`btn ${activeView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('table')}
          >
            <TableIcon size={15} /> Table
          </button>
          <button
            className={`btn ${activeView === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('analytics')}
          >
            <BarChart3 size={15} /> Analytics
          </button>
          <button
            className={`btn ${activeView === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('calendar')}
          >
            <CalendarIcon size={15} /> Schedule
          </button>
          <button
            className={`btn ${activeView === 'comparer' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('comparer')}
          >
            <Scale size={15} /> Offers
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Currency Toggle Switcher (INR / USD) */}
          {setDisplayCurrency && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
              role="group"
              aria-label="Currency selection"
            >
              <button
                type="button"
                className="btn"
                onClick={() => setDisplayCurrency('INR')}
                title="Display all salaries in Indian Rupee (₹ / LPA)"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: displayCurrency === 'INR' ? 700 : 500,
                  background: displayCurrency === 'INR' ? 'var(--accent-primary)' : 'transparent',
                  color: displayCurrency === 'INR' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '7px',
                  border: 'none',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: displayCurrency === 'INR' ? '0 2px 8px var(--accent-glow)' : 'none'
                }}
              >
                <span>🇮🇳</span>
                <span>₹ INR</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setDisplayCurrency('USD')}
                title="Display all salaries in US Dollar ($)"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: displayCurrency === 'USD' ? 700 : 500,
                  background: displayCurrency === 'USD' ? 'var(--accent-primary)' : 'transparent',
                  color: displayCurrency === 'USD' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '7px',
                  border: 'none',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: displayCurrency === 'USD' ? '0 2px 8px var(--accent-glow)' : 'none'
                }}
              >
                <span>🇺🇸</span>
                <span>$ USD</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setDisplayCurrency('native')}
                title="Display each job in its original stated currency (INR, USD, GBP, EUR, AED, etc.)"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: displayCurrency === 'native' ? 700 : 500,
                  background: displayCurrency === 'native' ? 'var(--accent-primary)' : 'transparent',
                  color: displayCurrency === 'native' ? '#fff' : 'var(--text-secondary)',
                  borderRadius: '7px',
                  border: 'none',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: displayCurrency === 'native' ? '0 2px 8px var(--accent-glow)' : 'none'
                }}
              >
                <span>🌐</span>
                <span>Native</span>
              </button>
            </div>
          )}

          <button className="btn btn-primary" onClick={onOpenAddModal} style={{ height: '40px' }}>
            <Plus size={18} /> New Job
          </button>

          {/* Supabase Cloud Connection & Auth Status */}
          {user ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <button
                className="btn btn-secondary"
                onClick={onOpenAuthModal}
                title={`Logged in as ${user.email}. Click to view account & database settings.`}
                style={{ height: '40px', gap: '8px', fontSize: '0.825rem', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-offer)' }} />
                <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email ? user.email.split('@')[0] : 'User'}
                </span>
              </button>
              <button
                className="btn btn-secondary btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSignOut();
                }}
                title="Sign out of personal vault"
                style={{ height: '40px', width: '34px', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', color: 'var(--text-muted)' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={onOpenAuthModal}
              title={isConfigured ? 'Sign in to Supabase Cloud' : 'Configure Supabase Database'}
              style={{ height: '40px', gap: '6px', fontSize: '0.825rem' }}
            >
              {isConfigured ? <LogIn size={15} /> : <Database size={15} />}
              <span>{isConfigured ? 'Cloud Sync' : 'Cloud Setup'}</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="btn btn-secondary btn-icon" onClick={onExportData} title="Export JSON Data">
            <Download size={18} />
          </button>

          <button
            className="btn btn-secondary btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON Data"
          >
            <Upload size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button className="btn btn-secondary btn-icon" onClick={onResetData} title="Reset Sample Data">
            <RotateCcw size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
