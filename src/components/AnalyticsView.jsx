import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { STAGES } from '../data/mockData';
import { Lightbulb, TrendingUp, DollarSign, Award, Compass } from 'lucide-react';

const STAGE_COLORS = {
  wishlist: '#8B5CF6',
  applied: '#3B82F6',
  interviewing: '#F59E0B',
  offer: '#10B981',
  rejected: '#EF4444'
};

export default function AnalyticsView({ applications }) {
  // Data 1: Stage Breakdown
  const stageData = STAGES.map(s => {
    const count = applications.filter(a => a.status === s.id).length;
    return { name: s.label, value: count, color: STAGE_COLORS[s.id] || '#6366F1' };
  }).filter(d => d.value > 0);

  // Data 2: Work Type Distribution
  const workTypeCounts = applications.reduce((acc, a) => {
    const wt = a.workType || 'Remote';
    acc[wt] = (acc[wt] || 0) + 1;
    return acc;
  }, {});

  const workTypeData = Object.keys(workTypeCounts).map(key => ({
    name: key,
    value: workTypeCounts[key]
  }));

  // Data 3: Top Salaries Comparison
  const salaryData = applications
    .filter(a => a.salaryMax > 0)
    .map(a => ({
      company: a.company.length > 10 ? a.company.substring(0, 10) + '...' : a.company,
      Min: Math.round(a.salaryMin / 1000),
      Max: Math.round(a.salaryMax / 1000)
    }))
    .slice(0, 8);

  // Data 4: Timeline
  const timelineGroup = applications.reduce((acc, a) => {
    if (!a.appliedDate) return acc;
    const month = a.appliedDate.substring(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const timelineData = Object.keys(timelineGroup).sort().map(month => ({
    month,
    Applications: timelineGroup[month]
  }));

  const WORK_COLORS = ['#6366F1', '#8B5CF6', '#EC4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Row: Donut Chart + Work Model */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Stage Breakdown */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--accent-primary)' }} /> Application Funnel
          </h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Model Distribution */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: 'var(--accent-secondary)' }} /> Work Arrangement
          </h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {workTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={WORK_COLORS[index % WORK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Middle Row: Salary Comparison Bar Chart */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} style={{ color: 'var(--status-offer)' }} /> Expected Salary Ranges ($k/year)
        </h3>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="company" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="Min" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Max" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Application Momentum Area Chart */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} /> Application Velocity & Momentum
        </h3>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis allowDecimals={false} stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="Applications" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#appGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategic Insights Panel */}
      <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-card))' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={18} style={{ color: 'var(--status-interview)' }} /> Career Search Insights & Tips
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
          <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--status-offer)', display: 'block', marginBottom: '4px' }}>🎯 Target High-Conversion Roles</strong>
            Applications submitted with warm referrals have 4x higher interview rates compared to cold portal submissions.
          </div>
          <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '4px' }}>⏱️ Follow Up Within 5-7 Days</strong>
            If an application remains in "Applied" status after 1 week, reach out to talent recruiters on LinkedIn.
          </div>
          <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--status-interview)', display: 'block', marginBottom: '4px' }}>💡 Negotiate Leverage</strong>
            Having 2+ active interview loops at once significantly increases your final compensation offer leverage.
          </div>
        </div>
      </div>

    </div>
  );
}
