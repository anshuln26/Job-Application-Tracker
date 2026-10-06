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
import AuthModal from './components/AuthModal';
import { INITIAL_APPLICATIONS } from './data/mockData';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

const LOCAL_STORAGE_KEY = 'careertrack_apps_v1';
const THEME_KEY = 'careertrack_theme_v1';

// Helpers to map between DB snake_case and UI camelCase
const mapToDb = (app, userId) => ({
  id: app.id,
  user_id: userId,
  company: app.company,
  title: app.title,
  location: app.location || '',
  work_type: app.workType || 'Remote',
  status: app.status,
  priority: app.priority || 'medium',
  salary_min: Number(app.salaryMin) || 0,
  salary_max: Number(app.salaryMax) || 0,
  currency: app.currency || '$',
  applied_date: app.appliedDate || new Date().toISOString().split('T')[0],
  job_url: app.jobUrl || '',
  contact_name: app.contactName || '',
  contact_email: app.contactEmail || '',
  resume_version: app.resumeVersion || '',
  tags: app.tags || [],
  notes: app.notes || '',
  timeline: app.timeline || [],
  interviews: app.interviews || []
});

const mapFromDb = (item) => ({
  id: item.id,
  company: item.company,
  title: item.title,
  location: item.location || '',
  workType: item.work_type || 'Remote',
  status: item.status || 'applied',
  priority: item.priority || 'medium',
  salaryMin: Number(item.salary_min) || 0,
  salaryMax: Number(item.salary_max) || 0,
  currency: item.currency || '$',
  appliedDate: item.applied_date,
  jobUrl: item.job_url || '',
  contactName: item.contact_name || '',
  contactEmail: item.contact_email || '',
  resumeVersion: item.resume_version || '',
  tags: Array.isArray(item.tags) ? item.tags : [],
  notes: item.notes || '',
  timeline: Array.isArray(item.timeline) ? item.timeline : [],
  interviews: Array.isArray(item.interviews) ? item.interviews : []
});

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

  // User Auth State
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // UI View States
  const [activeView, setActiveView] = useState('kanban'); // 'kanban', 'table', 'analytics', 'calendar', 'comparer'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Toast States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [initialStageForModal, setInitialStageForModal] = useState('applied');
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', id: null });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Sync Auth State
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch from Supabase when user logs in
  useEffect(() => {
    if (!user || !supabase) return;

    const fetchSupabaseApps = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .order('applied_date', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setApplications(data.map(mapFromDb));
        } else {
          // If first-time user has no cloud applications, sync initial/local items
          const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
          const initialLocal = localSaved ? JSON.parse(localSaved) : [];
          if (initialLocal.length > 0) {
            const rowsToInsert = initialLocal.map(a => mapToDb(a, user.id));
            await supabase.from('applications').upsert(rowsToInsert);
            setApplications(initialLocal);
            showToast('Synchronized local job data to your Supabase cloud account!');
          }
        }
      } catch (err) {
        console.error('Failed to fetch from Supabase:', err);
        showToast('Could not load cloud applications. Using local storage.', 'error');
      }
    };

    fetchSupabaseApps();
  }, [user]);

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
  const handleSaveApplication = async (appData) => {
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

    if (user && supabase) {
      try {
        const { error } = await supabase.from('applications').upsert(mapToDb(appData, user.id));
        if (error) throw error;
      } catch (err) {
        console.error('Supabase save error:', err);
        showToast('Saved locally, but cloud sync failed.', 'error');
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    let updatedTimeline = [];
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        updatedTimeline = [
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

    if (user && supabase) {
      try {
        await supabase
          .from('applications')
          .update({
            status: newStatus,
            timeline: updatedTimeline,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      } catch (err) {
        console.error('Supabase update status error:', err);
      }
    }
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

  const handleBulkStatusUpdate = async (ids, newStatus) => {
    setApplications(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: newStatus } : a));
    showToast(`Updated status for ${ids.length} applications.`);

    if (user && supabase) {
      try {
        await supabase.from('applications').update({ status: newStatus }).in('id', ids);
      } catch (err) {
        console.error('Supabase bulk status error:', err);
      }
    }
  };

  const confirmAction = async () => {
    if (confirmState.type === 'delete_one') {
      setApplications(prev => prev.filter(a => a.id !== confirmState.id));
      showToast('Application deleted.', 'info');
      if (user && supabase) {
        await supabase.from('applications').delete().eq('id', confirmState.id);
      }
    } else if (confirmState.type === 'delete_bulk') {
      setApplications(prev => prev.filter(a => !confirmState.id.includes(a.id)));
      showToast(`${confirmState.id.length} applications deleted.`, 'info');
      if (user && supabase) {
        await supabase.from('applications').delete().in('id', confirmState.id);
      }
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

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      showToast('Signed out of Supabase Cloud.');
    }
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
  const handleToggleInterviewComplete = async (appId, interviewId) => {
    let updatedInterviews = [];
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        updatedInterviews = (app.interviews || []).map(i => 
          i.id === interviewId ? { ...i, completed: !i.completed } : i
        );
        return { ...app, interviews: updatedInterviews };
      }
      return app;
    }));
    showToast('Interview schedule updated!');

    if (user && supabase) {
      try {
        await supabase.from('applications').update({ interviews: updatedInterviews }).eq('id', appId);
      } catch (err) {
        console.error('Supabase interview update error:', err);
      }
    }
  };

  const handleAddInterview = async (appId, newInterview) => {
    let updatedInterviews = [];
    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        updatedInterviews = [...(app.interviews || []), newInterview];
        return { ...app, interviews: updatedInterviews };
      }
      return app;
    }));
    showToast('Interview added to schedule!');

    if (user && supabase) {
      try {
        await supabase.from('applications').update({ interviews: updatedInterviews }).eq('id', appId);
      } catch (err) {
        console.error('Supabase add interview error:', err);
      }
    }
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
        user={user}
        isConfigured={isSupabaseConfigured()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
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

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsAuthModalOpen(false);
        }}
        showToast={showToast}
      />

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
