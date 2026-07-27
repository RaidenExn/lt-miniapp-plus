import { create } from 'zustand'
import { dbService, CacheMetadata } from '../services/BrowserDbService'

const TAB_SUFFIXES = ['/overview', '/activities', '/logs']

export const getTabFromUrl = (): string => {
  if (typeof window === 'undefined') return 'overview'
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase().replace('#', '')

  if (path.endsWith('/activities') || hash === 'activities') return 'activities'
  if (path.endsWith('/logs') || hash === 'logs') return 'logs'
  if (path.endsWith('/overview') || hash === 'overview') return 'overview'

  return 'overview'
}

export const updateUrlForTab = (tab: string) => {
  if (typeof window === 'undefined') return
  const currentPath = window.location.pathname

  let basePath = currentPath
  TAB_SUFFIXES.forEach((suffix) => {
    if (basePath.toLowerCase().endsWith(suffix)) {
      basePath = basePath.slice(0, -suffix.length)
    }
  })

  if (basePath === '/' || basePath === '') {
    basePath = '/'
  } else if (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1)
  }

  const newPath = basePath === '/' ? `/${tab}` : `${basePath}/${tab}`

  if (window.location.pathname !== newPath) {
    window.history.pushState({ tab }, '', newPath + window.location.search + window.location.hash)
  }
}

interface AppState {
  searchQuery: string
  popoverOpened: boolean
  showSettings: boolean
  activeTab: string
  cachedList: CacheMetadata[]
  setSearchQuery: (query: string) => void
  setPopoverOpened: (opened: boolean) => void
  setShowSettings: (opened: boolean) => void
  setActiveTab: (tab: string, skipUrlUpdate?: boolean) => void
  loadCachedList: () => Promise<void>
  removeCachedItem: (encounterNo: string) => Promise<void>
  clearAllCache: () => Promise<void>
}

export const useAppStore = create<AppState>((set: any, get: any) => ({
  searchQuery: '',
  popoverOpened: false,
  showSettings: false,
  activeTab: getTabFromUrl(),
  cachedList: [],

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setPopoverOpened: (opened: boolean) => set({ popoverOpened: opened }),
  setShowSettings: (opened: boolean) => set({ showSettings: opened }),
  setActiveTab: (tab: string, skipUrlUpdate = false) => {
    if (!skipUrlUpdate) {
      updateUrlForTab(tab)
    }
    set({ activeTab: tab })
  },

  loadCachedList: async () => {
    try {
      const list = await dbService.listCached()
      set({ cachedList: list })
    } catch (err: any) {
      console.error('[useAppStore] Error loading cached list:', err.message)
    }
  },

  removeCachedItem: async (encounterNo: string) => {
    try {
      await dbService.removeEncounter(encounterNo)
      await get().loadCachedList()
    } catch (err: any) {
      console.error('[useAppStore] Error removing cached item:', err.message)
    }
  },

  clearAllCache: async () => {
    try {
      await dbService.clearAll()
      await get().loadCachedList()
    } catch (err: any) {
      console.error('[useAppStore] Error clearing all cache:', err.message)
    }
  }
}))
