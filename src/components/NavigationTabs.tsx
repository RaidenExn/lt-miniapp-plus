import { useEffect } from 'react'
import {
  Box,
  Tabs,
  Group,
  Button,
  ActionIcon,
  Text,
  Tooltip,
  useMantineColorScheme,
  useComputedColorScheme
} from '@mantine/core'
import { FileText, Zap, Activity, Sun, Moon, Settings, Terminal } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useThemeStore } from '../theme'
import { AppCard } from './common/AppCard'
import { useClaimHistory } from '../hooks/useClaimHistory'

interface NavigationTabsProps {
  encounterData?: any
}

function resolveRawQueueStatus(encounterData: any): string {
  if (!encounterData) return ''
  const selected = encounterData.selected || {}
  const raw =
    selected.claim_queue_status ||
    selected.claim_queue ||
    selected.claim_status ||
    selected.queue_status ||
    selected.activity_status_desc ||
    selected.activity_status
  if (raw && String(raw).trim() !== '') return String(raw).trim()

  const activities = encounterData.activities || []
  if (activities.length > 0) {
    const firstAct = activities[0]
    return String(firstAct.activity_status || firstAct.status_desc || '').trim() || 'Open'
  }
  return 'Open'
}

function resolveRawApptStatus(encounterData: any): string {
  if (!encounterData) return ''
  const selected = encounterData.selected || {}
  return String(selected.appointment_status || selected.app_status_desc || '').trim()
}

export function NavigationTabs({ encounterData }: NavigationTabsProps) {
  const { activeTab, setActiveTab, setShowSettings } = useAppStore()
  const primaryColor = useThemeStore((state) => state.primaryColor)
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('dark')
  const isDark = computedColorScheme === 'dark'

  const selected = encounterData?.selected
  const rawMpi = selected?.mpi || selected?.MPI || selected?.patient_mpi || ''
  const rawApptStatus = resolveRawApptStatus(encounterData)

  const claimHistory = encounterData?.remittanceHistory || encounterData?.claimHistory || []
  const { lastFileMode } = useClaimHistory(claimHistory)
  const rawClaimQueueStatus = lastFileMode || resolveRawQueueStatus(encounterData)

  // Auto switch theme if system OS theme changes while app is running
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [setColorScheme])

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark')
  }

  return (
    <Box px={0} h="100%" display="flex" style={{ alignItems: 'center', width: '100%' }}>
      <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(val) => {
            if (!val) return
            setActiveTab(val)
          }}
          variant="outline"
          color={primaryColor}
          styles={{
            tab: {
              padding: '5px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              height: '32px'
            },
            list: { borderBottom: 'none' }
          }}
        >
          <Tabs.List>
            <Tabs.Tab
              value="overview"
              leftSection={<FileText size={13} color={`var(--mantine-color-${primaryColor}-filled)`} />}
            >
              OVERVIEW
            </Tabs.Tab>
            <Tabs.Tab
              value="activities"
              leftSection={<Zap size={13} color={`var(--mantine-color-${primaryColor}-filled)`} />}
            >
              ACTIVITIES
            </Tabs.Tab>
            <Tabs.Tab
              value="logs"
              leftSection={<Activity size={13} color={`var(--mantine-color-${primaryColor}-filled)`} />}
            >
              LOGS
            </Tabs.Tab>
            <Tabs.Tab
              value="dev"
              leftSection={<Terminal size={13} color={`var(--mantine-color-${primaryColor}-filled)`} />}
            >
              DEV
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Group gap="xs" align="center" wrap="nowrap">
          {(rawMpi || rawApptStatus || rawClaimQueueStatus) && (
            <AppCard
              px="xs"
              py={1}
              style={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Group gap={6} align="center" wrap="nowrap">
                {rawMpi && (
                  <Tooltip label={`MPI: ${rawMpi}`} openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
                    <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                      MPI:{' '}
                      <Text component="span" fw={500}>
                        {rawMpi}
                      </Text>
                    </Text>
                  </Tooltip>
                )}

                {rawMpi && (rawApptStatus || rawClaimQueueStatus) && (
                  <Text size="xs" c="dimmed" style={{ opacity: 0.4, flexShrink: 0 }}>
                    |
                  </Text>
                )}

                {rawApptStatus && (
                  <Tooltip
                    label={`Appointment Status: ${rawApptStatus}`}
                    openDelay={0}
                    closeDelay={0}
                    withinPortal
                    zIndex={3000}
                  >
                    <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                      Appointment Status:{' '}
                      <Text component="span" fw={500}>
                        {rawApptStatus}
                      </Text>
                    </Text>
                  </Tooltip>
                )}

                {rawApptStatus && rawClaimQueueStatus && (
                  <Text size="xs" c="dimmed" style={{ opacity: 0.4, flexShrink: 0 }}>
                    |
                  </Text>
                )}

                {rawClaimQueueStatus && (
                  <Tooltip
                    label={`Claim Queue Status: ${rawClaimQueueStatus}`}
                    openDelay={0}
                    closeDelay={0}
                    withinPortal
                    zIndex={3000}
                  >
                    <Text size="xs" fw={400} style={{ whiteSpace: 'nowrap' }}>
                      Claim Queue:{' '}
                      <Text component="span" fw={500}>
                        {rawClaimQueueStatus}
                      </Text>
                    </Text>
                  </Tooltip>
                )}
              </Group>
            </AppCard>
          )}

          <Tooltip
            label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            openDelay={0}
            closeDelay={0}
            withinPortal
            zIndex={3000}
          >
            <Button
              onClick={toggleTheme}
              variant="outline"
              color="gray"
              size="xs"
              h={26}
              px={10}
              fz={11}
              fw={700}
              leftSection={isDark ? <Moon size={12} /> : <Sun size={12} />}
              style={{
                borderColor: 'var(--mantine-color-border)',
                lineHeight: '1'
              }}
              styles={{
                inner: { overflow: 'visible' },
                label: { overflow: 'visible', whiteSpace: 'nowrap' }
              }}
            >
              {isDark ? 'Dark' : 'Light'}
            </Button>
          </Tooltip>

          <Tooltip label="Portal Settings" openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
            <ActionIcon onClick={() => setShowSettings(true)} variant="subtle" color="gray" size="sm">
              <Settings size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  )
}
