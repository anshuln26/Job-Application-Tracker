import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Send,
  Flame
} from 'lucide-react';

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffTime = d - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDaysAgo = (dateStr) => {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diffTime = today - d;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

export default function PendingAlertBanner({ applications, onSelectApp, onUpdateStatus }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter jobs pending to apply
  const pendingJobs = useMemo(() => {
    return applications.filter(app => app.status === 'wishlist' || app.status === 'referral')
      .map(app => {
        const daysToDeadline = getDaysUntil(app.deadline);
        const daysToPlanned = getDaysUntil(app.plannedApplyDate);
        const daysWaitingReferral = getDaysAgo(app.referralDate);

        let urgencyLevel = 'normal'; // 'critical' | 'high' | 'normal'
        if (daysToDeadline !== null) {
          if (daysToDeadline <= 0) urgencyLevel = 'critical';
          else if (daysToDeadline <= 3) urgencyLevel = 'high';
        } else if (daysToPlanned !== null && daysToPlanned <= 1) {
          urgencyLevel = 'high';
        }

        return {
          ...app,
          daysToDeadline,
          daysToPlanned,
          daysWaitingReferral,
          urgencyLevel
        };
      })
      .sort((a, b) => {
        // Critical first, then high, then normal
        const order = { critical: 0, high: 1, normal: 2 };
        if (order[a.urgencyLevel] !== order[b.urgencyLevel]) {
          return order[a.urgencyLevel] - order[b.urgencyLevel];
        }
        if (a.daysToDeadline !== null && b.daysToDeadline !== null) {
          return a.daysToDeadline - b.daysToDeadline;
        }
        return (a.daysToPlanned || 999) - (b.daysToPlanned || 999);
      });
  }, [applications]);

  if (pendingJobs.length === 0) return null;

  const criticalCount = pendingJobs.filter(j => j.urgencyLevel === 'critical').length;
  const highCount = pendingJobs.filter(j => j.urgencyLevel === 'high').length;
  const referralCount = pendingJobs.filter(j => j.status === 'referral' || j.referralStatus === 'connection_pending').length;
  const needsTailoringCount = pendingJobs.filter(j => j.resumeCuration === 'pending').length;

  const isUrgent = criticalCount > 0 || highCount > 0;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        marginBottom: '24px',
        padding: '16px 20px',
        border: isUrgent ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.35)',
        background: isUrgent
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--bg-card))'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), var(--bg-card))',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isUrgent ? '0 4px 20px rgba(239, 68, 68, 0.12)' : '0 4px 16px rgba(245, 158, 11, 0.08)',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isUrgent ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: isUrgent ? '0 0 14px rgba(239, 68, 68, 0.35)' : '0 0 12px rgba(245, 158, 11, 0.25)',
              animation: isUrgent ? 'pulse 1.8s infinite' : 'none',
              flexShrink: 0
            }}
          >
            {isUrgent ? <Flame size={20} /> : <AlertTriangle size={20} />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                {isUrgent ? '🚨 Urgent Attention: Applications Pending Submission!' : '⚠️ Pipeline Alert: Applications Pending to Apply'}
              </h3>
              <span
                style={{
                  background: isUrgent ? 'var(--status-rejected-bg)' : 'var(--status-interview-bg)',
                  color: isUrgent ? 'var(--status-rejected)' : 'var(--status-interview)',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: isUrgent ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                {pendingJobs.length} {pendingJobs.length === 1 ? 'Job Pending' : 'Jobs Pending'}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {criticalCount > 0 && (
                <span style={{ color: 'var(--status-rejected)', fontWeight: 700 }}>
                  🚨 {criticalCount} deadline closing today or expired
                </span>
              )}
              {highCount > 0 && (
                <span style={{ color: 'var(--status-interview)', fontWeight: 700 }}>
                  ⏰ {highCount} deadline within 3 days
                </span>
              )}
              {referralCount > 0 && (
                <span style={{ color: 'var(--status-referral)', fontWeight: 700 }}>
                  🤝 {referralCount} waiting for LinkedIn connection / referral
                </span>
              )}
              {needsTailoringCount > 0 && (
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                  📝 {needsTailoringCount} pending resume tailoring for JD
                </span>
              )}
              <span style={{ color: 'var(--text-secondary)' }}>Upcoming deadline spotlight from your active Wishlist & Referrals on the board</span>
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          className="btn btn-ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
        >
          <span>{isExpanded ? 'Hide Details' : 'Review Pending Jobs'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Cards View */}
      {isExpanded && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '12px'
          }}
        >
          {pendingJobs.map(job => {
            const isCritical = job.urgencyLevel === 'critical';
            const isHigh = job.urgencyLevel === 'high';

            return (
              <div
                key={job.id}
                onClick={() => onSelectApp(job)}
                style={{
                  background: 'var(--bg-surface)',
                  border: isCritical
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : isHigh
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isCritical ? 'rgba(239, 68, 68, 0.5)' : isHigh ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                      {job.company}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {job.title}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      background: job.status === 'referral' ? 'var(--status-referral-bg)' : 'var(--status-wishlist-bg)',
                      color: job.status === 'referral' ? 'var(--status-referral)' : 'var(--status-wishlist)',
                      border: job.status === 'referral' ? '1px solid rgba(236, 72, 153, 0.25)' : '1px solid rgba(139, 92, 246, 0.25)'
                    }}
                  >
                    {job.status === 'referral' ? '🤝 Waiting for Referral' : '📌 In Wishlist'}
                  </span>
                </div>

                {/* Deadline or Planned Date Alert Badge */}
                {job.deadline ? (
                  <div
                    style={{
                      background: isCritical
                        ? 'var(--status-rejected-bg)'
                        : isHigh
                        ? 'var(--status-interview-bg)'
                        : 'var(--bg-surface-hover)',
                      color: isCritical ? 'var(--status-rejected)' : isHigh ? 'var(--status-interview)' : 'var(--text-secondary)',
                      border: isCritical
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : isHigh
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid var(--border-color)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isCritical ? <AlertTriangle size={13} /> : <Clock size={13} />}
                    {job.daysToDeadline < 0 ? (
                      <span>Deadline Expired ({job.deadline})</span>
                    ) : job.daysToDeadline === 0 ? (
                      <span>🚨 Deadline is TODAY! Apply before it closes</span>
                    ) : (
                      <span>⚠️ Deadline in {job.daysToDeadline} {job.daysToDeadline === 1 ? 'day' : 'days'} ({job.deadline})</span>
                    )}
                  </div>
                ) : job.plannedApplyDate ? (
                  <div
                    style={{
                      background: 'var(--status-wishlist-bg)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: 'var(--status-wishlist)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Calendar size={13} />
                    <span>Plan to apply: {job.plannedApplyDate}</span>
                  </div>
                ) : null}

                {/* Resume Tailoring Reminder */}
                {job.resumeCuration === 'pending' && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#F59E0B',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>⏳</span>
                    <span>Reminder: Tailor resume specifically to this JD</span>
                  </div>
                )}

                {/* Referral Details if any */}
                {(job.status === 'referral' || job.referralStatus === 'connection_pending') && (
                  <div
                    style={{
                      background: 'var(--status-referral-bg)',
                      border: '1px solid rgba(236, 72, 153, 0.25)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: 'var(--status-referral)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                      <Users size={12} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.referralContact
                          ? `Connection sent to ${job.referralContact}${job.referralDate ? ` (${job.daysWaitingReferral}d ago)` : ''}`
                          : `Connection request sent on LinkedIn${job.referralDate ? ` (${job.daysWaitingReferral}d ago)` : ''}`}
                      </span>
                    </div>

                    {job.referralLinkedin && (
                      <a
                        href={job.referralLinkedin.startsWith('http') ? job.referralLinkedin : `https://${job.referralLinkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--status-referral)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        title="Open LinkedIn Profile"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}

                {/* Quick Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '3px 8px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectApp(job);
                    }}
                  >
                    Edit Details
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ padding: '3px 10px', fontSize: '0.75rem', gap: '4px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(job.id, 'applied');
                    }}
                    title="Mark application as officially submitted"
                  >
                    <Send size={12} /> Mark Applied
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
