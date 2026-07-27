import { logDbService } from './LogDbService'

export type LogCategory = 'HTTP' | 'UI' | 'DB' | 'INFO' | 'WARN' | 'ERROR'

export interface LogEntry {
  id: string
  timestamp: string
  category: LogCategory
  message: string
  details?: string
}

type LogListener = (logs: LogEntry[]) => void

class LoggerService {
  private logs: LogEntry[] = []
  private pendingBuffer: LogEntry[] = []
  private listeners = new Set<LogListener>()
  private maxLogs = 200
  private initialized = false
  private flushTimer: any = null
  private reqSequence = 100

  async init() {
    if (this.initialized) return
    this.initialized = true

    this.setupFetchInterceptor()
    this.setupEventInterceptor()
    this.setupConsoleInterceptor()

    try {
      const restored = await logDbService.getAllLogs()
      if (restored && restored.length > 0) {
        this.logs = restored.reverse().slice(0, this.maxLogs)
      }
    } catch {
      /* ignore restore error */
    }

    this.log('INFO', 'Logger initialized. Live tracing active.')

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush())
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  async getStorageBytes(): Promise<number> {
    return await logDbService.getStorageSize()
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener)
    listener(this.getLogs())
    return () => this.listeners.delete(listener)
  }

  async clear() {
    this.logs = []
    this.pendingBuffer = []
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    await logDbService.clearAll()
    this.notify()
  }

  log(category: LogCategory, message: string, details?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }),
      category,
      message,
      details
    }

    this.logs.unshift(entry)
    if (this.logs.length > this.maxLogs) this.logs.length = this.maxLogs

    this.pendingBuffer.push(entry)
    this.scheduleFlush()
    this.notify()
  }

  info(objOrMsg: any, msg?: string) {
    this.pinoLog('INFO', objOrMsg, msg)
  }

  warn(objOrMsg: any, msg?: string) {
    this.pinoLog('WARN', objOrMsg, msg)
  }

  error(objOrMsg: any, msg?: string) {
    this.pinoLog('ERROR', objOrMsg, msg)
  }

  debug(objOrMsg: any, msg?: string) {
    this.pinoLog('INFO', objOrMsg, msg)
  }

  http(objOrMsg: any, msg?: string) {
    this.pinoLog('HTTP', objOrMsg, msg)
  }

  child(bindings: Record<string, any>) {
    const prefix = bindings?.module ? `[${bindings.module}] ` : ''
    return {
      info: (obj: any, msg?: string) => this.pinoLog('INFO', obj, msg, prefix),
      warn: (obj: any, msg?: string) => this.pinoLog('WARN', obj, msg, prefix),
      error: (obj: any, msg?: string) => this.pinoLog('ERROR', obj, msg, prefix),
      debug: (obj: any, msg?: string) => this.pinoLog('INFO', obj, msg, prefix),
      http: (obj: any, msg?: string) => this.pinoLog('HTTP', obj, msg, prefix)
    }
  }

  private pinoLog(category: LogCategory, objOrMsg: any, msg?: string, prefix = '') {
    if (typeof objOrMsg === 'string') {
      this.log(category, `${prefix}${objOrMsg}`)
    } else if (objOrMsg && typeof objOrMsg === 'object') {
      const mainMsg = `${prefix}${msg || ''}`.trim() || 'Log Entry'
      const details = JSON.stringify(objOrMsg)
      this.log(category, mainMsg, details)
    } else {
      this.log(category, `${prefix}${String(objOrMsg)}`)
    }
  }

  private scheduleFlush() {
    if (this.pendingBuffer.length >= 15) {
      this.flush()
      return
    }
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 2000)
    }
  }

  private async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    if (this.pendingBuffer.length === 0) return
    const chunk = [...this.pendingBuffer]
    this.pendingBuffer = []
    await logDbService.saveChunk(chunk)
  }

  exportLogs() {
    const allLogs = [...this.logs].reverse()
    const exportTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0'

    const header = [
      '================================================================================',
      'LT-MINI CLINICAL PORTAL SYSTEM LOG EXPORT',
      `App Name    : lt-mini (Lifetrenz Local Portal)`,
      `App Version : v${appVersion}`,
      `User Agent  : ${navigator.userAgent}`,
      `Export Time : ${exportTime}`,
      `Total Logs  : ${allLogs.length} entries`,
      '================================================================================',
      ''
    ].join('\n')

    const lines = allLogs.map(
      (log) => `[${log.timestamp}] [${log.category.padEnd(5)}] ${log.message}${log.details ? ` (${log.details})` : ''}`
    )
    const fileContent = header + '\n' + lines.join('\n')
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const dateSlug = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
    const a = document.createElement('a')
    a.href = url
    a.download = `lt-mini-logs-${dateSlug}.log`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private notify() {
    if (this.listeners.size === 0) return
    const current = this.getLogs()
    this.listeners.forEach((l) => l(current))
  }

  private setupEventInterceptor() {
    if (typeof window === 'undefined') return

    const getLabel = (el: Element): string => {
      return (
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.getAttribute('data-tab') ||
        el.getAttribute('placeholder') ||
        (el.childElementCount <= 3 ? el.textContent?.trim() : null) ||
        el.tagName.toLowerCase()
      )
    }

    window.addEventListener(
      'click',
      (e) => {
        const target = e.target as Element | null
        if (!target || target.closest('[data-log-stream="true"], [data-log-viewer="true"]')) return
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], [data-tab]')
        if (interactive) {
          this.log('UI', `Clicked: "${getLabel(interactive)}"`, `<${interactive.tagName.toLowerCase()}>`)
        }
      },
      { capture: true, passive: true }
    )

    window.addEventListener(
      'change',
      (e) => {
        const target = e.target as Element | null
        if (!target || target.closest('[data-log-stream="true"], [data-log-viewer="true"]')) return
        const interactive = target.closest('input, select')
        if (interactive) {
          const val = (interactive as HTMLInputElement).value
          this.log('UI', `Changed: "${getLabel(interactive)}"`, `value="${val}"`)
        }
      },
      { capture: true, passive: true }
    )

    window.addEventListener(
      'keydown',
      (e) => {
        if ((e as KeyboardEvent).key !== 'Enter') return
        const target = e.target as Element | null
        if (!target || target.closest('[data-log-stream="true"], [data-log-viewer="true"]')) return
        const interactive = target.closest('input, textarea, button')
        if (interactive) {
          this.log('UI', `Submit: "${getLabel(interactive)}"`)
        }
      },
      { capture: true, passive: true }
    )
  }

  private setupFetchInterceptor() {
    if (typeof window === 'undefined' || !window.fetch) return
    const originalFetch = window.fetch
    const self = this

    window.fetch = async function (...args) {
      const startTime = performance.now()
      let method = 'GET'
      let url = 'unknown'
      let requestBody: any = null

      try {
        if (typeof args[0] === 'string') {
          url = args[0]
          if (args[1]?.method) method = args[1].method.toUpperCase()
          if (args[1]?.body) requestBody = args[1].body
        } else if (args[0] && typeof args[0] === 'object') {
          const req = args[0] as Request
          url = req.url || 'unknown'
          method = req.method ? req.method.toUpperCase() : 'GET'
          requestBody = args[1]?.body
        }
      } catch {
        /* ignore parse error */
      }

      const seq = ++self.reqSequence
      const displayUrl = url.includes('/app.php') ? `...${url.substring(url.indexOf('/app.php') + 8)}` : url.slice(-40)

      self.log('HTTP', `REQ #${seq} → ${method} ${displayUrl}`, `FULL: ${url}`)

      if (requestBody) {
        try {
          const payloadStr = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
          if (payloadStr) self.log('HTTP', ` └ #${seq} RAW DATA: ${payloadStr}`)
        } catch {
          /* ignore body stringify error */
        }
      }

      try {
        const response = await originalFetch.apply(this, args)
        const duration = Math.round(performance.now() - startTime)
        const contentLength = response.headers.get('content-length')
        const sizeTag = contentLength ? ` | ${Math.round(parseInt(contentLength, 10) / 1024)} KB` : ''

        self.log(
          response.status >= 400 ? 'ERROR' : 'HTTP',
          `RES #${seq} ← ${method} ${displayUrl}`,
          `${response.status} ${response.statusText} (${duration}ms)${sizeTag}`
        )
        return response
      } catch (err: any) {
        const duration = Math.round(performance.now() - startTime)
        self.log(
          'ERROR',
          `RES #${seq} ✖ ${method} ${displayUrl}`,
          `Failed (${duration}ms): ${err.message || 'Network Error'}`
        )
        throw err
      }
    }
  }

  private setupConsoleInterceptor() {
    if (typeof window === 'undefined') return
    const origWarn = console.warn
    const origError = console.error

    console.warn = (...args: any[]) => {
      origWarn.apply(console, args)
      this.log('WARN', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
    }

    console.error = (...args: any[]) => {
      origError.apply(console, args)
      this.log('ERROR', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '))
    }
  }
}

export const loggerService = new LoggerService()

export const logger = {
  info: (obj: any, msg?: string) => loggerService.info(obj, msg),
  warn: (obj: any, msg?: string) => loggerService.warn(obj, msg),
  error: (obj: any, msg?: string) => loggerService.error(obj, msg),
  debug: (obj: any, msg?: string) => loggerService.debug(obj, msg),
  http: (obj: any, msg?: string) => loggerService.http(obj, msg),
  child: (bindings: Record<string, any>) => loggerService.child(bindings)
}
