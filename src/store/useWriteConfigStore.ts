import { create } from 'zustand'

export interface WriteCapabilities {
  saveRaRemarks: boolean
  saveResubmissionReason: boolean
  postWriteOff: boolean
  bypassStatusLocks: boolean
}

export interface WriteConfigState {
  isWriteEnabled: boolean
  writeUserId: number | null
  writeRole: string
  capabilities: WriteCapabilities
  configSource: 'default' | 'uploaded' | 'none'
  rowActions: Record<string, string>
  setRowAction: (authId: string, action: string) => void
  clearRowActions: () => void
  setWriteConfig: (config: {
    writeEnabled?: boolean
    writeUserId?: number
    writeRole?: string
    writeCapabilities?: Partial<WriteCapabilities>
    source?: 'default' | 'uploaded' | 'none'
  }) => void
  resetWriteConfig: () => void
}

const DEFAULT_DEV_CAPABILITIES: WriteCapabilities = {
  saveRaRemarks: true,
  saveResubmissionReason: true,
  postWriteOff: true,
  bypassStatusLocks: true
}

export const useWriteConfigStore = create<WriteConfigState>((set) => ({
  isWriteEnabled: true, // Default enabled for development environment
  writeUserId: 1089,
  writeRole: 'Billing Officer (Dev)',
  capabilities: DEFAULT_DEV_CAPABILITIES,
  configSource: 'default',
  rowActions: {},

  setRowAction: (authId, action) =>
    set((state) => ({
      rowActions: {
        ...state.rowActions,
        [authId]: action
      }
    })),

  clearRowActions: () => set({ rowActions: {} }),

  setWriteConfig: (config) =>
    set({
      isWriteEnabled: config.writeEnabled ?? true,
      writeUserId: config.writeUserId ?? 1089,
      writeRole: config.writeRole || 'Billing Officer',
      capabilities: {
        ...DEFAULT_DEV_CAPABILITIES,
        ...(config.writeCapabilities || {})
      },
      configSource: config.source || 'uploaded'
    }),

  resetWriteConfig: () =>
    set({
      isWriteEnabled: false,
      writeUserId: null,
      writeRole: 'Read Only',
      capabilities: {
        saveRaRemarks: false,
        saveResubmissionReason: false,
        postWriteOff: false,
        bypassStatusLocks: false
      },
      configSource: 'none',
      rowActions: {}
    })
}))
