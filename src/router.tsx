import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { ApplicationDialogsProvider } from '@/components/applications/ApplicationDialogs';
import { Spinner } from '@/components/ui';
import Landing from '@/pages/Landing';
import { ForgotPassword, Login, ResetPassword, Signup } from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Board = lazy(() => import('@/pages/Board'));
const Applications = lazy(() => import('@/pages/Applications'));
const ApplicationDetail = lazy(() => import('@/pages/ApplicationDetail'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Settings = lazy(() => import('@/pages/Settings'));

function FullPageSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner />
    </div>
  );
}

const page = (el: ReactNode) => <Suspense fallback={<FullPageSpinner />}>{el}</Suspense>;

function RequireAccess() {
  const { status, recovering } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (recovering) return <Navigate to="/reset-password" replace />;
  if (status === 'signed-out') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <ApplicationDialogsProvider>
      <AppShell />
    </ApplicationDialogsProvider>
  );
}

/** Auth pages bounce signed-in users straight to the app. */
function GuestOnly() {
  const { status, recovering } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;
  if (recovering) return <Navigate to="/reset-password" replace />;
  if (status === 'signed-in') return <Navigate to="/app" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },
  { path: '/reset-password', element: <ResetPassword /> },
  {
    path: '/app',
    element: <RequireAccess />,
    children: [
      { index: true, element: page(<Dashboard />) },
      { path: 'board', element: page(<Board />) },
      { path: 'applications', element: page(<Applications />) },
      { path: 'applications/:id', element: page(<ApplicationDetail />) },
      { path: 'calendar', element: page(<Calendar />) },
      { path: 'analytics', element: page(<Analytics />) },
      { path: 'archive', element: page(<Applications archived />) },
      { path: 'settings', element: page(<Settings />) },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
