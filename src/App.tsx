import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { AppShell, AppShellHeader, AppShellMain, Text, Box, ScrollArea, Stack, Center, Flex, Group } from '@mantine/core'
import { showToast } from './utils/toast'
import { formatBytes } from './utils/formatters'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Database } from 'lucide-react'

import { dbService } from './services/BrowserDbService'
import { ehrService } from './services/EhrService'
import { ClinicalSummary } from './components/ClinicalSummary'
import { SettingsModal } from './components/SettingsModal'
import { ActiveDiagnoses } from './components/ActiveDiagnoses'
import { LabResults } from './components/LabResults'
import { VisitsTimeline } from './components/VisitsTimeline'
import { NavigationTabs } from './components/NavigationTabs'
import { ActivitiesTable } from './components/ActivitiesTable'
import { ClaimHistoryTable } from './components/ClaimHistoryTable'
import { RemarksAndResubmissionsCard } from './components/RemarksAndResubmissionsCard'
import { PatientBanner } from './components/PatientBanner'
import { HeaderSearchBar } from './components/HeaderSearchBar'
import { loggerService } from './services/LoggerService'
import { useAppStore, getTabFromUrl } from './store/useAppStore'
import { useThemeStore } from './theme'

const LogsView = lazy(() => import('./components/LogsView').then((m) => ({ default: m.LogsView })))

const fetchEncounter = async (query: string) => {
  const norm = query.trim().toUpperCase()
  if (!norm) return null
  const startTime = performance.now()

  const cached = await dbService.getEncounter(norm)
  if (cached) {
    return { bundle: cached.data, isCached: true, sizeBytes: cached.sizeBytes, durationMs: Math.round(performance.now() - startTime) }
  }

  const searchResult = await ehrService.searchEncounter(norm)
  const bundle = await ehrService.loadEncounterBundle(searchResult.selected)
  const canonicalId = String(searchResult.selected.display_encounter_configno || norm).toUpperCase()
  const sizeBytes = await dbService.storeEncounter(canonicalId, searchResult.selected.patient_name || 'Anonymous', bundle)

  return { bundle, isCached: false, sizeBytes, durationMs: Math.round(performance.now() - startTime) }
}

