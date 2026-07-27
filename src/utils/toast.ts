import React from 'react'
import { notifications } from '@mantine/notifications'

export type ToastTone = 'ok' | 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastOptions {
  id?: string
  title?: string
  message: string
  tone?: ToastTone
  duration?: number
  autoClose?: boolean | number
}

const activeIds = new Set<string>()

export function showToast(options: ToastOptions | string, toneOverride?: ToastTone) {
  let id = ''
  let title: string | undefined
  let message = ''
  let tone: ToastTone = 'info'
  let autoClose: boolean | number = 4000

  if (typeof options === 'string') {
    message = options
    if (toneOverride) tone = toneOverride
    id = `${Date.now()}-${Math.random()}`
  } else {
    id = options.id || `${Date.now()}-${Math.random()}`
    title = options.title
    message = options.message
    tone = options.tone || toneOverride || 'info'
    if (options.autoClose !== undefined) {
      autoClose = options.autoClose
    } else if (options.duration !== undefined) {
      autoClose = options.duration
    }
  }

  // Map tone to native Mantine colors
  let color = 'blue'
  let isLoading = false

  switch (tone) {
    case 'ok':
    case 'success':
      color = 'teal'
      break
    case 'error':
      color = 'red'
      autoClose = autoClose === 4000 ? 5000 : autoClose
      break
    case 'warning':
      color = 'orange'
      break
    case 'info':
      color = 'blue'
      break
    case 'loading':
      color = 'blue'
      isLoading = true
      autoClose = false
      break
  }

  const renderedMessage = React.createElement(
    'div',
    {
      style: {
        whiteSpace: 'pre-wrap',
        lineHeight: '1.35',
        fontSize: 'var(--mantine-font-size-xs)',
        fontWeight: 500
      }
    },
    message
  )

  const isExisting = activeIds.has(id)
  const toastPayload = {
    id,
    title,
    message: renderedMessage,
    color,
    loading: isLoading,
    autoClose,
    onClose: () => {
      activeIds.delete(id)
    }
  }

  if (isExisting) {
    notifications.update(toastPayload)
  } else {
    activeIds.add(id)
    notifications.show(toastPayload)
  }
}

export function hideToast(id: string) {
  notifications.hide(id)
  activeIds.delete(id)
}

export function cleanToasts() {
  notifications.clean()
  activeIds.clear()
}
