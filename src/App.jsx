import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
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
import ArchivedModal from './components/ArchivedModal';
import Footer from './components/Footer';
import PendingAlertBanner from './components/PendingAlertBanner';
import { INITIAL_APPLICATIONS } from './data/mockData';
import { supabase } from './lib/supabaseClient';
import { getActiveUser, setActiveUserSession, signOutUser, onAuthStateChange } from './lib/authService';

const THEME_KEY = 'careertrack_theme_v1';

const META_TAG_START = '<!-- CT_META:';
const META_TAG_END = ':CT_META -->';

const serializeNotesWithMeta = (notesText, meta = {}) => {
  const cleanNotes = (notesText || '').replace(/<!-- CT_META:[\s\S]*?:CT_META -->/g, '').trim();
  const metaPayload = {
    currency: meta.currency || null,
    salaryPeriod: meta.salaryPeriod || null,
    hoursPerWeek: meta.hoursPerWeek || null,
    salaryBase: meta.salaryBase || null,
    salaryBonus: meta.salaryBonus || null,
    salaryStocks: meta.salaryStocks || null,
    salaryUndisclosed: Boolean(meta.salaryUndisclosed),
    resumeCuration: meta.resumeCuration || 'not_needed',
    archived: Boolean(meta.archived),
    archivedAt: meta.archivedAt || null,
    visaStatus: meta.visaStatus || null,
    timezoneShift: meta.timezoneShift || null,
    noticePeriod: meta.noticePeriod || null,
    noticeEndDate: meta.noticeEndDate || null,
    deadline: meta.deadline || null,
    plannedApplyDate: meta.plannedApplyDate || null,
    referralStatus: meta.referralStatus || 'none',
    referralContact: meta.referralContact || null,
    referralRole: meta.referralRole || null,
    referralLinkedin: meta.referralLinkedin || null,
    referralDate: meta.referralDate || null,
    referralNotes: meta.referralNotes || null
  };
  return cleanNotes
    ? `${cleanNotes}\n\n${META_TAG_START}${JSON.stringify(metaPayload)}${META_TAG_END}`
    : `${META_TAG_START}${JSON.stringify(metaPayload)}${META_TAG_END}`;
};

const parseNotesWithMeta = (notesText) => {
  if (!notesText || typeof notesText !== 'string') {
    return { cleanNotes: '', meta: {} };
  }
  const match = notesText.match(/<!-- CT_META:([\s\S]*?):CT_META -->/);
  if (!match) {
    return { cleanNotes: notesText, meta: {} };
  }
  try {
    const meta = JSON.parse(match[1]);
    const cleanNotes = notesText.replace(/<!-- CT_META:[\s\S]*?:CT_META -->/g, '').trim();
    return { cleanNotes, meta };
  } catch {
    return { cleanNotes: notesText, meta: {} };
  }
};

