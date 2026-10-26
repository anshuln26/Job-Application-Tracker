import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Search,
  Scale,
  Archive,
  LogIn,
  LogOut,
  X
} from 'lucide-react';

const STAGE_LABELS = {
  wishlist: { label: 'Wishlist', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  referral: { label: 'Waiting for Referral', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' },
  applied: { label: 'Applied', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  interviewing: { label: 'Interviewing', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  offer: { label: 'Offer Received', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  rejected: { label: 'Rejected', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

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
  user,
  onOpenAuthModal,
  onSignOut,
  archivedCount = 0,
  onOpenArchiveModal,
  displayCurrency = 'INR',
  setDisplayCurrency,
  allApplications = [],
  onSelectApp
}) {
  const fileInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live search matches across both active and archived applications
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allApplications.filter(app => {
      const company = (app.company || '').toLowerCase();
      const title = (app.title || '').toLowerCase();
      const location = (app.location || '').toLowerCase();
      const status = (app.status || '').toLowerCase();
      const tags = (app.tags || []).join(' ').toLowerCase();
      const notes = (app.notes || '').toLowerCase();
      return company.includes(q) || title.includes(q) || location.includes(q) || status.includes(q) || tags.includes(q) || notes.includes(q);
    }).slice(0, 8);
  }, [allApplications, searchQuery]);

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
        
        {/* Brand & Logo (without redundant badge) */}
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
              CareerTrack Pro
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Smart Job Search & Offer Tracker</p>
          </div>
        </div>

        {/* Live Search Bar with Dropdown */}
        <div ref={searchContainerRef} style={{ flex: '1', maxWidth: '380px', minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search company, title, tag, or notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsSearchFocused(false);
            }}
            style={{ paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '12px', height: '40px', fontSize: '0.85rem' }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {/* Interactive Search Dropdown Menu */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                minWidth: '340px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
                zIndex: 9999,
                overflow: 'hidden',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }}>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Matches ({searchResults.length})
                </span>
                <span>ESC to close</span>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {searchResults.length > 0 ? (
                  searchResults.map((app) => {
                    const stageInfo = app.archived
                      ? { label: 'Archived', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.18)' }
                      : (STAGE_LABELS[app.status] || { label: app.status, color: 'var(--text-secondary)', bg: 'var(--bg-surface-hover)' });

                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          onSelectApp?.(app);
                          setIsSearchFocused(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: stageInfo.bg,
                              color: stageInfo.color,
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {(app.company || 'J').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.company}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {app.title} {app.location ? `· ${app.location}` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              color: stageInfo.color,
                              background: stageInfo.bg,
                              border: `1px solid ${stageInfo.color}33`,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {stageInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      No applications match "{searchQuery}"
                    </p>
                    <span style={{ fontSize: '0.78rem' }}>Check spelling, or try searching by role or location</span>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div style={{ padding: '8px 14px', background: 'var(--bg-surface-hover)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Click an application to view full details
                </div>
              )}
            </div>
          )}
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

          {/* Archived Applications Button */}
          {archivedCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={onOpenArchiveModal}
              title={`View ${archivedCount} archived applications`}
              style={{ height: '40px', gap: '6px', fontSize: '0.825rem' }}
            >
              <Archive size={15} />
              <span>Archive</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 700
                }}
              >
                {archivedCount}
              </span>
            </button>
          )}

          {/* User Profile & Auth Status */}
          {user && !user.isGuest ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <button
                className="btn btn-secondary"
                onClick={onOpenAuthModal}
                title={`Signed in as ${user.email}. Click to view account profile.`}
                style={{ height: '40px', gap: '8px', fontSize: '0.825rem', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-offer)' }} />
                )}
                <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {user.name || user.email.split('@')[0]}
                </span>
              </button>
              <button
                className="btn btn-secondary btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSignOut();
                }}
                title="Sign out of account"
                style={{ height: '40px', width: '34px', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', color: 'var(--text-muted)' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="badge"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  fontWeight: 600
                }}
                title="Browsing in Guest Mode (Data is not saved)"
              >
                Guest
              </span>
              <button
                className="btn btn-primary"
                onClick={onOpenAuthModal}
                title="Sign in or create an account to save data"
                style={{ height: '40px', gap: '6px', fontSize: '0.825rem', fontWeight: 600 }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            </div>
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

        </div>

      </div>
    </header>
  );
}
