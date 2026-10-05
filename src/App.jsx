import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import KanbanBoard from './components/KanbanBoard';
import JobTable from './components/JobTable';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import OfferComparer from './components/OfferComparer';
import JobModal from './components/JobModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { INITIAL_APPLICATIONS } from './data/mockData';

const LOCAL_STORAGE_KEY = 'careertrack_apps_v1';
const THEME_KEY = 'careertrack_theme_v1';

export default function App() {
  // Load Applications from LocalStorage or Initial Mock Data
  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch (e) {
      console.error('Failed to parse saved applications:', e);
      return INITIAL_APPLICATIONS;
    }
  });

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark';
  });

  // UI View States
  const [activeView, setActiveView] = useState('kanban'); // 'kanban', 'table', 'analytics', 'calendar', 'comparer'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Toast States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [initialStageForModal, setInitialStageForModal] = useState('applied');
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', id: null });

  // Sync LocalStorage & Theme attribute
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to save applications:', e);
    }
  }, [applications]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Filter applications by search query
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(app => 
      app.company.toLowerCase().includes(q) ||
      app.title.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q)) ||
      (app.notes && app.notes.toLowerCase().includes(q)) ||
      (app.tags && app.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [applications, searchQuery]);

  // CRUD Actions
  const handleSaveApplication = (appData) => {
    setApplications(prev => {
      const exists = prev.some(a => a.id === appData.id);
      if (exists) {
        showToast(`Updated application for ${appData.company}`);
        return prev.map(a => a.id === appData.id ? appData : a);
      } else {
        showToast(`Added application for ${appData.company}`);
        return [appData, ...prev];
      }
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        const updatedTimeline = [
          ...(app.timeline || []),
          {
            id: 't-' + Date.now(),
            stage: `Moved to ${newStatus}`,
            date: new Date().toISOString().split('T')[0],
            notes: `Status updated via board/table.`
          }
        ];
        return { ...app, status: newStatus, timeline: updatedTimeline };
      }
      return app;
    }));
    showToast(`Status updated!`);
  };

  const handleDeleteApplication = (id) => {
    setConfirmState({
      isOpen: true,
      type: 'delete_one',
      id,
      title: 'Delete Application?',
      message: 'Are you sure you want to remove this job application? This action cannot be undone.'
    });
  };

  const handleBulkDelete = (ids) => {
    setConfirmState({
      isOpen: true,
      type: 'delete_bulk',
      id: ids,
      title: `Delete ${ids.length} Applications?`,
      message: 'Are you sure you want to delete all selected job applications?'
    });
  };

  const handleBulkStatusUpdate = (ids, newStatus) => {
    setApplications(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: newStatus } : a));
    showToast(`Updated status for ${ids.length} applications.`);
  };

  const confirmAction = () => {
    if (confirmState.type === 'delete_one') {
      setApplications(prev => prev.filter(a => a.id !== confirmState.id));
      showToast('Application deleted.', 'info');
    } else if (confirmState.type === 'delete_bulk') {
      setApplications(prev => prev.filter(a => !confirmState.id.includes(a.id)));
      showToast(`${confirmState.id.length} applications deleted.`, 'info');
    } else if (confirmState.type === 'reset') {
      setApplications(INITIAL_APPLICATIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      showToast('Reset sample data to initial state.', 'info');
    }
    setConfirmState({ isOpen: false, type: '', id: null });
  };

  const handleResetData = () => {
    setConfirmState({
      isOpen: true,
      type: 'reset',
      title: 'Reset to Sample Data?',
      message: 'This will replace all your current entries with the default mock dataset.'
    });
  };

  // Export Data to JSON
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applications, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CareerTrack_Export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported backup data to JSON file.');
  };

  // Import Data from JSON
  const handleImportData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          setApplications(importedData);
          showToast(`Successfully imported ${importedData.length} applications!`);
        } else {
          showToast('Invalid JSON file format.', 'error');
        }
      } catch (err) {
        console.error('Failed to parse imported JSON:', err);
        showToast('Error parsing JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Interview Handlers
  const handleToggleInterviewComplete = (appId, interviewId) => {
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        const updated = (app.interviews || []).map(i => 
          i.id === interviewId ? { ...i, completed: !i.completed } : i
        );
        return { ...app, interviews: updated };
      }
      return app;
    }));
    showToast('Interview schedule updated!');
  };

  const handleAddInterview = (appId, newInterview) => {
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        return { ...app, interviews: [...(app.interviews || []), newInterview] };
      }
      return app;
    }));
    showToast('Interview added to schedule!');
  };

  const handleOpenAddModal = (stage = 'applied') => {
    setEditingApp(null);
    setInitialStageForModal(stage);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 20px 40px 20px' }}>
      
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAddModal={() => handleOpenAddModal('applied')}
        theme={theme}
        setTheme={setTheme}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        totalApps={applications.length}
      />

      {/* Main KPI Stats Bar */}
      <StatsOverview applications={applications} />

      {/* Views Container */}
      <main className="animate-fade-in">
        {activeView === 'kanban' && (
          <KanbanBoard
            applications={filteredApplications}
            onSelectApp={handleOpenEditModal}
            onUpdateStatus={handleUpdateStatus}
            onDeleteApp={handleDeleteApplication}
            onOpenAddModalWithStage={handleOpenAddModal}
          />
        )}

        {activeView === 'table' && (
          <JobTable
            applications={filteredApplications}
            onSelectApp={handleOpenEditModal}
            onUpdateStatus={handleUpdateStatus}
            onDeleteApp={handleDeleteApplication}
            onBulkDelete={handleBulkDelete}
            onBulkStatusUpdate={handleBulkStatusUpdate}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView applications={applications} />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            applications={applications}
            onSelectApp={handleOpenEditModal}
            onToggleInterviewComplete={handleToggleInterviewComplete}
            onAddInterview={handleAddInterview}
          />
        )}

        {activeView === 'comparer' && (
          <OfferComparer applications={applications} />
        )}
      </main>

      {/* Application Add/Edit Modal */}
      {isModalOpen && (
        <JobModal
          key={editingApp ? editingApp.id : `new-${initialStageForModal}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveApplication}
          application={editingApp}
          initialStage={initialStageForModal}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmAction}
        onCancel={() => setConfirmState({ isOpen: false, type: '', id: null })}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
