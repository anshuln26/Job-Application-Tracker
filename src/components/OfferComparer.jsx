import React, { useState } from 'react';
import { Scale, Trophy, DollarSign, Award, Check, Sparkles, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OfferComparer({ applications }) {
  const offerApps = applications.filter(a => a.status === 'offer' || a.status === 'interviewing');

  // Interactive evaluation state for each offer (defaults to reasonable score)
  const [offerRatings, setOfferRatings] = useState({});

  const getRating = (id, key, defaultVal = 5) => {
    return offerRatings[id]?.[key] ?? defaultVal;
  };

  const updateRating = (id, key, val) => {
    setOfferRatings(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: parseInt(val, 10)
      }
    }));
  };

  const calculateTotalScore = (app) => {
    const salaryScore = (app.salaryMax / 200000) * 30; // Max 30 pts for salary
    const flexScore = getRating(app.id, 'flexibility', 7) * 2; // Max 20 pts
    const cultureScore = getRating(app.id, 'culture', 8) * 2.5; // Max 25 pts
    const growthScore = getRating(app.id, 'growth', 7) * 2.5; // Max 25 pts

    return Math.min(100, Math.round(salaryScore + flexScore + cultureScore + growthScore));
  };

  // Find highest scoring offer
  const scoredOffers = offerApps.map(a => ({
    app: a,
    score: calculateTotalScore(a)
  })).sort((a, b) => b.score - a.score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} style={{ color: 'var(--status-offer)' }} /> Job Offer Evaluator & Comparison Matrix
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Evaluate and score compensation packages, remote flexibility, culture, and career growth side-by-side.
          </p>
        </div>

        {scoredOffers.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={() => confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } })}
          >
            <Sparkles size={16} /> Celebrate Best Offer
          </button>
        )}
      </div>

      {offerApps.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No active job offers recorded yet. Update application status to "Offer Received" or "Interviewing" to evaluate them here!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '20px' }}>
          {scoredOffers.map(({ app, score }, idx) => {
            const isWinner = idx === 0 && scoredOffers.length > 1;

            return (
              <div
                key={app.id}
                className="glass-panel glass-panel-interactive"
                style={{
                  padding: '20px',
                  position: 'relative',
                  border: isWinner ? '2px solid var(--status-offer)' : '1px solid var(--border-color)',
                  background: isWinner ? 'linear-gradient(180deg, var(--status-offer-bg), var(--bg-card))' : 'var(--bg-card)'
                }}
              >
                {/* Top Rank Badge */}
                {isWinner && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '16px',
                    background: 'var(--status-offer)',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 4px 10px var(--status-offer-bg)'
                  }}>
                    <Trophy size={13} /> #1 Ranked Choice
                  </div>
                )}

                {/* Company Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--accent-primary)'
                  }}>
                    {app.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{app.company}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.title}</p>
                  </div>
                </div>

                {/* Overall Score Meter */}
                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Value Rating</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: score > 75 ? 'var(--status-offer)' : 'var(--accent-primary)' }}>
                    {score}/100
                  </span>
                </div>

                {/* Base Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Salary Range:</span>
                    <strong style={{ color: 'var(--status-offer)' }}>
                      ${(app.salaryMin/1000).toFixed(0)}k - ${(app.salaryMax/1000).toFixed(0)}k
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Work Model:</span>
                    <strong>{app.workType} ({app.location || 'Remote'})</strong>
                  </div>
                </div>

                {/* Interactive Rating Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>Flexibility & WFH:</span>
                      <strong>{getRating(app.id, 'flexibility', 7)}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={getRating(app.id, 'flexibility', 7)}
                      onChange={(e) => updateRating(app.id, 'flexibility', e.target.value)}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>Culture & Team Alignment:</span>
                      <strong>{getRating(app.id, 'culture', 8)}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={getRating(app.id, 'culture', 8)}
                      onChange={(e) => updateRating(app.id, 'culture', e.target.value)}
                      style={{ accentColor: 'var(--status-interview)' }}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>Career Growth & Impact:</span>
                      <strong>{getRating(app.id, 'growth', 7)}/10</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={getRating(app.id, 'growth', 7)}
                      onChange={(e) => updateRating(app.id, 'growth', e.target.value)}
                      style={{ accentColor: 'var(--status-offer)' }}
                    />
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
