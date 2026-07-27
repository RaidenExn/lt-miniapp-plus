import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useThemeStore, getMantineTheme } from './theme'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

// High-density uniform width & smooth right-aligned new UI toast notification overrides
const styleEl = document.createElement('style')
styleEl.innerHTML = `
  .mantine-Notifications-root,
  .mantine-Notifications-container,
  .mantine-Notifications-list {
    pointer-events: none !important;
    right: 16px !important;
    bottom: 16px !important;
    width: 350px !important;
    max-width: calc(100vw - 32px) !important;
    box-sizing: border-box !important;
    z-index: 9999 !important;
  }
  .mantine-Notification-root {
    pointer-events: auto !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 10px 14px !important;
    border-radius: var(--mantine-radius-md) !important;
    border: 1px solid var(--mantine-color-border) !important;
    background-color: var(--mantine-color-body) !important;
    box-shadow: var(--mantine-shadow-md) !important;
    backdrop-filter: blur(12px) !important;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
  }
  .mantine-Notification-title {
    font-size: 12px !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
  }
  .mantine-Notification-description {
    font-size: 11.5px !important;
    line-height: 1.35 !important;
  }
  .mantine-Notification-icon {
    display: none !important;
  }
`
document.head.appendChild(styleEl)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
})

function AppProvider() {
  const primaryColor = useThemeStore((state) => state.primaryColor)
  const radius = useThemeStore((state) => state.radius)
  const fontSize = useThemeStore((state) => state.fontSize)
  const density = useThemeStore((state) => state.density)

  const dynamicTheme = useMemo(
    () => getMantineTheme({ primaryColor, radius, fontSize, density }),
    [primaryColor, radius, fontSize, density]
  )

  return (
    <MantineProvider theme={dynamicTheme} defaultColorScheme="auto">
      <Notifications position="bottom-right" zIndex={1000} limit={3} />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MantineProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider />
    </QueryClientProvider>
  </React.StrictMode>
)
