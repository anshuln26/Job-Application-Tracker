import React, { useState, useMemo } from 'react';
import { STAGES, WORK_TYPES, PRIORITIES, VISA_STATUSES, TIMEZONE_SHIFTS } from '../data/mockData';
import { convertSalary, formatSalaryRange, annualizeSalary } from '../utils/currency';
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
  onBulkStatusUpdate,
  displayCurrency = 'INR'
}) {
  const [sortField, setSortField] = useState('appliedDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [visaFilter, setVisaFilter] = useState('all');
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
      if (visaFilter !== 'all' && (app.visaStatus || 'none') !== visaFilter) return false;
      return true;
    }).sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'salary') {
        const aPeriod = a.salaryPeriod || ((a.title || '').toLowerCase().includes('intern') ? 'monthly' : 'yearly');
        const bPeriod = b.salaryPeriod || ((b.title || '').toLowerCase().includes('intern') ? 'monthly' : 'yearly');
        aVal = annualizeSalary(convertSalary(a.salaryMax, a.currency, displayCurrency), aPeriod, a.hoursPerWeek) || 0;
        bVal = annualizeSalary(convertSalary(b.salaryMax, b.currency, displayCurrency), bPeriod, b.hoursPerWeek) || 0;
      }

      if (sortField === 'deadline') {
        aVal = a.deadline || '9999-99-99';
        bVal = b.deadline || '9999-99-99';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [applications, statusFilter, workTypeFilter, priorityFilter, visaFilter, sortField, sortDirection, displayCurrency]);

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

          <select
            className="form-select"
            value={visaFilter}
            onChange={(e) => setVisaFilter(e.target.value)}
            style={{ width: '155px', padding: '6px 10px', fontSize: '0.825rem' }}
          >
            <option value="all">All Work Auth / Visas</option>
            {VISA_STATUSES.filter(v => v.id !== 'none').map(v => (
              <option key={v.id} value={v.id}>{v.badge || v.label}</option>
            ))}
          </select>

          {(statusFilter !== 'all' || workTypeFilter !== 'all' || priorityFilter !== 'all' || visaFilter !== 'all') && (
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => { setStatusFilter('all'); setWorkTypeFilter('all'); setPriorityFilter('all'); setVisaFilter('all'); }}
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
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr className="job-table-header" style={{ color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 10px', width: '40px' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                >
                  {selectedIds.length === filteredApps.length && filteredApps.length > 0
                    ? <CheckSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                    : <Square size={18} />}
                </button>
              </th>
              <th style={{ padding: '12px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('company')}>
                Company & Title <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('status')}>
                Status <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('priority')}>
                Priority <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('deadline')}>
                Deadline <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('appliedDate')}>
                Dates <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Work Type</th>
              <th style={{ padding: '12px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => handleSort('salary')}>
                Salary ({displayCurrency === 'INR' ? '₹ INR' : '$ USD'}) <ArrowUpDown size={13} />
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
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
                    className="job-table-row"
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 10px' }} onClick={(e) => toggleSelectRow(app.id, e)}>
                      {isSelected 
                        ? <CheckSquare size={18} style={{ color: 'var(--accent-primary)' }} />
                        : <Square size={18} style={{ color: 'var(--text-muted)' }} />}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {app.company}
                        {(app.status === 'referral' || app.referralStatus === 'connection_pending') && (
                          <span style={{
                            background: 'var(--status-referral-bg)',
                            color: 'var(--status-referral)',
                            border: '1px solid rgba(236, 72, 153, 0.25)',
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
                        {app.resumeCuration === 'pending' && (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.14)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }} title="Reminder: Tailor resume specifically to this JD before applying">
                            ⏳ Needs Resume Tailoring
                          </span>
                        )}
                        {app.resumeCuration === 'curated' && (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10B981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }} title="Resume is tailored specifically for this JD">
                            ✨ Tailored
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.title}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={app.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(app.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`badge badge-${app.status}`}
                        style={{ outline: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 10px' }}
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-${app.priority}`}>
                        {app.priority}
                      </span>
                    </td>
                    {/* Deadline Column */}
                    <td style={{ padding: '12px 14px' }}>
                      {(() => {
                        if (!app.deadline) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>;
                        const days = getDaysUntil(app.deadline);
                        if (days < 0) {
                          return (
                            <span style={{ color: 'var(--status-rejected)', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> Expired ({app.deadline})
                            </span>
                          );
                        }
                        if (days === 0) {
                          return (
                            <span style={{ color: 'var(--status-rejected)', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', animation: 'pulse 1.8s infinite' }}>
                              <AlertTriangle size={12} /> 🚨 TODAY!
                            </span>
                          );
                        }
                        if (days <= 3) {
                          return (
                            <span style={{ color: 'var(--status-interview)', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {app.workType} ({app.location || 'Remote'})
                      </div>
                      {((app.visaStatus && app.visaStatus !== 'none') || (app.timezoneShift && app.timezoneShift !== 'none')) && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {app.visaStatus && app.visaStatus !== 'none' && (() => {
                            const v = VISA_STATUSES.find(x => x.id === app.visaStatus);
                            return v?.badge ? (
                              <span key="visa" style={{ fontSize: '0.67rem', color: v.color, background: v.bg, padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                {v.badge}
                              </span>
                            ) : null;
                          })()}
                          {app.timezoneShift && app.timezoneShift !== 'none' && (() => {
                            const t = TIMEZONE_SHIFTS.find(x => x.id === app.timezoneShift);
                            return t?.badge ? (
                              <span key="shift" style={{ fontSize: '0.67rem', color: t.color, background: t.bg, padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                {t.badge}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: (!app.salaryUndisclosed && app.salaryMax) ? 'var(--status-offer)' : 'var(--text-muted)' }}>
                      {(() => {
                        if (app.salaryUndisclosed || (!app.salaryMax && !app.salaryMin)) {
                          return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Undisclosed</span>;
                        }
                        const period = app.salaryPeriod || ((app.title || '').toLowerCase().includes('intern') ? 'monthly' : 'yearly');
                        const sal = formatSalaryRange(app.salaryMin, app.salaryMax, app.currency, displayCurrency, period, app.hoursPerWeek || 40);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {period === 'monthly' && <span style={{ fontSize: '0.72rem' }}>🎓</span>}
                              <span>{sal.formatted}</span>
                            </span>
                            {app.salaryBase > 0 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                Base: {formatSalaryRange(app.salaryBase, app.salaryBase, app.currency, displayCurrency, period).formatted}
                              </span>
                            )}
                            {sal.isConverted && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                Orig: {sal.original}
                              </span>
                            )}
                          </div>
                        );
                      })()}
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
