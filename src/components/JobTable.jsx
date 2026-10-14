import React, { useState, useMemo } from 'react';
import { STAGES, WORK_TYPES, PRIORITIES } from '../data/mockData';
import {
  ArrowUpDown,
  Edit2,
  Trash2,
  ExternalLink,
  Filter,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  AlertTriangle,
  Users
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

export default function JobTable({
  applications,
  onSelectApp,
  onUpdateStatus,
  onDeleteApp,
  onBulkDelete,
  onBulkStatusUpdate
}) {
  const [sortField, setSortField] = useState('appliedDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter & Sort Logic
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (statusFilter === 'pending_apply') {
        if (app.status !== 'wishlist' && app.status !== 'referral') return false;
      } else if (statusFilter === 'has_deadline') {
        if (!app.deadline) return false;
      } else if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }
      if (workTypeFilter !== 'all' && app.workType !== workTypeFilter) return false;
      if (priorityFilter !== 'all' && app.priority !== priorityFilter) return false;
      return true;
    }).sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'salary') {
        aVal = a.salaryMax || 0;
        bVal = b.salaryMax || 0;
      }

      if (sortField === 'deadline') {
        aVal = a.deadline || '9999-99-99';
        bVal = b.deadline || '9999-99-99';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [applications, statusFilter, workTypeFilter, priorityFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredApps.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApps.map(a => a.id));
    }
  };

  const toggleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      
      {/* Filters & Bulk Action Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Filter size={16} /> Filters:
          </div>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '165px', padding: '6px 10px', fontSize: '0.825rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="pending_apply">⚠️ Pending to Apply</option>
            <option value="has_deadline">⏰ With Deadlines</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          <select
            className="form-select"
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value)}
            style={{ width: '130px', padding: '6px 10px', fontSize: '0.825rem' }}
          >
            <option value="all">All Work Types</option>
            {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '130px', padding: '6px 10px', fontSize: '0.825rem' }}
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>

          {(statusFilter !== 'all' || workTypeFilter !== 'all' || priorityFilter !== 'all') && (
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => { setStatusFilter('all'); setWorkTypeFilter('all'); setPriorityFilter('all'); }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface-hover)', padding: '4px 10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedIds.length} Selected</span>
            
            <select
              className="form-select"
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusUpdate(selectedIds, e.target.value);
                  setSelectedIds([]);
                  e.target.value = '';
                }
              }}
              style={{ width: '150px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="">Set Status...</option>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <button
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 8px', width: '40px' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {selectedIds.length === filteredApps.length && filteredApps.length > 0
                    ? <CheckSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                    : <Square size={18} />}
                </button>
              </th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('company')}>
                Company & Title <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                Status <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('priority')}>
                Priority <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('deadline')}>
                Deadline <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('appliedDate')}>
                Dates <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px' }}>Work Type</th>
              <th style={{ padding: '12px', cursor: 'pointer' }} onClick={() => handleSort('salary')}>
                Salary <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No job applications match your current filters.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => {
                const isSelected = selectedIds.includes(app.id);

                return (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApp(app)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '12px 8px' }} onClick={(e) => toggleSelectRow(app.id, e)}>
                      {isSelected 
                        ? <CheckSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                        : <Square size={18} style={{ color: 'var(--text-muted)' }} />}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {app.company}
                        {(app.status === 'referral' || app.referralStatus === 'connection_pending') && (
                          <span style={{
                            background: 'rgba(236, 72, 153, 0.14)',
                            color: '#EC4899',
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Users size={10} /> Referral Pending
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.title}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={app.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(app.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`badge badge-${app.status}`}
                        style={{ border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${app.priority}`}>
                        {app.priority}
                      </span>
                    </td>
                    {/* Deadline Column */}
                    <td style={{ padding: '12px' }}>
                      {(() => {
                        if (!app.deadline) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>;
                        const days = getDaysUntil(app.deadline);
                        if (days < 0) {
                          return (
                            <span style={{ color: '#EF4444', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> Expired ({app.deadline})
                            </span>
                          );
                        }
                        if (days === 0) {
                          return (
                            <span style={{ color: '#EF4444', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', animation: 'pulse 1.8s infinite' }}>
                              <AlertTriangle size={12} /> 🚨 TODAY!
                            </span>
                          );
                        }
                        if (days <= 3) {
                          return (
                            <span style={{ color: '#F59E0B', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> ⚠️ {days}d left ({app.deadline})
                            </span>
                          );
                        }
                        return (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {app.deadline} ({days}d)
                          </span>
                        );
                      })()}
                    </td>
                    {/* Dates Column */}
                    <td style={{ padding: '12px', fontSize: '0.825rem' }}>
                      {app.appliedDate ? (
                        <span style={{ color: 'var(--text-primary)' }}>Applied {app.appliedDate}</span>
                      ) : app.plannedApplyDate ? (
                        <span style={{ color: 'var(--status-wishlist)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={12} /> Plan: {app.plannedApplyDate}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Draft</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {app.workType} ({app.location || 'Remote'})
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: app.salaryMax ? 'var(--status-offer)' : 'var(--text-muted)' }}>
                      {app.salaryMax ? `$${(app.salaryMin/1000).toFixed(0)}k - $${(app.salaryMax/1000).toFixed(0)}k` : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {app.appliedDate || 'Not applied'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-icon"
                            style={{ padding: '4px' }}
                            title="Open Job Link"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ padding: '4px' }}
                          onClick={() => onSelectApp(app)}
                          title="Edit Application"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ padding: '4px', color: 'var(--status-rejected)' }}
                          onClick={() => onDeleteApp(app.id)}
                          title="Delete Application"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
