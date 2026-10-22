import React from 'react';
import { Send, Calendar, Trophy, Percent, DollarSign, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { convertSalary, formatSingleSalary } from '../utils/currency';

export default function StatsOverview({ applications, displayCurrency = 'INR', onToggleCurrency }) {
  const total = applications.length;
  const appliedCount = applications.filter(a => a.status !== 'wishlist' && a.status !== 'referral').length;
  const pendingApplyCount = applications.filter(a => a.status === 'wishlist' || a.status === 'referral').length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  
  // Calculate Response Rate (Interviewing + Offer) / Applied * 100
  const responseRate = appliedCount > 0 
    ? Math.round(((interviewingCount + offerCount) / appliedCount) * 100) 
    : 0;

  // Average Salary Calculation normalized into displayCurrency (INR or USD)
  const validSalaries = applications.filter(a => a.salaryMax > 0);
  const avgSalary = validSalaries.length > 0
    ? Math.round(
        validSalaries.reduce((acc, a) => {
          const minConv = convertSalary(a.salaryMin, a.currency, displayCurrency);
          const maxConv = convertSalary(a.salaryMax, a.currency, displayCurrency);
          return acc + (minConv + maxConv) / 2;
        }, 0) / validSalaries.length
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
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Applications</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>{total}</div>
          </div>
          <div style={{ background: 'var(--status-applied-bg)', padding: '10px', borderRadius: '12px', color: 'var(--status-applied)' }}>
            <Send size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {appliedCount} submitted · <span style={{ color: pendingApplyCount > 0 ? 'var(--status-interview)' : 'inherit', fontWeight: 600 }}>{pendingApplyCount} pending to apply</span>
        </div>
      </div>

      {/* Response Rate */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Response Rate</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: responseRate > 25 ? 'var(--status-offer)' : 'var(--text-primary)' }}>
              {responseRate}%
            </div>
          </div>
          <div style={{ background: 'var(--status-wishlist-bg)', padding: '10px', borderRadius: '12px', color: 'var(--status-wishlist)' }}>
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
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Interviews</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--status-interview)' }}>
              {interviewingCount}
            </div>
          </div>
          <div style={{ background: 'var(--status-interview-bg)', padding: '10px', borderRadius: '12px', color: 'var(--status-interview)' }}>
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
          <div>
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
          <div style={{ background: 'var(--status-offer-bg)', padding: '10px', borderRadius: '12px', color: 'var(--status-offer)' }}>
            <Trophy size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {offerCount > 0 ? 'Congratulations! Prepare negotiation.' : 'Keep pushing forward!'}
        </div>
      </div>

      {/* Average Salary */}
      <div className="glass-panel glass-panel-interactive" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Target Salary</span>
              {onToggleCurrency && (
                <button
                  type="button"
                  onClick={() => onToggleCurrency(displayCurrency === 'INR' ? 'USD' : 'INR')}
                  title={`Switch to ${displayCurrency === 'INR' ? 'USD ($)' : 'INR (₹)'}`}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: 'var(--accent-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>{displayCurrency === 'INR' ? '🇮🇳 ₹ INR' : '🇺🇸 $ USD'}</span>
                  <span style={{ opacity: 0.6 }}>⇄</span>
                </button>
              )}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
              {avgSalary ? formatSingleSalary(avgSalary, displayCurrency) : 'N/A'}
            </div>
          </div>
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            padding: '10px',
            borderRadius: '12px',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px'
          }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{displayCurrency === 'INR' ? '₹' : '$'}</span>
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {displayCurrency === 'INR' ? 'Normalized to INR (₹ / LPA)' : 'Normalized to USD ($ / yr)'} · Click badge to switch
        </div>
      </div>
    </div>
  );
}
