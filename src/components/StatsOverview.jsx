import React, { useState } from 'react';
import { Send, Calendar, Trophy, Percent, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertSalary, formatSingleSalary, annualizeSalary, monthlyizeSalary } from '../utils/currency';

export default function StatsOverview({ applications, displayCurrency = 'INR', onToggleCurrency }) {
  const [payMetricMode, setPayMetricMode] = useState('auto');
  const total = applications.length;
  const appliedCount = applications.filter(a => a.status !== 'wishlist' && a.status !== 'referral').length;
  const pendingApplyCount = applications.filter(a => a.status === 'wishlist' || a.status === 'referral').length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;
  
  // Calculate Response Rate (Interviewing + Offer) / Applied * 100
  const responseRate = appliedCount > 0 
    ? Math.round(((interviewingCount + offerCount) / appliedCount) * 100) 
    : 0;

  // Separate full-time/yearly roles from intern/monthly roles
  const validSalaries = applications.filter(a => a.salaryMax > 0);
  const internApps = validSalaries.filter(a => 
    a.salaryPeriod === 'monthly' || (a.title && a.title.toLowerCase().includes('intern'))
  );
  const fulltimeApps = validSalaries.filter(a => 
    a.salaryPeriod !== 'monthly' && (!a.title || !a.title.toLowerCase().includes('intern'))
  );

  const isAutoDefaultIntern = fulltimeApps.length === 0 && internApps.length > 0;
  const effectivePayMode = payMetricMode === 'auto'
    ? (isAutoDefaultIntern ? 'intern' : 'annual')
    : payMetricMode;

  const kpiCurrency = displayCurrency === 'native' ? 'INR' : displayCurrency;

  // Average Annual Salary (Full-time)
  const avgAnnualSalary = fulltimeApps.length > 0
    ? Math.round(
        fulltimeApps.reduce((acc, a) => {
          const annMin = annualizeSalary(a.salaryMin, a.salaryPeriod, a.hoursPerWeek);
          const annMax = annualizeSalary(a.salaryMax, a.salaryPeriod, a.hoursPerWeek);
          const minConv = convertSalary(annMin, a.currency, kpiCurrency);
          const maxConv = convertSalary(annMax, a.currency, kpiCurrency);
          return acc + (minConv + maxConv) / 2;
        }, 0) / fulltimeApps.length
      )
    : 0;

  // Average Monthly Stipend (Intern)
  const avgMonthlyStipend = internApps.length > 0
    ? Math.round(
        internApps.reduce((acc, a) => {
          const mMin = monthlyizeSalary(a.salaryMin, a.salaryPeriod, a.hoursPerWeek);
          const mMax = monthlyizeSalary(a.salaryMax, a.salaryPeriod, a.hoursPerWeek);
          const minConv = convertSalary(mMin, a.currency, kpiCurrency);
          const maxConv = convertSalary(mMax, a.currency, kpiCurrency);
          return acc + (minConv + maxConv) / 2;
        }, 0) / internApps.length
      )
    : 0;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Total Applications */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Applications</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>{total}</div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            minWidth: '42px',
            minHeight: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--status-applied-bg)',
            color: 'var(--status-applied)',
            flexShrink: 0,
            marginLeft: '12px'
          }}>
            <Send size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {appliedCount} submitted{rejectedCount > 0 && <span style={{ color: 'var(--status-rejected)', fontWeight: 600 }}> ({rejectedCount} rejected)</span>} · <span style={{ color: pendingApplyCount > 0 ? 'var(--status-interview)' : 'inherit', fontWeight: 600 }}>{pendingApplyCount} pending to apply</span>
        </div>
      </div>

      {/* Response Rate */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Response Rate</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: responseRate > 25 ? 'var(--status-offer)' : 'var(--text-primary)' }}>
              {responseRate}%
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            minWidth: '42px',
            minHeight: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--status-wishlist-bg)',
            color: 'var(--status-wishlist)',
            flexShrink: 0,
            marginLeft: '12px'
          }}>
            <Percent size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Ratio of interviews & offers from applications
        </div>
      </div>

      {/* Active Interviews */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Interviews</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--status-interview)' }}>
              {interviewingCount}
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            minWidth: '42px',
            minHeight: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--status-interview-bg)',
            color: 'var(--status-interview)',
            flexShrink: 0,
            marginLeft: '12px'
          }}>
            <Calendar size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Currently in assessment / onsite stages
        </div>
      </div>

      {/* Job Offers */}
      <div className={`glass-panel glass-panel-interactive ${offerCount > 0 ? 'pulse-offer' : ''}`} style={{ padding: '20px', borderColor: offerCount > 0 ? 'rgba(16, 185, 129, 0.4)' : '' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Offers Received</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--status-offer)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {offerCount}
              {offerCount > 0 && (
                <button
                  onClick={triggerConfetti}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-offer)' }}
                  title="Celebrate!"
                >
                  <Sparkles size={20} />
                </button>
              )}
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            minWidth: '42px',
            minHeight: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--status-offer-bg)',
            color: 'var(--status-offer)',
            flexShrink: 0,
            marginLeft: '12px'
          }}>
            <Trophy size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {offerCount > 0 ? 'Congratulations! Prepare negotiation.' : 'Keep pushing forward!'}
        </div>
      </div>

      {/* Average Salary & Intern Stipend Dual-View Card */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header row with Title and Type / Currency Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {effectivePayMode === 'intern' ? '🎓 Avg Intern Stipend' : '💼 Avg Target Salary'}
              </span>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {/* Full-time vs Intern Pill Switcher (Shown when both exist) */}
                {fulltimeApps.length > 0 && internApps.length > 0 && (
                  <div style={{
                    display: 'inline-flex',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '7px',
                    padding: '2px',
                    gap: '2px'
                  }}>
                    <button
                      type="button"
                      onClick={() => setPayMetricMode('annual')}
                      title="View Average Full-Time Annual Salary"
                      style={{
                        border: 'none',
                        background: effectivePayMode === 'annual' ? 'var(--accent-primary)' : 'transparent',
                        color: effectivePayMode === 'annual' ? '#fff' : 'var(--text-secondary)',
                        borderRadius: '5px',
                        padding: '2px 6px',
                        fontSize: '0.66rem',
                        fontWeight: effectivePayMode === 'annual' ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      Annual
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMetricMode('intern')}
                      title="View Average Monthly Intern Stipend"
                      style={{
                        border: 'none',
                        background: effectivePayMode === 'intern' ? 'var(--accent-primary)' : 'transparent',
                        color: effectivePayMode === 'intern' ? '#fff' : 'var(--text-secondary)',
                        borderRadius: '5px',
                        padding: '2px 6px',
                        fontSize: '0.66rem',
                        fontWeight: effectivePayMode === 'intern' ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      Intern
                    </button>
                  </div>
                )}

                {/* Inline Currency Switcher */}
                {onToggleCurrency && (
                  <button
                    type="button"
                    onClick={() => onToggleCurrency(displayCurrency === 'INR' ? 'USD' : (displayCurrency === 'USD' ? 'native' : 'INR'))}
                    title={`Current: ${displayCurrency === 'native' ? 'Native Currencies' : displayCurrency}. Click to switch.`}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: 'var(--accent-primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <span>{displayCurrency === 'INR' ? '₹' : (displayCurrency === 'USD' ? '$' : '🌐')}</span>
                    <span style={{ opacity: 0.6 }}>⇄</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metric Value */}
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {effectivePayMode === 'intern'
                ? (avgMonthlyStipend ? formatSingleSalary(avgMonthlyStipend, kpiCurrency, 'monthly') : 'N/A')
                : (avgAnnualSalary ? formatSingleSalary(avgAnnualSalary, kpiCurrency, 'yearly') : 'N/A')}
            </div>
          </div>

          <div style={{
            width: '42px',
            height: '42px',
            minWidth: '42px',
            minHeight: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: effectivePayMode === 'intern' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            color: effectivePayMode === 'intern' ? '#EC4899' : 'var(--accent-primary)',
            flexShrink: 0,
            marginLeft: '12px'
          }}>
            {effectivePayMode === 'intern' ? <GraduationCap size={20} /> : <Briefcase size={20} />}
          </div>
        </div>

        {/* Footer Subtitle */}
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {effectivePayMode === 'intern'
            ? `Based on ${internApps.length} monthly stipend target(s)`
            : `Based on ${fulltimeApps.length} full-time target(s)`}
          {displayCurrency === 'native' ? ' · Showing Native on cards (Total in ₹)' : ''}
          {fulltimeApps.length > 0 && internApps.length > 0 && ' · Click pill to switch'}
        </div>
      </div>
    </div>
  );
}