// Helpers to map between DB snake_case and UI camelCase
const mapToDb = (app, userOrId, fallbackEmail = null) => {
  const userId = typeof userOrId === 'object' ? userOrId?.id : userOrId;
  const userEmail = typeof userOrId === 'object' ? userOrId?.email : fallbackEmail;
  const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : null;

  return {
    id: app.id,
    user_id: userId || null,
    user_email: cleanEmail,
    company: app.company,
    title: app.title,
    location: app.location || '',
    work_type: app.workType || 'Remote',
    status: app.status,
    priority: app.priority || 'medium',
    salary_min: Number(app.salaryMin) || 0,
    salary_max: Number(app.salaryMax) || 0,
    salary_undisclosed: Boolean(app.salaryUndisclosed),
    resume_curation: app.resumeCuration || 'not_needed',
    archived: Boolean(app.archived),
    archived_at: app.archivedAt || null,
    currency: app.currency || 'INR',
    applied_date: app.appliedDate || (app.plannedApplyDate || new Date().toISOString().split('T')[0]),
    job_url: app.jobUrl || '',
    contact_name: app.contactName || '',
    contact_email: app.contactEmail || '',
    resume_version: app.resumeVersion || '',
    tags: app.tags || [],
    notes: serializeNotesWithMeta(app.notes, {
      currency: app.currency,
      salaryPeriod: app.salaryPeriod,
      hoursPerWeek: app.hoursPerWeek,
      salaryBase: app.salaryBase,
      salaryBonus: app.salaryBonus,
      salaryStocks: app.salaryStocks,
      salaryUndisclosed: app.salaryUndisclosed,
      resumeCuration: app.resumeCuration,
      archived: app.archived,
      archivedAt: app.archivedAt,
      visaStatus: app.visaStatus,
      timezoneShift: app.timezoneShift,
      noticePeriod: app.noticePeriod,
      noticeEndDate: app.noticeEndDate,
      deadline: app.deadline,
      plannedApplyDate: app.plannedApplyDate,
      referralStatus: app.referralStatus,
      referralContact: app.referralContact,
      referralRole: app.referralRole,
      referralLinkedin: app.referralLinkedin,
      referralDate: app.referralDate,
      referralNotes: app.referralNotes
    }),
    timeline: app.timeline || [],
    interviews: app.interviews || []
  };
};

const mapFromDb = (item) => {
  const { cleanNotes, meta } = parseNotesWithMeta(item.notes);
  const isIntern = (item.title || '').toLowerCase().includes('intern');
  return {
    id: item.id,
    company: item.company,
    title: item.title,
    location: item.location || '',
    workType: item.work_type || 'Remote',
    status: item.status || 'applied',
    priority: item.priority || 'medium',
    salaryMin: Number(item.salary_min) || 0,
    salaryMax: Number(item.salary_max) || 0,
    salaryUndisclosed: Boolean(item.salary_undisclosed ?? meta.salaryUndisclosed),
    resumeCuration: item.resume_curation || meta.resumeCuration || 'not_needed',
    archived: Boolean(item.archived ?? meta.archived),
    archivedAt: item.archived_at || meta.archivedAt || null,
    currency: item.currency || meta.currency || 'INR',
    salaryPeriod: item.salary_period || meta.salaryPeriod || (isIntern ? 'monthly' : 'yearly'),
    hoursPerWeek: Number(item.hours_per_week || meta.hoursPerWeek) || 40,
    salaryBase: Number(item.salary_base || meta.salaryBase) || 0,
    salaryBonus: Number(item.salary_bonus || meta.salaryBonus) || 0,
    salaryStocks: Number(item.salary_stocks || meta.salaryStocks) || 0,
    visaStatus: item.visa_status || meta.visaStatus || 'none',
    timezoneShift: item.timezone_shift || meta.timezoneShift || 'none',
    noticePeriod: item.notice_period || meta.noticePeriod || 'none',
    noticeEndDate: item.notice_end_date || meta.noticeEndDate || '',
    appliedDate: item.applied_date,
    plannedApplyDate: item.planned_apply_date || meta.plannedApplyDate || '',
    deadline: item.deadline || meta.deadline || '',
    referralStatus: item.referral_status || meta.referralStatus || 'none',
    referralContact: item.referral_contact || meta.referralContact || '',
    referralRole: item.referral_role || meta.referralRole || '',
    referralLinkedin: item.referral_linkedin || meta.referralLinkedin || '',
    referralDate: item.referral_date || meta.referralDate || '',
    referralNotes: meta.referralNotes || '',
    jobUrl: item.job_url || '',
    contactName: item.contact_name || '',
    contactEmail: item.contact_email || '',
    resumeVersion: item.resume_version || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    notes: cleanNotes,
    timeline: Array.isArray(item.timeline) ? item.timeline : [],
    interviews: Array.isArray(item.interviews) ? item.interviews : []
  };
};

const GUEST_USER = {
  id: 'guest',
  name: 'Guest User',
  email: '',
  isGuest: true,
  avatar: null
};

