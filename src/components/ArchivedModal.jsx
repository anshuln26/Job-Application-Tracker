import React, { useState, useMemo } from 'react';
import {
  X,
  Archive,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { formatSalaryRange } from '../utils/currency';

export default function ArchivedModal({
  isOpen,
  onClose,
  archivedApps = [],
  onRestore,
  onRestoreAll,
  displayCurrency = 'INR'
}) {
  const [search, setSearch] = useState('');

  const filteredArchived = useMemo(() => {
    if (!search.trim()) return archivedApps;
    const q = search.toLowerCase();
    return archivedApps.filter(
      app =>
        app.company.toLowerCase().includes(q) ||
        app.title.toLowerCase().includes(q) ||
        (app.location && app.location.toLowerCase().includes(q))
    );
  }, [archivedApps, search]);

  if (!isOpen) return null;

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
          maxWidth: '780px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border-color)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Archive size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Archived Applications
                </h2>
                <span
                  className="badge"
                  style={{
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {archivedApps.length} {archivedApps.length === 1 ? 'Job' : 'Jobs'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Deleted jobs are never lost. Restore any application back to your active board at any time.
              </p>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--bg-surface-hover)'
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '400px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search archived jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {archivedApps.length > 1 && (
            <button
              className="btn btn-secondary"
              onClick={onRestoreAll}
              style={{ height: '38px', gap: '6px', fontSize: '0.82rem' }}
              title="Restore all archived applications back to your active board"
            >
              <RotateCcw size={14} /> Restore All to Active Board
            </button>
          )}
        </div>

        {/* Applications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {filteredArchived.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'var(--text-muted)'
                }}
              >
                <Archive size={26} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                {search ? 'No matching archived applications' : 'Archive is empty'}
              </h3>
              <p style={{ fontSize: '0.825rem', maxWidth: '380px', margin: '0 auto' }}>
                {search
                  ? 'Try searching with a different company or job title.'
                  : 'When you remove an application from your board or table, it is safely stored here instead of being permanently deleted.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredArchived.map((app) => {
                const dateArchived = app.archivedAt
                  ? new Date(app.archivedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : null;

                return (
                  <div
                    key={app.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.background = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    {/* Left: Job Info */}
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--text-primary)' }}>
                          {app.company}
                        </span>
                        <span className={`badge badge-${app.status || 'applied'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {app.status}
                        </span>
                        {app.resumeCuration === 'curated' && (
                          <span style={{ fontSize: '0.67rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                            ✨ Tailored Resume
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {app.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> {app.location || 'Remote'} ({app.workType})
                        </span>

                        <span>•</span>

                        <span>
                          {app.salaryUndisclosed || (!app.salaryMax && !app.salaryMin) ? (
                            <em style={{ color: 'var(--text-muted)' }}>Salary Undisclosed</em>
                          ) : (
                            formatSalaryRange(
                              app.salaryMin,
                              app.salaryMax,
                              app.currency,
                              displayCurrency,
                              app.salaryPeriod || 'yearly'
                            ).formatted
                          )}
                        </span>

                        {dateArchived && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> Archived on {dateArchived}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Restore Action Button */}
                    <div>
                      <button
                        className="btn btn-primary"
                        onClick={() => onRestore(app.id)}
                        style={{
                          height: '38px',
                          padding: '0 16px',
                          fontSize: '0.82rem',
                          gap: '6px',
                          boxShadow: '0 2px 8px var(--accent-glow)'
                        }}
                      >
                        <RotateCcw size={14} /> Restore to Board
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} style={{ color: 'var(--status-offer)' }} />
            <span>All archived data is automatically synced to your personal user account.</span>
          </div>

          <button className="btn btn-secondary" onClick={onClose} style={{ height: '34px', fontSize: '0.8rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
