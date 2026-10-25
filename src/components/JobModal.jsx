import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  User,
  FileText,
  Briefcase,
  Users,
  Clock,
  ExternalLink,
  CheckCircle2,
  Globe,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  STAGES,
  WORK_TYPES,
  PRIORITIES,
  REFERRAL_STATUSES,
  VISA_STATUSES,
  TIMEZONE_SHIFTS,
  NOTICE_PERIODS,
  LOCATION_PRESETS
} from '../data/mockData';
import { SUPPORTED_CURRENCIES, SALARY_PERIODS, formatSalaryRange, annualizeSalary } from '../utils/currency';
import { getSavedLocations, saveCustomLocation, removeCustomLocation } from '../utils/location';

const createInitialFormData = (application, initialStage, displayCurrency = 'INR') => {
  const isPendingStage = initialStage === 'wishlist' || initialStage === 'referral';
  if (application) {
    const isIntern = (application.title || '').toLowerCase().includes('intern');
    const isUndisclosed = Boolean(
      application.salaryUndisclosed ||
      (Number(application.salaryMin) === 0 && Number(application.salaryMax) === 0)
    );
    return {
      ...application,
      currency: application.currency || (displayCurrency === 'native' ? 'INR' : (displayCurrency || 'INR')),
      salaryPeriod: application.salaryPeriod || (isIntern ? 'monthly' : 'yearly'),
      hoursPerWeek: application.hoursPerWeek || 40,
      salaryUndisclosed: isUndisclosed,
      salaryMin: isUndisclosed ? 0 : (Number(application.salaryMin) || 0),
      salaryMax: isUndisclosed ? 0 : (Number(application.salaryMax) || 0),
      salaryBase: application.salaryBase || 0,
      salaryBonus: application.salaryBonus || 0,
      salaryStocks: application.salaryStocks || 0,
      visaStatus: application.visaStatus || 'none',
      timezoneShift: application.timezoneShift || 'none',
      noticePeriod: application.noticePeriod || 'none',
      noticeEndDate: application.noticeEndDate || '',
      appliedDate: application.appliedDate || '',
      plannedApplyDate: application.plannedApplyDate || '',
      deadline: application.deadline || '',
      resumeCuration: application.resumeCuration || (isPendingStage ? 'pending' : 'curated'),
      referralStatus: application.referralStatus || 'none',
      referralContact: application.referralContact || '',
      referralRole: application.referralRole || '',
      referralLinkedin: application.referralLinkedin || '',
      referralDate: application.referralDate || '',
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
    workType: 'Remote (India)',
    status: initialStage || 'applied',
    priority: 'medium',
    salaryUndisclosed: false,
    salaryMin: 0,
    salaryMax: 0,
    currency: displayCurrency === 'native' ? 'INR' : (displayCurrency || 'INR'),
    salaryPeriod: 'yearly',
    hoursPerWeek: 40,
    salaryBase: 0,
    salaryBonus: 0,
    salaryStocks: 0,
    visaStatus: 'none',
    timezoneShift: 'none',
    noticePeriod: 'none',
    noticeEndDate: '',
    appliedDate: isPendingStage ? '' : today,
    plannedApplyDate: isPendingStage ? today : '',
    deadline: '',
    resumeCuration: isPendingStage ? 'pending' : 'curated',
    referralStatus: initialStage === 'referral' ? 'connection_pending' : 'none',
    referralContact: '',
    referralRole: '',
    referralLinkedin: '',
    referralDate: initialStage === 'referral' ? today : '',
    jobUrl: '',
    contactName: '',
    contactEmail: '',
    resumeVersion: 'Software_Engineer_2026.pdf',
    tags: ['React', 'Fullstack'],
    tagInput: '',
    notes: '',
    timeline: initialStage === 'applied'
      ? [{ id: 't-1', stage: 'Applied', date: today, notes: 'Submitted application portal.' }]
      : initialStage === 'referral'
      ? [{ id: 't-1', stage: 'Connection Request Sent', date: today, notes: 'Sent connection request on LinkedIn.' }]
      : [],
    interviews: []
  };
};

export default function JobModal({ isOpen, onClose, onSave, application, initialStage = 'applied', displayCurrency = 'INR' }) {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState(() => createInitialFormData(application, initialStage, displayCurrency));
  const [showSalaryBreakdown, setShowSalaryBreakdown] = useState(
    Boolean(application && (application.salaryBase > 0 || application.salaryBonus > 0 || application.salaryStocks > 0))
  );
  const [savedLocations, setSavedLocations] = useState(() => getSavedLocations());
  const [dateError, setDateError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      if (field === 'title' && typeof val === 'string' && val.toLowerCase().includes('intern')) {
        if (prev.salaryPeriod === 'yearly' && prev.salaryMin >= 500000) {
          next.salaryPeriod = 'monthly';
          next.salaryMin = (prev.currency || 'INR') === 'INR' ? 40000 : 2000;
          next.salaryMax = (prev.currency || 'INR') === 'INR' ? 60000 : 3000;
        }
      }
      if (field === 'status') {
        const isNowPending = val === 'wishlist' || val === 'referral';
        if (isNowPending) {
          if (!next.plannedApplyDate) {
            next.plannedApplyDate = new Date().toISOString().split('T')[0];
          }
        } else {
          if (!next.appliedDate) {
            next.appliedDate = new Date().toISOString().split('T')[0];
          }
        }
      }
      return next;
    });
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
    setDateError('');

    if (!formData.company || !formData.title) return;

    const isPending = formData.status === 'wishlist' || formData.status === 'referral';
    if (isPending && !formData.plannedApplyDate) {
      setDateError('Planned Apply Date is required for applications in Wishlist or Waiting for Referral stage.');
      setActiveTab('info');
      return;
    }
    if (!isPending && !formData.appliedDate) {
      setDateError('Actual Applied Date is required for submitted applications.');
      setActiveTab('info');
      return;
    }

    // Automatically save new location to recommendations
    if (formData.location && formData.location.trim().length > 1) {
      saveCustomLocation(formData.location);
    }

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
          background: 'var(--bg-surface-hover)',
          gap: '16px'
        }}>
          {[
            { id: 'info', label: 'Basic Info & Dates', icon: Briefcase },
            {
              id: 'global',
              label: 'Global & Preferences',
              icon: Globe,
              badge: Boolean(
                (formData.visaStatus && formData.visaStatus !== 'none') ||
                (formData.timezoneShift && formData.timezoneShift !== 'none') ||
                (formData.noticePeriod && formData.noticePeriod !== 'none')
              )
            },
            { id: 'referral', label: 'Referral & Networking', icon: Users, badge: Boolean(formData.referralStatus && formData.referralStatus !== 'none') },
            { id: 'contact', label: 'Contact & Resume', icon: User },
            { id: 'timeline', label: 'Milestones', icon: Calendar },
            { id: 'notes', label: 'Notes & Tags', icon: FileText }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
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
                <TabIcon size={15} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    display: 'inline-block'
                  }} />
                )}
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

              {/* Location with custom recommendations */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Location</label>
                  {formData.location && formData.location.trim().length > 1 && !savedLocations.some(l => l.toLowerCase() === formData.location.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        saveCustomLocation(formData.location);
                        setSavedLocations(getSavedLocations());
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>⭐ Save "{formData.location}" to recommendations</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bengaluru, India or Seoul, South Korea"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />

                {/* Standard Popular Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', marginRight: '2px' }}>
                    Popular:
                  </span>
                  {LOCATION_PRESETS.map(loc => {
                    const isSelected = formData.location === loc.location;
                    return (
                      <button
                        key={loc.label}
                        type="button"
                        onClick={() => {
                          handleChange('location', loc.location);
                          handleChange('workType', loc.workType);
                        }}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {loc.label}
                      </button>
                    );
                  })}
                </div>

                {/* User's Saved Custom Locations */}
                {savedLocations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', marginRight: '2px', fontWeight: 700 }}>
                      ⭐ My Recommendations:
                    </span>
                    {savedLocations.map(locStr => {
                      const isSelected = formData.location.toLowerCase() === locStr.toLowerCase();
                      return (
                        <span
                          key={locStr}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                            borderRadius: '12px',
                            background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            padding: '2px 8px',
                            gap: '4px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleChange('location', locStr)}
                            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
                          >
                            {locStr}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomLocation(locStr);
                              setSavedLocations(getSavedLocations());
                            }}
                            title="Remove from recommendations"
                            style={{ background: 'none', border: 'none', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Resume Curation & JD Alignment Tracker */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem' }}>
                    <Sparkles size={16} style={{ color: formData.resumeCuration === 'curated' ? '#10B981' : (formData.resumeCuration === 'pending' ? '#F59E0B' : 'var(--text-secondary)') }} />
                    <span>Resume Tailoring & JD Alignment</span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    background: formData.resumeCuration === 'curated' ? 'rgba(16, 185, 129, 0.12)' : (formData.resumeCuration === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(100, 116, 139, 0.12)'),
                    color: formData.resumeCuration === 'curated' ? '#10B981' : (formData.resumeCuration === 'pending' ? '#F59E0B' : 'var(--text-secondary)'),
                    border: `1px solid ${formData.resumeCuration === 'curated' ? 'rgba(16, 185, 129, 0.3)' : (formData.resumeCuration === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)')}`
                  }}>
                    {formData.resumeCuration === 'curated' ? '✨ Tailored for JD' : (formData.resumeCuration === 'pending' ? '⏳ Tailoring Pending' : '📄 Standard Resume')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'curated', label: 'Tailored for JD', desc: 'Customized with JD keywords & company focus', color: '#10B981' },
                    { id: 'pending', label: 'Needs Tailoring', desc: 'Reminder to customize resume before applying', color: '#F59E0B' },
                    { id: 'not_needed', label: 'Standard / Not Needed', desc: 'General software engineer resume is fine', color: '#64748B' }
                  ].map(opt => {
                    const isSelected = (formData.resumeCuration || 'pending') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChange('resumeCuration', opt.id)}
                        style={{
                          background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                          border: isSelected ? `2px solid ${opt.color}` : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isSelected ? opt.color : 'var(--text-primary)' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '95px' }}>
                    Resume File:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ height: '32px', fontSize: '0.78rem' }}
                    placeholder="e.g. Resume_SDE_Zomato_v2.pdf"
                    value={formData.resumeVersion || ''}
                    onChange={(e) => handleChange('resumeVersion', e.target.value)}
                  />
                </div>
              </div>

              {/* Undisclosed Salary Checkbox */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.salaryUndisclosed)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          salaryUndisclosed: checked,
                          salaryMin: checked ? 0 : prev.salaryMin,
                          salaryMax: checked ? 0 : prev.salaryMax
                        }));
                      }}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                    />
                    <span>Salary / Stipend Not Disclosed by Company</span>
                  </label>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '24px', marginTop: '2px' }}>
                    Check this if compensation is not specified in the JD, or leave inputs empty.
                  </div>
                </div>
                {formData.salaryUndisclosed && (
                  <span className="badge" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    Marked Undisclosed
                  </span>
                )}
              </div>

              {/* Disclosed Salary Inputs */}
              {!formData.salaryUndisclosed && (
                <>
                  {/* Currency Selector */}
                  <div className="form-group">
                    <label className="form-label">Salary Currency</label>
                <select
                  className="form-input"
                  value={formData.currency || 'INR'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pay Frequency / Period Selector */}
              <div className="form-group">
                <label className="form-label">Pay Frequency / Type</label>
                <select
                  className="form-input"
                  value={formData.salaryPeriod || 'yearly'}
                  onChange={(e) => {
                    const newPeriod = e.target.value;
                    const isINR = (formData.currency || 'INR') === 'INR';
                    let newMin = formData.salaryMin;
                    let newMax = formData.salaryMax;
                    if (newPeriod === 'monthly' && formData.salaryPeriod === 'yearly') {
                      newMin = isINR ? 40000 : 2500;
                      newMax = isINR ? 60000 : 3500;
                    } else if (newPeriod === 'hourly') {
                      newMin = isINR ? 800 : 25;
                      newMax = isINR ? 1500 : 45;
                    } else if (newPeriod === 'yearly' && formData.salaryPeriod === 'monthly') {
                      newMin = isINR ? 1800000 : 120000;
                      newMax = isINR ? 2800000 : 150000;
                    }
                    setFormData(prev => ({
                      ...prev,
                      salaryPeriod: newPeriod,
                      salaryMin: newMin,
                      salaryMax: newMax
                    }));
                  }}
                >
                  {SALARY_PERIODS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Expected Hours / Week if Hourly */}
              {formData.salaryPeriod === 'hourly' && (
                <div className="form-group">
                  <label className="form-label">Expected Hours / Week</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 40 (Full-time) or 20 (Part-time)"
                    value={formData.hoursPerWeek || 40}
                    onChange={(e) => handleChange('hoursPerWeek', Number(e.target.value))}
                  />
                </div>
              )}

                  {/* Min Salary / Stipend */}
                  <div className="form-group">
                    <label className="form-label">
                      {formData.salaryPeriod === 'monthly'
                        ? `Min Stipend (${formData.currency === 'INR' ? '₹ / mo' : `${formData.currency || '$'}/mo`})`
                        : formData.salaryPeriod === 'hourly'
                        ? `Min Rate (${formData.currency === 'INR' ? '₹ / hr' : `${formData.currency || '$'}/hr`})`
                        : `Min Salary (${formData.currency === 'INR' ? '₹ Raw / LPA' : `${formData.currency || '$'}/yr`})`}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder={
                        formData.salaryPeriod === 'monthly'
                          ? (formData.currency === 'INR' ? 'Optional (e.g. 40000)' : 'Optional (e.g. 2000)')
                          : formData.salaryPeriod === 'hourly'
                          ? (formData.currency === 'INR' ? 'Optional (e.g. 800)' : 'Optional (e.g. 25)')
                          : (formData.currency === 'INR' ? 'Optional (e.g. 1800000)' : 'Optional (e.g. 120000)')
                      }
                      value={formData.salaryMin === 0 ? '' : formData.salaryMin}
                      onChange={(e) => handleChange('salaryMin', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </div>

                  {/* Max Salary / Stipend */}
                  <div className="form-group">
                    <label className="form-label">
                      {formData.salaryPeriod === 'monthly'
                        ? `Max Stipend (${formData.currency === 'INR' ? '₹ / mo' : `${formData.currency || '$'}/mo`})`
                        : formData.salaryPeriod === 'hourly'
                        ? `Max Rate (${formData.currency === 'INR' ? '₹ / hr' : `${formData.currency || '$'}/hr`})`
                        : `Max Salary (${formData.currency === 'INR' ? '₹ Raw / LPA' : `${formData.currency || '$'}/yr`})`}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder={
                        formData.salaryPeriod === 'monthly'
                          ? (formData.currency === 'INR' ? 'Optional (e.g. 60000)' : 'Optional (e.g. 3500)')
                          : formData.salaryPeriod === 'hourly'
                          ? (formData.currency === 'INR' ? 'Optional (e.g. 1500)' : 'Optional (e.g. 45)')
                          : (formData.currency === 'INR' ? 'Optional (e.g. 2800000)' : 'Optional (e.g. 150000)')
                      }
                      value={formData.salaryMax === 0 ? '' : formData.salaryMax}
                      onChange={(e) => handleChange('salaryMax', e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </div>

              {/* Live Conversion Preview Banner */}
              {(formData.salaryMin > 0 || formData.salaryMax > 0) && (() => {
                const isINR = (formData.currency || 'INR') === 'INR';
                const targetCurr = isINR ? 'USD' : 'INR';
                const period = formData.salaryPeriod || 'yearly';
                const convRange = formatSalaryRange(
                  formData.salaryMin,
                  formData.salaryMax,
                  formData.currency || 'INR',
                  targetCurr,
                  period,
                  formData.hoursPerWeek || 40
                );

                const annMin = annualizeSalary(formData.salaryMin, period, formData.hoursPerWeek || 40);
                const annMax = annualizeSalary(formData.salaryMax, period, formData.hoursPerWeek || 40);
                const annFormatted = formatSalaryRange(annMin, annMax, formData.currency || 'INR', formData.currency || 'INR', 'yearly').formatted;

                return (
                  <div style={{
                    gridColumn: '1 / -1',
                    background: 'var(--bg-surface-hover)',
                    border: '1px dashed var(--border-color)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>💱</span>
                        <strong>{isINR ? 'USD Equivalent ($):' : 'INR Equivalent (₹):'}</strong>
                        <span style={{ color: 'var(--status-offer)', fontWeight: 700 }}>
                          {convRange.formatted}
                        </span>
                      </div>
                      <span style={{
                        background: period === 'monthly' ? 'rgba(236, 72, 153, 0.12)' : period === 'hourly' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: period === 'monthly' ? '#EC4899' : period === 'hourly' ? '#3B82F6' : '#10B981',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.72rem'
                      }}>
                        {period === 'monthly' ? '🎓 Monthly Stipend' : period === 'hourly' ? `⏱️ Hourly (${formData.hoursPerWeek || 40}h/wk)` : '💼 Annual Full-Time CTC'}
                      </span>
                    </div>

                    {period !== 'yearly' && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                        📅 <strong>Annualized Equivalent:</strong> {annFormatted} / yr {isINR ? `(≈ $${Math.round(annMax / 84.5 / 1000)}k/yr USD)` : `(≈ ₹${(annMax * 84.5 / 100000).toFixed(1)} LPA)`}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Optional CTC / In-Hand Breakdown Accordion */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setShowSalaryBreakdown(prev => !prev)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface-hover)',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span>Compensation Structure Breakdown (Fixed Base / Bonus / Stocks)</span>
                    {(formData.salaryBase > 0 || formData.salaryBonus > 0 || formData.salaryStocks > 0) && (
                      <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Active
                      </span>
                    )}
                  </div>
                  {showSalaryBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showSalaryBreakdown && (
                  <div style={{ padding: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Track your monthly in-hand cash vs performance incentives vs equity grants:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Fixed Base Salary (Annual)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={formData.currency === 'INR' ? 'e.g. 2400000 (24 LPA)' : 'e.g. 140000'}
                          value={formData.salaryBase || ''}
                          onChange={(e) => handleChange('salaryBase', Number(e.target.value))}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Guaranteed in-hand component</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Performance Bonus / Variable</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={formData.currency === 'INR' ? 'e.g. 400000 (4 LPA)' : 'e.g. 25000'}
                          value={formData.salaryBonus || ''}
                          onChange={(e) => handleChange('salaryBonus', Number(e.target.value))}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Annual variable target</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>ESOPs / Stocks (Annual Vesting)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={formData.currency === 'INR' ? 'e.g. 600000 (6 LPA)' : 'e.g. 40000'}
                          value={formData.salaryStocks || ''}
                          onChange={(e) => handleChange('salaryStocks', Number(e.target.value))}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>RSUs / Equity value per year</span>
                      </div>
                    </div>

                    {(formData.salaryBase > 0 || formData.salaryBonus > 0 || formData.salaryStocks > 0) && (() => {
                      const base = Number(formData.salaryBase) || 0;
                      const bonus = Number(formData.salaryBonus) || 0;
                      const stocks = Number(formData.salaryStocks) || 0;
                      const totalCTC = base + bonus + stocks;
                      const basePct = totalCTC > 0 ? Math.round((base / totalCTC) * 100) : 0;
                      const bonusPct = totalCTC > 0 ? Math.round((bonus / totalCTC) * 100) : 0;
                      const stocksPct = totalCTC > 0 ? Math.round((stocks / totalCTC) * 100) : 0;

                      return (
                        <div style={{
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border-color)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ fontSize: '0.78rem' }}>
                            <strong>Calculated Total CTC: </strong>
                            <span style={{ color: 'var(--status-offer)', fontWeight: 700 }}>
                              {formData.currency === 'INR' ? `₹${(totalCTC / 100000).toFixed(1)} LPA` : `$${Math.round(totalCTC / 1000)}k`}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                              (Base: {basePct}% · Bonus: {bonusPct}% · Stocks: {stocksPct}%)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleChange('salaryMax', totalCTC);
                              if (base > 0 && (!formData.salaryMin || formData.salaryMin === 0)) handleChange('salaryMin', base);
                            }}
                            className="btn btn-ghost"
                            style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                          >
                            Set Max Salary to this CTC ↗
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}

              {/* Validation Date Error Banner */}
              {dateError && (
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'var(--status-rejected-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--status-rejected)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{dateError}</span>
                </div>
              )}

              {/* Planned Apply Date (Mandatory for Wishlist / Referral) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={13} style={{ color: 'var(--status-wishlist)' }} />
                  <span>
                    Planned Apply Date {(formData.status === 'wishlist' || formData.status === 'referral') && <strong style={{ color: 'var(--status-rejected)' }}>*</strong>}
                  </span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.plannedApplyDate || ''}
                  onChange={(e) => {
                    setDateError('');
                    handleChange('plannedApplyDate', e.target.value);
                  }}
                  required={formData.status === 'wishlist' || formData.status === 'referral'}
                />
                <span style={{ fontSize: '0.7rem', color: (formData.status === 'wishlist' || formData.status === 'referral') ? 'var(--status-wishlist)' : 'var(--text-muted)' }}>
                  {(formData.status === 'wishlist' || formData.status === 'referral')
                    ? '⚠️ Mandatory for tracking application roadmap'
                    : 'Optional target apply date'}
                </span>
              </div>

              {/* Application Deadline (Always Optional) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} style={{ color: 'var(--status-rejected)' }} />
                  <span>Application Deadline <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></span>
                  {formData.deadline && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--status-rejected)', marginLeft: 'auto', fontWeight: 600 }}>
                      ⚠️ Active Alert
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.deadline || ''}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Leave blank if rolling admissions or not specified in JD
                </span>
              </div>

              {/* Actual Applied Date (Mandatory for Applied / Interviewing / Offer / Rejected) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--status-applied)' }} />
                  <span>
                    Actual Applied Date {formData.status !== 'wishlist' && formData.status !== 'referral' && <strong style={{ color: 'var(--status-rejected)' }}>*</strong>}
                  </span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.appliedDate || ''}
                  onChange={(e) => {
                    setDateError('');
                    handleChange('appliedDate', e.target.value);
                  }}
                  required={formData.status !== 'wishlist' && formData.status !== 'referral'}
                />
                <span style={{ fontSize: '0.7rem', color: formData.status !== 'wishlist' && formData.status !== 'referral' ? 'var(--status-applied)' : 'var(--text-muted)' }}>
                  {formData.status !== 'wishlist' && formData.status !== 'referral'
                    ? '⚠️ Mandatory date when you submitted application'
                    : 'Optional — leave blank until submitted'}
                </span>
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

          {/* TAB: GLOBAL & PREFERENCES */}
          {activeTab === 'global' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Globe size={22} style={{ color: '#3B82F6', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Global & Work Preferences:</strong>{' '}
                  Tailored for domestic Indian applications and international opportunities across US, UK, UAE, Europe, and APAC. Track visa sponsorships, timezone overlap with IST, and recruiter notice periods.
                </div>
              </div>

              {/* 1. Visa & Work Authorization */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛂</span>
                  <span>Visa & Work Authorization Status</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {VISA_STATUSES.map(v => {
                    const isSelected = (formData.visaStatus || 'none') === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleChange('visaStatus', v.id)}
                        style={{
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <input
                          type="radio"
                          name="visaStatus"
                          checked={isSelected}
                          onChange={() => handleChange('visaStatus', v.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)' }}>
                            {v.label}
                          </div>
                          {v.badge && (
                            <span style={{
                              fontSize: '0.67rem',
                              fontWeight: 600,
                              color: v.color,
                              background: v.bg || 'rgba(59, 130, 246, 0.1)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '3px'
                            }}>
                              Badge: {v.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Timezone & Work Shift Overlap */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🕒</span>
                  <span>Timezone & Shift Overlap (Relative to Indian Standard Time - IST)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {TIMEZONE_SHIFTS.map(t => {
                    const isSelected = (formData.timezoneShift || 'none') === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleChange('timezoneShift', t.id)}
                        style={{
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <input
                          type="radio"
                          name="timezoneShift"
                          checked={isSelected}
                          onChange={() => handleChange('timezoneShift', t.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)' }}>
                            {t.label}
                          </div>
                          {t.badge && (
                            <span style={{
                              fontSize: '0.67rem',
                              fontWeight: 600,
                              color: t.color,
                              background: t.bg || 'rgba(6, 182, 212, 0.1)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '3px'
                            }}>
                              {t.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Notice Period & Availability */}
              <div style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏳</span>
                  <span>Notice Period & Availability for this Application</span>
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Specify your notice period for this role (recruiters almost always filter by immediate / 30d / 90d):
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Notice Period Category</label>
                    <select
                      className="form-select"
                      value={formData.noticePeriod || 'none'}
                      onChange={(e) => handleChange('noticePeriod', e.target.value)}
                    >
                      {NOTICE_PERIODS.map(n => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                      ))}
                    </select>
                  </div>

                  {formData.noticePeriod === 'serving' && (
                    <div className="form-group">
                      <label className="form-label">Last Working Day (LWD)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.noticeEndDate || ''}
                        onChange={(e) => handleChange('noticeEndDate', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: REFERRAL & NETWORKING */}
          {activeTab === 'referral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1px solid rgba(236, 72, 153, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Users size={20} style={{ color: 'var(--status-referral)', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>LinkedIn Referral & Networking Tracker:</strong>{' '}
                  Track connection requests sent to company employees before applying. Set status to "Connection Request Sent" to track pending days and prevent missed deadlines!
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Referral / Outreach Status</label>
                  <select
                    className="form-select"
                    value={formData.referralStatus || 'none'}
                    onChange={(e) => handleChange('referralStatus', e.target.value)}
                  >
                    {REFERRAL_STATUSES.map(rs => (
                      <option key={rs.id} value={rs.id}>{rs.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Connection Request Sent Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.referralDate || ''}
                    onChange={(e) => handleChange('referralDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Referrer / Employee Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Marcus Vance"
                    value={formData.referralContact || ''}
                    onChange={(e) => handleChange('referralContact', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employee Title / Role</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Software Engineer at OpenAI"
                    value={formData.referralRole || ''}
                    onChange={(e) => handleChange('referralRole', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>LinkedIn Profile URL</label>
                    {formData.referralLinkedin && (
                      <a
                        href={formData.referralLinkedin.startsWith('http') ? formData.referralLinkedin : `https://${formData.referralLinkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                      >
                        Open LinkedIn Profile <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://www.linkedin.com/in/username"
                    value={formData.referralLinkedin || ''}
                    onChange={(e) => handleChange('referralLinkedin', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Outreach / Referral Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Sent personalized connection request on Oct 20 mentioning their work on WebGPU. Waiting for acceptance before asking for referral link."
                    value={formData.referralNotes || ''}
                    onChange={(e) => handleChange('referralNotes', e.target.value)}
                  />
                </div>
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
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr 32px', gap: '8px', alignItems: 'center', background: 'var(--bg-surface-hover)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
