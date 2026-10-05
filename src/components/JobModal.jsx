import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, User, FileText, Briefcase } from 'lucide-react';
import { STAGES, WORK_TYPES, PRIORITIES } from '../data/mockData';

const createInitialFormData = (application, initialStage) => {
  if (application) {
    return {
      ...application,
      tagInput: '',
      tags: application.tags || [],
      timeline: application.timeline || [],
      interviews: application.interviews || []
    };
  }
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'job-' + Date.now(),
    company: '',
    title: '',
    location: '',
    workType: 'Remote',
    status: initialStage || 'applied',
    priority: 'medium',
    salaryMin: 120000,
    salaryMax: 150000,
    currency: '$',
    appliedDate: today,
    jobUrl: '',
    contactName: '',
    contactEmail: '',
    resumeVersion: 'Software_Engineer_2026.pdf',
    tags: ['React', 'Fullstack'],
    tagInput: '',
    notes: '',
    timeline: [{ id: 't-1', stage: 'Applied', date: today, notes: 'Submitted application portal.' }],
    interviews: []
  };
};

export default function JobModal({ isOpen, onClose, onSave, application, initialStage = 'applied' }) {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState(() => createInitialFormData(application, initialStage));

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const newTag = formData.tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag],
          tagInput: ''
        }));
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleAddTimelineStage = () => {
    const newStage = {
      id: 't-' + Date.now(),
      stage: 'Recruiter Screening',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, newStage]
    }));
  };

  const handleRemoveTimelineStage = (id) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.filter(t => t.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.title) return;
    onSave(formData);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }} onClick={onClose}>
      
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {application ? 'Edit Job Application' : 'Add New Job Application'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {formData.company ? `${formData.company} — ${formData.title}` : 'Fill in the details below'}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 24px',
          background: 'var(--bg-glass)',
          gap: '16px'
        }}>
          {[
            { id: 'info', label: 'Basic Info', icon: Briefcase },
            { id: 'contact', label: 'Contact & Resume', icon: User },
            { id: 'timeline', label: 'Milestones', icon: Calendar },
            { id: 'notes', label: 'Notes & Tags', icon: FileText }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  padding: '12px 4px',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <TabIcon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. OpenAI, Stripe"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Application Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Work Arrangement</label>
                <select
                  className="form-select"
                  value={formData.workType}
                  onChange={(e) => handleChange('workType', e.target.value)}
                >
                  {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Min Salary ($/yr)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.salaryMin}
                  onChange={(e) => handleChange('salaryMin', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Salary ($/yr)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.salaryMax}
                  onChange={(e) => handleChange('salaryMax', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Applied Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.appliedDate}
                  onChange={(e) => handleChange('appliedDate', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Job Listing URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://company.com/careers/job-id"
                  value={formData.jobUrl}
                  onChange={(e) => handleChange('jobUrl', e.target.value)}
                />
              </div>

            </div>
          )}

          {/* TAB 2: CONTACT & RESUME */}
          {activeTab === 'contact' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label">Recruiter / Contact Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sarah Lin"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="recruiter@company.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Resume Version Used</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Frontend_Lead_v4.pdf"
                  value={formData.resumeVersion}
                  onChange={(e) => handleChange('resumeVersion', e.target.value)}
                />
              </div>

            </div>
          )}

          {/* TAB 3: TIMELINE MILESTONES */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Stage Progression History</h4>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={handleAddTimelineStage}>
                  <Plus size={14} /> Add Milestone
                </button>
              </div>

              {formData.timeline.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr 32px', gap: '8px', alignItems: 'center', background: 'var(--bg-glass)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={item.stage}
                    placeholder="Milestone stage"
                    onChange={(e) => {
                      const newTimeline = [...formData.timeline];
                      newTimeline[idx].stage = e.target.value;
                      handleChange('timeline', newTimeline);
                    }}
                  />
                  <input
                    type="date"
                    className="form-input"
                    value={item.date}
                    onChange={(e) => {
                      const newTimeline = [...formData.timeline];
                      newTimeline[idx].date = e.target.value;
                      handleChange('timeline', newTimeline);
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={item.notes}
                    placeholder="Brief notes..."
                    onChange={(e) => {
                      const newTimeline = [...formData.timeline];
                      newTimeline[idx].notes = e.target.value;
                      handleChange('timeline', newTimeline);
                    }}
                  />
                  <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--status-rejected)' }} onClick={() => handleRemoveTimelineStage(item.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: NOTES & TAGS */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label">Custom Tags</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type tag (e.g. React) and press Enter"
                    value={formData.tagInput}
                    onChange={(e) => handleChange('tagInput', e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAddTag}>
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {formData.tags.map(t => (
                    <span key={t} className="badge" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                      #{t}
                      <X size={12} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => handleRemoveTag(t)} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prep & Interview Notes</label>
                <textarea
                  className="form-textarea"
                  rows="6"
                  placeholder="Record company research, interview questions, offer details, salary expectations..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>

            </div>
          )}

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            justify: 'flex-end',
            gap: '10px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'auto'
          }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Application
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
