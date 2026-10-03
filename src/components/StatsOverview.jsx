import React from 'react';
import { Send, Calendar, Trophy, Percent, DollarSign, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StatsOverview({ applications }) {
  const total = applications.length;
  const appliedCount = applications.filter(a => a.status !== 'wishlist').length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  
  // Calculate Response Rate (Interviewing + Offer) / Applied * 100
  const responseRate = appliedCount > 0 
    ? Math.round(((interviewingCount + offerCount) / appliedCount) * 100) 
    : 0;

  // Average Salary Calculation
  const validSalaries = applications.filter(a => a.salaryMax > 0);
  const avgSalary = validSalaries.length > 0
    ? Math.round(validSalaries.reduce((acc, a) => acc + (a.salaryMin + a.salaryMax) / 2, 0) / validSalaries.length)
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
          {appliedCount} submitted · {applications.filter(a => a.status === 'wishlist').length} saved
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Salary Target</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>
              ${avgSalary ? (avgSalary / 1000).toFixed(0) + 'k' : 'N/A'}
            </div>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '10px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <DollarSign size={20} />
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Based on specified target ranges
        </div>
      </div>
    </div>
  );
}
