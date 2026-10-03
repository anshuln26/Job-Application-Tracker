import React, { useRef } from 'react';
import {
  Briefcase,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Calendar as CalendarIcon,
  Plus,
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  Search,
  Scale
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  theme,
  setTheme,
  onExportData,
  onImportData,
  onResetData,
  totalApps
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', marginBottom: '24px', padding: '16px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary), #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px var(--accent-glow)'
          }}>
            <Briefcase size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              CareerTrack Pro
              <span className="badge badge-applied" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{totalApps} Apps</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Smart Job Search & Offer Tracker</p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ flex: '1', maxWidth: '360px', minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search company, title, tag, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
          />
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button
            className={`btn ${activeView === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('kanban')}
          >
            <LayoutGrid size={15} /> Board
          </button>
          <button
            className={`btn ${activeView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('table')}
          >
            <TableIcon size={15} /> Table
          </button>
          <button
            className={`btn ${activeView === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('analytics')}
          >
            <BarChart3 size={15} /> Analytics
          </button>
          <button
            className={`btn ${activeView === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('calendar')}
          >
            <CalendarIcon size={15} /> Schedule
          </button>
          <button
            className={`btn ${activeView === 'comparer' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('comparer')}
          >
            <Scale size={15} /> Offers
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-primary" onClick={onOpenAddModal} style={{ height: '40px' }}>
            <Plus size={18} /> New Job
          </button>

          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="btn btn-secondary btn-icon" onClick={onExportData} title="Export JSON Data">
            <Download size={18} />
          </button>

          <button
            className="btn btn-secondary btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON Data"
          >
            <Upload size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button className="btn btn-secondary btn-icon" onClick={onResetData} title="Reset Sample Data">
            <RotateCcw size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
