import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Plus, AlertTriangle, Users } from 'lucide-react';

export default function CalendarView({ applications, onSelectApp, onToggleInterviewComplete, onAddInterview }) {
  const [selectedAppId, setSelectedAppId] = useState('');
  const [interviewTitle, setInterviewTitle] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('Technical Round');
  const [showAddForm, setShowAddForm] = useState(false);

  // Extract application deadlines
  const deadlineEvents = applications
    .filter(app => app.deadline)
    .map(app => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(app.deadline);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      return {
        id: 'dl-' + app.id,
        appId: app.id,
        company: app.company,
        jobTitle: app.title,
        date: app.deadline,
        diffDays,
        status: app.status,
        type: 'Application Deadline'
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Extract planned apply dates for unapplied jobs
  const plannedEvents = applications
    .filter(app => app.plannedApplyDate && (app.status === 'wishlist' || app.status === 'referral'))
    .map(app => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(app.plannedApplyDate);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      return {
        id: 'pl-' + app.id,
        appId: app.id,
        company: app.company,
        jobTitle: app.title,
        date: app.plannedApplyDate,
        diffDays,
        status: app.status,
        type: 'Planned Apply Date'
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Flatten all interviews from applications
  const allInterviews = applications.flatMap(app => 
    (app.interviews || []).map(interview => ({
      ...interview,
      company: app.company,
      jobTitle: app.title,
      appId: app.id,
      status: app.status
    }))
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingInterviews = allInterviews.filter(i => !i.completed);
  const pastInterviews = allInterviews.filter(i => i.completed);

  const handleSubmitNewInterview = (e) => {
    e.preventDefault();
    if (!selectedAppId || !interviewTitle || !interviewDate) return;

    onAddInterview(selectedAppId, {
      id: 'int-' + Date.now(),
      title: interviewTitle,
      date: interviewDate,
      type: interviewType,
      completed: false
    });

    setInterviewTitle('');
    setInterviewDate('');
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Add Quick Interview */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--status-interview)' }} /> Interview & Assessment Schedule
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Never miss a recruiter screen, coding round, or system design interview.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} /> {showAddForm ? 'Cancel' : 'Schedule Interview'}
        </button>
      </div>

      {/* Quick Add Interview Form */}
      {showAddForm && (
        <div className="glass-panel animate-fade-in" style={{ padding: '20px', borderColor: 'var(--accent-primary)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>Add Upcoming Interview Event</h3>
          <form onSubmit={handleSubmitNewInterview} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            <div className="form-group">
              <label className="form-label">Select Company</label>
              <select
                className="form-select"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                required
              >
                <option value="">Select Job Application...</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>{a.company} - {a.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Round Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. System Design Interview"
                value={interviewTitle}
                onChange={(e) => setInterviewTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Round Type</label>
              <select
                className="form-select"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                <option value="Recruiter Screen">Recruiter Screen</option>
                <option value="Technical Assessment">Technical Assessment</option>
                <option value="Coding Pair">Coding Pair</option>
                <option value="System Architecture">System Architecture</option>
                <option value="Behavioral / Hiring Mgr">Behavioral / Hiring Mgr</option>
                <option value="Final Offer Review">Final Offer Review</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="submit" className="btn btn-primary">Save Interview Event</button>
            </div>

          </form>
        </div>
      )}

      {/* Grid: Deadlines vs Upcoming Interviews vs Completed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
        
        {/* Deadlines & Application Targets */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--status-rejected)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Deadlines & Planned Targets ({deadlineEvents.length + plannedEvents.length})
          </h3>

          {deadlineEvents.length === 0 && plannedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No upcoming deadlines or planned apply dates.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Deadlines */}
              {deadlineEvents.map(item => {
                const isOverdue = item.diffDays < 0;
                const isToday = item.diffDays === 0;
                const isUrgent = item.diffDays > 0 && item.diffDays <= 3;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      const app = applications.find(a => a.id === item.appId);
                      if (app && onSelectApp) onSelectApp(app);
                    }}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isToday || isOverdue ? '1px solid rgba(239, 68, 68, 0.5)' : isUrgent ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {item.company} — {item.jobTitle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} /> Deadline: {item.date}
                        <span className="badge" style={{
                          background: isToday || isOverdue ? 'rgba(239, 68, 68, 0.2)' : isUrgent ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-glass)',
                          color: isToday || isOverdue ? '#EF4444' : isUrgent ? '#F59E0B' : 'var(--text-secondary)'
                        }}>
                          {isOverdue ? `Closed (${Math.abs(item.diffDays)}d ago)` : isToday ? '🚨 DUE TODAY' : `${item.diffDays}d left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Planned Apply Dates */}
              {plannedEvents.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    const app = applications.find(a => a.id === item.appId);
                    if (app && onSelectApp) onSelectApp(app);
                  }}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {item.company} — {item.jobTitle}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ color: 'var(--status-wishlist)' }} />
                      <span>Target Apply: {item.date}</span>
                      <span className="badge" style={{ background: 'var(--status-wishlist-bg)', color: 'var(--status-wishlist)' }}>
                        {item.status === 'referral' ? 'Waiting on Referral' : 'Wishlist Target'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--status-interview)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Upcoming Interviews ({upcomingInterviews.length})
          </h3>

          {upcomingInterviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No upcoming interviews scheduled.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingInterviews.map((item) => {
                const eventDate = new Date(item.date);
                const dateFormatted = isNaN(eventDate) ? item.date : eventDate.toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <button
                        onClick={() => onToggleInterviewComplete(item.appId, item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: '2px' }}
                        title="Mark as completed"
                      >
                        <Circle size={20} />
                      </button>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{item.title}</div>
                        <div
                          style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => {
                            const app = applications.find(a => a.id === item.appId);
                            if (app && onSelectApp) onSelectApp(app);
                          }}
                          title="View job details"
                        >
                          {item.company} — {item.jobTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} /> {dateFormatted}
                          <span className="badge" style={{ background: 'var(--status-interview-bg)', color: 'var(--status-interview)', marginLeft: '4px' }}>
                            {item.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--status-offer)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> Completed Rounds ({pastInterviews.length})
          </h3>

          {pastInterviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No completed interview history yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pastInterviews.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => onToggleInterviewComplete(item.appId, item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-offer)' }}
                      title="Mark as uncompleted"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', textDecoration: 'line-through' }}>{item.title}</div>
                      <div
                        style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        onClick={() => {
                          const app = applications.find(a => a.id === item.appId);
                          if (app && onSelectApp) onSelectApp(app);
                        }}
                        title="View job details"
                      >
                        {item.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
