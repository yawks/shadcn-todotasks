import './index.css'

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { AxiosError } from 'axios'
import { ConnectionStatus } from '@/components/connection-status'
import { FontProvider } from './context/font-context'
import { FontSizeProvider } from './context/font-size-context'
import { InstallPWA } from '@/components/install-pwa'
import { PWAPrompt } from '@/components/pwa-prompt'
import ReactDOM from 'react-dom/client'
import { StrictMode, Suspense } from 'react'
import { ThemeProvider } from './context/theme-context'
import { handleServerError } from '@/utils/handle-server-error'
// Generated Routes
import { routeTree } from './routeTree.gen'
import { toast } from 'sonner'
import { useAuth } from './utils/auth'
import { useAuthStore } from '@/stores/authStore'
import './i18n';
import './styles/tiptap.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast.error('Session expired!')
          useAuthStore.getState().auth.reset()
          const redirect = `${router.history.location.href}`
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          router.navigate({ to: '/500' })
        }
        if (error.response?.status === 403) {
          router.navigate({ to: '/403' })
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    authentication: undefined!
  },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
          <FontProvider>
            <FontSizeProvider>
              {(() => {
                const authentication = useAuth();
                return (
                  <>
                    <Suspense fallback="loading">
                      <PWAPrompt />
                      <InstallPWA />
                      <ConnectionStatus />
                      <RouterProvider router={router} context={{ authentication }} />
                    </Suspense>
                  </>
                );
              })()}
            </FontSizeProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
