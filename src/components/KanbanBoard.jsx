import React, { useState } from 'react';
import { STAGES } from '../data/mockData';
import {
  Plus,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Bookmark,
  Users,
  Send,
  Trophy,
  XCircle,
  DollarSign,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

const ICON_MAP = {
  Bookmark,
  Users,
  Send,
  Calendar,
  Trophy,
  XCircle
};

const getDeadlineInfo = (deadlineStr) => {
  if (!deadlineStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadlineStr);
  d.setHours(0, 0, 0, 0);
  const diffTime = d - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { diffDays, dateStr: deadlineStr };
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

export default function KanbanBoard({ applications, onSelectApp, onUpdateStatus, onDeleteApp, onOpenAddModalWithStage }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      onUpdateStatus(id, targetStageId);
      if (targetStageId === 'offer') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, minmax(290px, 1fr))',
      gap: '16px',
      overflowX: 'auto',
      paddingBottom: '16px',
      alignItems: 'start'
    }}>
      {STAGES.map((stage) => {
        const StageIcon = ICON_MAP[stage.icon] || Bookmark;
        const stageApps = applications.filter(a => a.status === stage.id);
        const isHovered = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
            style={{
              background: isHovered ? 'var(--bg-surface-hover)' : 'var(--bg-card)',
              border: isHovered ? `2px dashed ${stage.color}` : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              minHeight: '600px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Column Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: stage.bg,
                  color: stage.color,
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex'
                }}>
                  <StageIcon size={16} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{stage.label}</h3>
                <span className="badge" style={{ background: stage.bg, color: stage.color, borderRadius: '12px' }}>
                  {stageApps.length}
                </span>
              </div>

              <button
                className="btn btn-ghost btn-icon"
                onClick={() => onOpenAddModalWithStage(stage.id)}
                title={`Add job to ${stage.label}`}
                style={{ padding: '4px' }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Cards Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {stageApps.length === 0 ? (
                <div style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '10px'
                }}>
                  Drag jobs here or click + to add
                </div>
              ) : (
                stageApps.map((app) => {
                  const companyInitials = app.company.substring(0, 2).toUpperCase();

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="glass-panel glass-panel-interactive"
                      onClick={() => onSelectApp(app)}
                      style={{
                        padding: '14px',
                        cursor: 'grab',
                        position: 'relative',
                        borderColor: app.status === 'offer' ? 'rgba(16, 185, 129, 0.4)' : ''
                      }}
                    >
                      {/* Company Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--bg-surface-hover), var(--bg-surface))',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)'
                          }}>
                            {companyInitials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{app.company}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} /> {app.location || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Priority Badge */}
                        <span className={`badge badge-${app.priority}`}>
                          {app.priority}
                        </span>
                      </div>

                      {/* Job Title */}
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                        lineHeight: 1.3
                      }}>
                        {app.title}
                      </h4>

                      {/* Salary & Work Type */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', fontSize: '0.75rem' }}>
                        {app.salaryMax > 0 && (
                          <span style={{ color: 'var(--status-offer)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <DollarSign size={12} />
                            {(app.salaryMin / 1000).toFixed(0)}k - {(app.salaryMax / 1000).toFixed(0)}k
                          </span>
                        )}
                        <span style={{
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-color)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)'
                        }}>
                          {app.workType}
                        </span>
                      </div>

                      {/* Deadline Warning Alert Badge */}
                      {(() => {
                        const deadlineInfo = getDeadlineInfo(app.deadline);
                        if (!deadlineInfo) return null;
                        const { diffDays, dateStr } = deadlineInfo;
                        const isApplied = app.status === 'applied' || app.status === 'interviewing' || app.status === 'offer' || app.status === 'rejected';

                        if (diffDays < 0) {
                          return (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#EF4444',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '8px'
                            }}>
                              <AlertTriangle size={12} />
                              <span>{isApplied ? `Closed ${dateStr}` : `Deadline Passed (${Math.abs(diffDays)}d ago)`}</span>
                            </div>
                          );
                        }
                        if (diffDays === 0) {
                          return (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.18)',
                              border: '1px solid #EF4444',
                              color: '#EF4444',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '8px',
                              animation: 'pulse 1.8s infinite'
                            }}>
                              <AlertTriangle size={13} />
                              <span>🚨 DEADLINE TODAY! Apply Now</span>
                            </div>
                          );
                        }
                        if (diffDays <= 3) {
                          return (
                            <div style={{
                              background: 'rgba(245, 158, 11, 0.14)',
                              border: '1px solid #F59E0B',
                              color: '#F59E0B',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginBottom: '8px'
                            }}>
                              <Clock size={12} />
                              <span>⚠️ {diffDays} {diffDays === 1 ? 'day' : 'days'} left to apply (due {dateStr})</span>
                            </div>
                          );
                        }
                        return (
                          <div style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '8px'
                          }}>
                            <Clock size={12} />
                            <span>Deadline: {dateStr} ({diffDays}d left)</span>
                          </div>
                        );
                      })()}

                      {/* Planned Apply Date Badge */}
                      {app.plannedApplyDate && (app.status === 'wishlist' || app.status === 'referral') && (
                        <div style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: '#A78BFA',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginBottom: '8px'
                        }}>
                          <Calendar size={12} />
                          <span>Plan to apply: {app.plannedApplyDate}</span>
                        </div>
                      )}

                      {/* Referral / LinkedIn Tracking Chip */}
                      {(app.status === 'referral' || (app.referralStatus && app.referralStatus !== 'none')) && (
                        <div style={{
                          background: 'rgba(236, 72, 153, 0.1)',
                          border: '1px solid rgba(236, 72, 153, 0.3)',
                          color: '#F472B6',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                            <Users size={12} style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {app.referralStatus === 'connection_pending'
                                ? `LinkedIn Request Pending${app.referralDate ? ` (${getDaysAgo(app.referralDate)}d)` : ''}`
                                : app.referralStatus === 'connected_waiting'
                                ? 'Connected — Awaiting Referral'
                                : app.referralStatus === 'referral_received'
                                ? 'Referral Received 🎉'
                                : 'Referral Tracked'}
                            </span>
                          </div>
                          {app.referralLinkedin && (
                            <a
                              href={app.referralLinkedin.startsWith('http') ? app.referralLinkedin : `https://${app.referralLinkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: '#F472B6', display: 'flex', alignItems: 'center' }}
                              title="Open LinkedIn Profile"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {app.tags && app.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {app.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} style={{
                              fontSize: '0.7rem',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-color)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)'
                            }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer & Quick Move Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        <span>
                          {app.appliedDate
                            ? `Applied ${app.appliedDate}`
                            : app.plannedApplyDate
                            ? `Plan: ${app.plannedApplyDate}`
                            : app.status === 'referral'
                            ? 'Awaiting Referral'
                            : 'Wishlist Draft'}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ padding: '2px' }}
                            onClick={() => onSelectApp(app)}
                            title="Edit / View Details"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ padding: '2px', color: 'var(--status-rejected)' }}
                            onClick={() => onDeleteApp(app.id)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
