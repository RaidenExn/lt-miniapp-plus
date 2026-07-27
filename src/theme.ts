import { createTheme, MantineThemeOverride } from '@mantine/core'
import { create } from 'zustand'

export type MantineTokenSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ThemeSettings {
  primaryColor: string
  radius: MantineTokenSize
  fontSize: MantineTokenSize
  density: MantineTokenSize
}

export const ACCENT_COLORS = [
  { name: 'Orange', value: 'orange' },
  { name: 'Blue', value: 'blue' },
  { name: 'Teal', value: 'teal' },
  { name: 'Green', value: 'green' },
  { name: 'Violet', value: 'violet' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Red', value: 'red' },
  { name: 'Indigo', value: 'indigo' }
]

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  primaryColor: 'orange',
  radius: 'md',
  fontSize: 'sm',
  density: 'sm'
}

const loadInitialSettings = (): ThemeSettings => {
  if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS
  try {
    const stored = localStorage.getItem('mini_app_theme_settings')
    if (stored) {
      return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(stored) }
    }
    // Backward compatibility for legacy accent color
    const legacyAccent = localStorage.getItem('portal_accent_color')
    if (legacyAccent) {
      return { ...DEFAULT_THEME_SETTINGS, primaryColor: legacyAccent }
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_THEME_SETTINGS
}

interface ThemeState extends ThemeSettings {
  setPrimaryColor: (color: string) => void
  setRadius: (radius: MantineTokenSize) => void
  setFontSize: (size: MantineTokenSize) => void
  setDensity: (density: MantineTokenSize) => void
}

export const useThemeStore = create<ThemeState>((set: any, get: any) => ({
  ...loadInitialSettings(),

  setPrimaryColor: (color: string) => {
    const next = { ...get(), primaryColor: color }
    saveSettings(next)
    set({ primaryColor: color })
  },

  setRadius: (radius: MantineTokenSize) => {
    const next = { ...get(), radius }
    saveSettings(next)
    set({ radius })
  },

  setFontSize: (fontSize: MantineTokenSize) => {
    const next = { ...get(), fontSize }
    saveSettings(next)
    set({ fontSize })
  },

  setDensity: (density: MantineTokenSize) => {
    const next = { ...get(), density }
    saveSettings(next)
    set({ density })
  }
}))

function saveSettings(settings: ThemeSettings) {
  if (typeof window !== 'undefined') {
    const payload = {
      primaryColor: settings.primaryColor,
      radius: settings.radius,
      fontSize: settings.fontSize,
      density: settings.density
    }
    localStorage.setItem('mini_app_theme_settings', JSON.stringify(payload))
    localStorage.setItem('portal_accent_color', settings.primaryColor)
  }
}

/**
 * Dynamically builds a Mantine Theme Override object based on theme settings.
 * Unifies radius, font size scaling, and component density across all UI elements.
 */
export function getMantineTheme(settings: ThemeSettings): MantineThemeOverride {
  const selectedRadius = settings.radius || 'md'
  const selectedDensity = settings.density || 'sm'
  const selectedFontSize = settings.fontSize || 'sm'

  const fontSizeScales: Record<MantineTokenSize, { xs: string; sm: string; md: string; lg: string; xl: string }> = {
    xs: { xs: '10px', sm: '11px', md: '12px', lg: '13.5px', xl: '15px' },
    sm: { xs: '11px', sm: '12px', md: '13.5px', lg: '15px', xl: '17px' },
    md: { xs: '12px', sm: '13px', md: '14.5px', lg: '16.5px', xl: '19px' },
    lg: { xs: '13px', sm: '14px', md: '16px', lg: '18px', xl: '21px' }
  }

  const activeFontSizes = fontSizeScales[selectedFontSize] || fontSizeScales.sm

  return createTheme({
    primaryColor: settings.primaryColor || 'orange',
    defaultRadius: selectedRadius,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontFamilyMonospace: 'JetBrains Mono, monospace',
    fontSizes: activeFontSizes,
    components: {
      Card: {
        defaultProps: {
          radius: selectedRadius
        }
      },
      Paper: {
        defaultProps: {
          radius: selectedRadius
        }
      },
      Modal: {
        defaultProps: {
          radius: selectedRadius
        }
      },
      Popover: {
        defaultProps: {
          radius: selectedRadius
        }
      },
      Button: {
        defaultProps: {
          size: selectedDensity,
          radius: selectedRadius
        }
      },
      TextInput: {
        defaultProps: {
          size: selectedDensity,
          radius: selectedRadius
        }
      },
      Select: {
        defaultProps: {
          size: selectedDensity,
          radius: selectedRadius
        }
      },
      Badge: {
        defaultProps: {
          size: selectedDensity,
          radius: selectedRadius
        }
      },
      ActionIcon: {
        defaultProps: {
          size: selectedDensity,
          radius: selectedRadius
        }
      },
      Tabs: {
        defaultProps: {
          radius: selectedRadius
        }
      },
      Table: {
        defaultProps: {
          verticalSpacing: selectedDensity,
          horizontalSpacing: selectedDensity
        }
      }
    }
  })
}