const getUserStorageKey = (u) => {
  if (u && !u.isGuest && u.email) return `careertrack_apps_${u.email.toLowerCase().trim()}`;
  if (u && !u.isGuest && u.id) return `careertrack_apps_${u.id}`;
  return 'careertrack_apps_guest_temp';
};

export default function App() {
  // User Auth State
  const [user, setUser] = useState(() => getActiveUser() || GUEST_USER);
  const prevUserRef = useRef(user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      return hash.includes('type=recovery') || search.includes('type=recovery');
    }
    return false;
  });

  // Load Applications from LocalStorage based on active user
  const [applications, setApplications] = useState(() => {
    try {
      const active = getActiveUser();
      if (!active || active.isGuest) {
        return INITIAL_APPLICATIONS;
      }
      const userKey = getUserStorageKey(active);
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);

      // Only default to initial applications if this is Anshul's main email
      if (active.email?.toLowerCase().trim() === 'anshulnimore.26@gmail.com') {
        const legacy = localStorage.getItem('careertrack_apps_v1') || localStorage.getItem('careertrack_apps_guest');
        if (legacy) return JSON.parse(legacy);
        return INITIAL_APPLICATIONS;
      }
      return [];
    } catch (e) {
      console.error('Failed to parse saved applications:', e);
      return [];
    }
  });

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark';
  });

  // Display Currency State ('INR' by default for Indian residents, or 'USD')
  const CURRENCY_KEY = 'careertrack_preferred_currency';
  const [displayCurrency, setDisplayCurrency] = useState(() => {
    return localStorage.getItem(CURRENCY_KEY) || 'INR';
  });

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, displayCurrency);
  }, [displayCurrency]);

  // UI View States
  const [activeView, setActiveView] = useState('kanban'); // 'kanban', 'table', 'analytics', 'calendar', 'comparer'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Toast States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [initialStageForModal, setInitialStageForModal] = useState('applied');
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Sync Auth State with authService & Supabase (Ensures persistence on Chrome restart)
  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      if (!isRecoveryMode) {
        setUser(currentUser);
      }
    });

    if (supabase) {
      // 1. Listen for Supabase auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryMode(true);
          setIsAuthModalOpen(true);
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && !isRecoveryMode) {
          if (session?.user) {
            const userObj = {
              id: session.user.id,
              email: session.user.email?.toLowerCase().trim(),
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.email || 'user')}`,
              authProvider: session.user.app_metadata?.provider || 'email',
              isCloud: true
            };
            setActiveUserSession(userObj);
            setUser(userObj);
          }
        } else if (event === 'SIGNED_OUT') {
          setActiveUserSession(null);
          setUser(GUEST_USER);
          setApplications(INITIAL_APPLICATIONS);
          setIsAuthModalOpen(true);
        }
      });

      // 2. Initial session check on load / restart
      supabase.auth.getSession().then(({ data: { session } }) => {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const isRec = hash.includes('type=recovery') || search.includes('type=recovery');
        if (isRec) {
          setIsRecoveryMode(true);
        } else if (session?.user) {
          const userObj = {
            id: session.user.id,
            email: session.user.email?.toLowerCase().trim(),
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.email || 'user')}`,
            authProvider: session.user.app_metadata?.provider || 'email',
            isCloud: true
          };
          setActiveUserSession(userObj);
          setUser(userObj);
        }
      });

      return () => {
        unsubscribe();
        subscription?.unsubscribe();
      };
    }

    return () => unsubscribe();
  }, [isRecoveryMode]);

  // Handle Sign Out cleanly
  const handleSignOut = async () => {
    await signOutUser();
    setActiveUserSession(null);
    setUser(GUEST_USER);
    setApplications(INITIAL_APPLICATIONS);
    setIsAuthModalOpen(true);
    showToast('Signed out successfully.', 'info');
  };

  const handleContinueAsGuest = () => {
    setUser(GUEST_USER);
    setApplications(INITIAL_APPLICATIONS);
    setIsAuthModalOpen(false);
    showToast('Browsing as Guest. Changes will NOT be saved to the cloud.', 'warning');
  };

  // When user signs in, changes, or signs out, switch to their personal isolated vault
  useEffect(() => {
    let isMounted = true;
    if (!user || user.isGuest) return;

    const userEmail = (user.email || '').toLowerCase().trim();
    const userKey = getUserStorageKey(user);

    const syncUserVault = async () => {
      // 1. Load user's local personal vault
      try {
        const localUserData = localStorage.getItem(userKey);
        if (localUserData && isMounted) {
          setApplications(JSON.parse(localUserData));
        } else if (isMounted) {
          // New user starts completely fresh with 0 applications
          setApplications([]);
        }
      } catch (e) {
        console.error('Failed to load user cache:', e);
      }

      // 2. Fetch latest records from Supabase cloud database
      if (supabase) {
        try {
          let cloudApps = [];
          if (userEmail) {
            const { data, error } = await supabase
              .from('applications')
              .select('*')
              .eq('user_email', userEmail)
              .order('applied_date', { ascending: false });

            if (!error && data && data.length > 0) {
              cloudApps = data.map(mapFromDb);
            }
          }

          // Fallback check by user_id if user_email query returned empty
          if (cloudApps.length === 0 && user.id) {
            const { data, error } = await supabase
              .from('applications')
              .select('*')
              .eq('user_id', user.id)
              .order('applied_date', { ascending: false });

            if (!error && data && data.length > 0) {
              cloudApps = data.map(mapFromDb);
              // Backfill user_email so future queries find them by email
              if (userEmail) {
                await supabase.from('applications').update({ user_email: userEmail }).eq('user_id', user.id);
              }
            }
          }

          // Legacy data auto-migration for Anshul (HPE intern, Stripe SDE intern, etc. from pre-auth local storage)
          if (userEmail === 'anshulnimore.26@gmail.com') {
            try {
              const legacyRaw = localStorage.getItem('careertrack_apps_v1');
              if (legacyRaw) {
                const legacyApps = JSON.parse(legacyRaw);
                if (Array.isArray(legacyApps) && legacyApps.length > 0) {
                  const existingKeys = new Set(cloudApps.map(a => `${(a.company || '').toLowerCase()}-${(a.title || '').toLowerCase()}`));
                  const toMigrate = legacyApps.filter(a => a && a.company && !existingKeys.has(`${(a.company || '').toLowerCase()}-${(a.title || '').toLowerCase()}`));
                  if (toMigrate.length > 0) {
                    for (const app of toMigrate) {
                      const dbPayload = mapToDb(app, user);
                      await supabase.from('applications').upsert(dbPayload);
                    }
                    cloudApps = [...toMigrate, ...cloudApps];
                  }
                }
                localStorage.removeItem('careertrack_apps_v1');
              }
            } catch (migErr) {
              console.warn('Legacy migration check notice:', migErr);
            }
          }

          if (isMounted) {
            setApplications(cloudApps);
            localStorage.setItem(userKey, JSON.stringify(cloudApps));
          }
        } catch (err) {
          console.warn('Supabase fetch error:', err);
        }
      }
    };

    syncUserVault();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Sync LocalStorage whenever applications change for active user
  useEffect(() => {
    if (!user || user.isGuest) return;
    if (prevUserRef.current?.email !== user.email) {
      prevUserRef.current = user;
      return;
    }
    try {
      const key = getUserStorageKey(user);
      localStorage.setItem(key, JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to save applications:', e);
    }
  }, [applications, user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Active vs Archived separation (Soft-delete ensures data is NEVER permanently lost)
  const activeApplications = useMemo(() => {
    return applications.filter(a => !a.archived);
  }, [applications]);

  const archivedApplications = useMemo(() => {
    return applications.filter(a => Boolean(a.archived));
  }, [applications]);

  // Filter applications by search query on ACTIVE items
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return activeApplications;
    const q = searchQuery.toLowerCase();
    return activeApplications.filter(app => 
      app.company.toLowerCase().includes(q) ||
      app.title.toLowerCase().includes(q) ||
      (app.location && app.location.toLowerCase().includes(q)) ||
      (app.notes && app.notes.toLowerCase().includes(q)) ||
      (app.tags && app.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [activeApplications, searchQuery]);

  // CRUD Actions
  const handleSaveApplication = async (appData) => {
    setApplications(prev => {
      const exists = prev.some(a => a.id === appData.id);
      const next = exists
        ? prev.map(a => a.id === appData.id ? appData : a)
        : [appData, ...prev];

      if (user && !user.isGuest) {
        try {
          localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
        } catch (e) {
          console.error('Local cache error:', e);
        }
      }

      showToast(
        user?.isGuest
          ? `${exists ? 'Updated' : 'Added'} ${appData.company} (Guest Mode - Not saved to cloud)`
          : `${exists ? 'Updated' : 'Added'} application for ${appData.company}`
      );
      return next;
    });

    if (user && !user.isGuest && supabase) {
      try {
        const { error } = await supabase.from('applications').upsert(mapToDb(appData, user));
        if (error) throw error;
      } catch (err) {
        console.error('Supabase save error:', err);
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const targetApp = applications.find(a => a.id === id);
    const nowIso = new Date().toISOString();
    const updatedTimeline = [
      ...(targetApp?.timeline || []),
      {
        id: 't-' + Date.now(),
        stage: `Moved to ${newStatus}`,
        date: nowIso.split('T')[0],
        notes: `Status updated via board/table.`
      }
    ];

    setApplications(prev => {
      const next = prev.map(app => app.id === id ? { ...app, status: newStatus, timeline: updatedTimeline } : app);
      if (user && !user.isGuest) {
        try {
          localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
        } catch (e) {
          console.error('Local cache error:', e);
        }
      }
      return next;
    });
    showToast(`Status updated!`);

    if (user && !user.isGuest && supabase && id) {
      try {
        const { error } = await supabase
          .from('applications')
          .update({
            status: newStatus,
            timeline: updatedTimeline,
            updated_at: nowIso
          })
          .eq('id', id);
        if (error) console.error('Supabase update status error:', error);
      } catch (err) {
        console.error('Supabase update status error:', err);
      }
    }
  };

  // Soft-delete: Move to Archive so data is NEVER permanently deleted
  const handleDeleteApplication = (id) => {
    const target = applications.find(a => a.id === id);
    setConfirmState({
      isOpen: true,
      type: 'archive_one',
      id,
      title: 'Move to Archive?',
      message: `Are you sure you want to archive "${target?.company || 'this application'}"? It will be safely kept in your Archive section and can be restored back to your active board at any time.`
    });
  };

  const handleBulkDelete = (ids) => {
    setConfirmState({
      isOpen: true,
      type: 'archive_bulk',
      id: ids,
      title: `Archive ${ids.length} Applications?`,
      message: `Are you sure you want to move ${ids.length} applications to your Archive? They will be safely stored and can be restored anytime.`
    });
  };

  const handleBulkStatusUpdate = async (ids, newStatus) => {
    setApplications(prev => {
      const next = prev.map(a => ids.includes(a.id) ? { ...a, status: newStatus } : a);
      if (user && !user.isGuest) {
        try {
          localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
        } catch (e) {
          console.error('Local cache error:', e);
        }
      }
      return next;
    });
    showToast(`Updated status for ${ids.length} applications.`);

    if (user && !user.isGuest && supabase && ids.length > 0) {
      try {
        const { error } = await supabase.from('applications').update({ status: newStatus }).in('id', ids);
        if (error) console.error('Supabase bulk status error:', error);
      } catch (err) {
        console.error('Supabase bulk status error:', err);
      }
    }
  };

  // Restore archived application back to board
  const handleRestoreApplication = async (id) => {
    setApplications(prev => {
      const next = prev.map(a => a.id === id ? { ...a, archived: false, archivedAt: null } : a);
      if (user && !user.isGuest) {
        try {
          localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
        } catch (e) {
          console.error('Local cache error:', e);
        }
      }
      return next;
    });
    showToast('Application restored back to board!');

    if (user && !user.isGuest && supabase && id) {
      try {
        const { error } = await supabase
          .from('applications')
          .update({
            archived: false,
            archived_at: null
          })
          .eq('id', id);
        if (error) console.error('Supabase restore error:', error);
      } catch (err) {
        console.warn('Supabase restore sync error:', err);
      }
    }
  };

  // Restore all archived applications
  const handleRestoreAllArchived = async () => {
    const archivedIds = applications.filter(a => a.archived).map(a => a.id);
    setApplications(prev => {
      const next = prev.map(a => a.archived ? { ...a, archived: false, archivedAt: null } : a);
      if (user && !user.isGuest) {
        try {
          localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
        } catch (e) {
          console.error('Local cache error:', e);
        }
      }
      return next;
    });
    showToast('All archived applications restored back to active board!');

    if (user && !user.isGuest && supabase && archivedIds.length > 0) {
      try {
        const { error } = await supabase
          .from('applications')
          .update({
            archived: false,
            archived_at: null
          })
          .in('id', archivedIds);
        if (error) console.error('Supabase restore all error:', error);
      } catch (err) {
        console.warn('Supabase restore all sync error:', err);
      }
    }
  };

  const confirmAction = async () => {
    const now = new Date().toISOString();

    if (confirmState.type === 'archive_one' || confirmState.type === 'delete_one') {
      const targetId = confirmState.id;
      setApplications(prev => {
        const next = prev.map(a => a.id === targetId ? { ...a, archived: true, archivedAt: now } : a);
        if (user && !user.isGuest) {
          try {
            localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
          } catch (e) {
            console.error('Local cache error:', e);
          }
        }
        return next;
      });
      showToast('Application moved to Archive.');

      if (user && !user.isGuest && supabase && targetId) {
        try {
          const { error } = await supabase
            .from('applications')
            .update({
              archived: true,
              archived_at: now
            })
            .eq('id', targetId);
          if (error) console.error('Supabase archive error:', error);
        } catch (err) {
          console.warn('Supabase archive sync error:', err);
        }
      }
    } else if (confirmState.type === 'archive_bulk' || confirmState.type === 'delete_bulk') {
      const ids = Array.isArray(confirmState.id) ? confirmState.id : [confirmState.id];
      setApplications(prev => {
        const next = prev.map(a => ids.includes(a.id) ? { ...a, archived: true, archivedAt: now } : a);
        if (user && !user.isGuest) {
          try {
            localStorage.setItem(getUserStorageKey(user), JSON.stringify(next));
          } catch (e) {
            console.error('Local cache error:', e);
          }
        }
        return next;
      });
      showToast(`${ids.length} applications moved to Archive.`);

      if (user && !user.isGuest && supabase && ids.length > 0) {
        try {
          const { error } = await supabase
            .from('applications')
            .update({
              archived: true,
              archived_at: now
            })
            .in('id', ids);
          if (error) console.error('Supabase bulk archive error:', error);
        } catch (err) {
          console.warn('Supabase bulk archive sync error:', err);
        }
      }
    } else if (confirmState.type === 'reset') {
      setApplications(INITIAL_APPLICATIONS);
      if (user && !user.isGuest) {
        localStorage.removeItem(getUserStorageKey(user));
      }
      showToast('Reset sample data to initial state.', 'info');
    }
    setConfirmState({ isOpen: false, type: '', id: null, title: '', message: '' });
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

    if (user && !user.isGuest && supabase) {
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

    if (user && !user.isGuest && supabase) {
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

  // If in recovery mode, render the dedicated Password Reset Gate
  if (isRecoveryMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <AuthModal
          isGate={true}
          isOpen={true}
          isRecoveryMode={true}
          onClose={() => setIsRecoveryMode(false)}
          onContinueAsGuest={handleContinueAsGuest}
          onAuthSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setIsRecoveryMode(false);
            setIsAuthModalOpen(false);
          }}
          showToast={showToast}
          user={user}
          onSignOut={handleSignOut}
          applicationsCount={0}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
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
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        archivedCount={archivedApplications.length}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        displayCurrency={displayCurrency}
        setDisplayCurrency={setDisplayCurrency}
        allApplications={applications}
        onSelectApp={handleOpenEditModal}
      />

      {/* Guest Mode Warning Banner */}
      {user?.isGuest && (
        <div
          className="animate-fade-in"
          style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.12))',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Guest Mode — Data Will Not Be Saved
                <span
                  className="badge"
                  style={{
                    background: 'rgba(245, 158, 11, 0.25)',
                    color: '#F59E0B',
                    fontSize: '0.7rem',
                    padding: '2px 8px'
                  }}
                >
                  Unsaved Session
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                You are browsing without an account. Any job applications, edits, or changes made in this session are temporary and will NOT be saved to the cloud.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                fontSize: '0.825rem',
                fontWeight: 600,
                padding: '8px 16px',
                gap: '6px'
              }}
            >
              <LogIn size={15} />
              Sign In to Save Data
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Stats Bar */}
      <StatsOverview
        applications={activeApplications}
        displayCurrency={displayCurrency}
        onToggleCurrency={setDisplayCurrency}
      />

      {/* Smart Alert & Warning Indication for Applications Pending to Apply */}
      <PendingAlertBanner
        applications={activeApplications}
        onSelectApp={handleOpenEditModal}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Views Container */}
      <main className="animate-fade-in" style={{ flex: 1 }}>
        {activeView === 'kanban' && (
          <KanbanBoard
            applications={filteredApplications}
            onSelectApp={handleOpenEditModal}
            onUpdateStatus={handleUpdateStatus}
            onDeleteApp={handleDeleteApplication}
            onOpenAddModalWithStage={handleOpenAddModal}
            displayCurrency={displayCurrency}
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
            displayCurrency={displayCurrency}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            applications={activeApplications}
            displayCurrency={displayCurrency}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            applications={activeApplications}
            onSelectApp={handleOpenEditModal}
            onToggleInterviewComplete={handleToggleInterviewComplete}
            onAddInterview={handleAddInterview}
          />
        )}

        {activeView === 'comparer' && (
          <OfferComparer
            applications={activeApplications}
            displayCurrency={displayCurrency}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Application Add/Edit Modal */}
      {isModalOpen && (
        <JobModal
          key={editingApp ? editingApp.id : `new-${initialStageForModal}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveApplication}
          application={editingApp}
          initialStage={initialStageForModal}
          displayCurrency={displayCurrency}
        />
      )}

      {/* Archived Applications Modal (Soft-deleted job applications) */}
      <ArchivedModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedApps={archivedApplications}
        onRestore={handleRestoreApplication}
        onRestoreAll={handleRestoreAllArchived}
        displayCurrency={displayCurrency}
      />

      {/* Clean Consumer Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        isRecoveryMode={isRecoveryMode}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsRecoveryMode(false);
        }}
        onContinueAsGuest={handleContinueAsGuest}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsRecoveryMode(false);
          setIsAuthModalOpen(false);
        }}
        showToast={showToast}
        user={user}
        onSignOut={handleSignOut}
        applicationsCount={activeApplications.length}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmAction}
        onCancel={() => setConfirmState({ isOpen: false, type: '', id: null, title: '', message: '' })}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
