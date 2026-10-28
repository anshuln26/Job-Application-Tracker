import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/auth/AuthProvider';
import { applyTheme, usePreferences } from '@/hooks/usePreferences';
import { router } from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 } },
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  try {
    applyTheme((localStorage.getItem('applytrack:theme') as 'light' | 'dark' | 'system') || 'system');
  } catch {
    applyTheme('system');
  }
});

function ThemedToaster() {
  const { theme } = usePreferences();
  return <Toaster position="bottom-right" theme={theme} richColors closeButton />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ThemedToaster />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