export default function App() {
  const queryClient = useQueryClient()
  const { searchQuery, setSearchQuery, popoverOpened, setPopoverOpened, setShowSettings, cachedList, loadCachedList, activeTab, setActiveTab } = useAppStore()
  const primaryColor = useThemeStore((state) => state.primaryColor)

  const [activeEncounterNo, setActiveEncounterNo] = useState('')
  const lastNotifiedEncounter = useRef<string | null>(null)

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['encounter', activeEncounterNo],
    queryFn: () => fetchEncounter(activeEncounterNo),
    enabled: !!activeEncounterNo,
    staleTime: Infinity
  })

  const encounterData = data?.bundle || null

  useEffect(() => {
    loggerService.init()
    document.title = `lt-mini v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0'}`

    const handleRoute = () => setActiveTab(getTabFromUrl(), true)
    window.addEventListener('popstate', handleRoute)
    window.addEventListener('hashchange', handleRoute)

    loadCachedList().then(() => {
      const list = useAppStore.getState().cachedList
      if (list.length > 0) {
        const latest = [...list].sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime())[0]
        setSearchQuery(latest.encounterNo)
        setActiveEncounterNo(latest.encounterNo)
      }
    })

    return () => {
      window.removeEventListener('popstate', handleRoute)
      window.removeEventListener('hashchange', handleRoute)
    }
  }, [loadCachedList, setSearchQuery, setActiveTab])

  useEffect(() => {
    if (!data || !activeEncounterNo || lastNotifiedEncounter.current === activeEncounterNo) return
    lastNotifiedEncounter.current = activeEncounterNo
    loadCachedList()
    const fmt = data.durationMs >= 1000 ? `${(data.durationMs / 1000).toFixed(2)}s` : `${data.durationMs}ms`
    showToast({
      id: `enc-${activeEncounterNo}`,
      title: data.isCached ? 'Loaded From Local DB' : 'Loaded From EMR Server',
      message: `${data.isCached ? 'Loaded' : 'Fetched'} record for ${activeEncounterNo} in ${fmt}${data.isCached ? ` (${formatBytes(data.sizeBytes)})` : ''}.`,
      tone: 'ok'
    })
  }, [data, activeEncounterNo, loadCachedList])

  useEffect(() => {
    if (error) {
      showToast({ title: 'Failed to Load Encounter', message: (error as Error)?.message || 'Fetch failed', tone: 'error' })
    }
  }, [error])

  const triggerSearch = (override?: string) => {
    const q = (override || searchQuery).replace(/^["']|["']$/g, '').trim()
    if (!q) return
    if (q === activeEncounterNo) {
      queryClient.invalidateQueries({ queryKey: ['encounter', q] })
    } else {
      setActiveEncounterNo(q)
    }
  }

  const handleForceRefresh = async () => {
    const q = searchQuery.replace(/^["']|["']$/g, '').trim()
    if (!q) return
    await dbService.removeEncounter(q)
    await loadCachedList()
    lastNotifiedEncounter.current = null
    queryClient.invalidateQueries({ queryKey: ['encounter', q] })
    setActiveEncounterNo(q)
  }

  const handlePasteAndLoad = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleanText = text.replace(/^["']|["']$/g, '').trim()
      if (cleanText) {
        setSearchQuery(cleanText)
        triggerSearch(cleanText)
      } else {
        showToast({ title: 'Clipboard Empty', message: 'No text found in clipboard.', tone: 'warning' })
      }
    } catch {
      showToast({ title: 'Clipboard Access Denied', message: 'Could not read clipboard. Please check browser permissions.', tone: 'error' })
    }
  }

  return (
    <>
      <AppShell header={{ height: 80 }} styles={{ main: { backgroundColor: 'var(--mantine-color-body)' } }}>
        <AppShellHeader bg="var(--mantine-color-body)" zIndex={1000} p={0} style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
          <Flex direction="column" h="100%" justify="center">
            <Box h={42} px="md" style={{ borderBottom: '1px solid var(--mantine-color-border)', display: 'flex', alignItems: 'center' }}>
              <Group justify="space-between" align="center" h="100%" gap={6} wrap="nowrap" style={{ width: '100%' }}>
                <PatientBanner encounterData={encounterData} />
                <HeaderSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} popoverOpened={popoverOpened} setPopoverOpened={setPopoverOpened} cachedList={cachedList} triggerSearch={triggerSearch} handleForceRefresh={handleForceRefresh} handlePasteAndLoad={handlePasteAndLoad} isLoading={isLoading} isFetching={isFetching} setShowSettings={setShowSettings} primaryColor={primaryColor} />
              </Group>
            </Box>
            <Box h={38} px="md" style={{ display: 'flex', alignItems: 'center' }}>
              <NavigationTabs encounterData={encounterData} />
            </Box>
          </Flex>
        </AppShellHeader>

        <AppShellMain h="calc(100dvh - 80px)" display="flex" style={{ overflow: 'hidden', flexDirection: 'column', position: 'relative' }}>
          <Box p="md" style={{ flex: 1, overflow: 'hidden', display: activeTab === 'logs' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
            <Suspense fallback={<Center flex={1} h="100%"><Text size="xs" c="dimmed" fw={700}>Loading Logs...</Text></Center>}>
              <LogsView />
            </Suspense>
          </Box>

          {!encounterData && activeTab !== 'logs' ? (
            <Center flex={1} h="100%">
              <Stack align="center" gap="md">
                <Database size={36} color="gray" style={{ opacity: 0.3 }} />
                <Text size="sm" c="dimmed" fw={700}>Enter an encounter number above to get started.</Text>
              </Stack>
            </Center>
          ) : (
            <>
              {encounterData && (
                <Box p="md" style={{ flex: 1, overflowY: 'auto', display: activeTab === 'activities' ? 'block' : 'none', height: '100%' }}>
                  <Stack gap="md">
                    <ActivitiesTable activities={encounterData.activities} claimHistory={encounterData.remittanceHistory} />
                    <RemarksAndResubmissionsCard remarks={encounterData.remarks || encounterData.claimRemarks} resubmissions={encounterData.resubmissionFiles} resubmissionReasons={encounterData.resubmissionReasons} claimHistory={encounterData.remittanceHistory} />
                    <ClaimHistoryTable claimHistory={encounterData.remittanceHistory} />
                  </Stack>
                </Box>
              )}

              {encounterData && (
                <Flex h="100%" w="100%" gap="md" p="md" align="stretch" direction={{ base: 'column', md: 'row' }} style={{ display: activeTab === 'overview' ? 'flex' : 'none' }}>
                  <Box w={{ base: '100%', md: '50%' }} h={{ base: '50%', md: '100%' }} display="flex" style={{ flexDirection: 'column', overflow: 'hidden' }}>
                    <ClinicalSummary encounterData={encounterData} getSummaryPdfUrl={(row) => ehrService.getSummaryPdfUrl(row)} openPdfInNewTab={(url) => window.open(url, '_blank')} />
                  </Box>
                  <Box w={{ base: '100%', md: '50%' }} h={{ base: '50%', md: '100%' }} display="flex" style={{ flexDirection: 'column', overflow: 'hidden' }}>
                    <ScrollArea h="100%" type="auto">
                      <Stack gap="md" pb="xs">
                        <ActiveDiagnoses diagnoses={encounterData.diagnoses} />
                        <LabResults attachments={encounterData.attachments} openPdfInNewTab={(url) => window.open(url, '_blank')} selectedRow={encounterData.selected} />
                        <VisitsTimeline visits={encounterData.visits} currentEncounter={activeEncounterNo} selectedRow={encounterData.selected} />
                      </Stack>
                    </ScrollArea>
                  </Box>
                </Flex>
              )}
            </>
          )}
        </AppShellMain>
      </AppShell>
      <SettingsModal />
    </>
  )
}
