import { useMemo } from 'react'
import { Modal, Group, Text, Button, Stack, Table, Badge, ScrollArea, Center, ActionIcon, Tooltip, Tabs, Slider, Box } from '@mantine/core'
import { Database, Trash2, Settings, Palette } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useThemeStore, MantineTokenSize } from '../theme'
import { showToast } from '../utils/toast'

const TOKEN_LIST: MantineTokenSize[] = ['xs', 'sm', 'md', 'lg']
const tokenToIndex = (token: MantineTokenSize) => Math.max(0, TOKEN_LIST.indexOf(token))
const indexToToken = (idx: number) => TOKEN_LIST[idx] || 'sm'

export function SettingsModal() {
  const showSettings = useAppStore((state: any) => state.showSettings)
  const setShowSettings = useAppStore((state: any) => state.setShowSettings)
  const cachedList = useAppStore((state: any) => state.cachedList)
  const removeCachedItem = useAppStore((state: any) => state.removeCachedItem)
  const clearAllCache = useAppStore((state: any) => state.clearAllCache)

  const primaryColor = useThemeStore((state) => state.primaryColor)
  const radius = useThemeStore((state) => state.radius)
  const setRadius = useThemeStore((state) => state.setRadius)

  const totalBytes = useMemo(() => cachedList.reduce((sum: number, item: any) => sum + (item.sizeBytes || 0), 0), [cachedList])

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Modal opened={showSettings} onClose={() => setShowSettings(false)} title={<Group gap="xs"><Settings size={15} color={`var(--mantine-color-${primaryColor}-filled)`} /><Text fw={800} fz="xs">PORTAL SETTINGS</Text><Badge size="xs" variant="light" color={primaryColor}>v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.0.0'}</Badge></Group>} size="md" radius={radius} centered zIndex={2000} withinPortal>
      <Tabs defaultValue="storage" color={primaryColor} variant="outline">
        <Tabs.List mb="sm">
          <Tabs.Tab value="storage" leftSection={<Database size={13} />}>STORAGE</Tabs.Tab>
          <Tabs.Tab value="appearance" leftSection={<Palette size={13} />}>APPEARANCE</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="storage">
          <Box mih={280}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs"><Text size="xs" fw={700} c="dimmed">STORAGE USED:</Text><Badge color={primaryColor} variant="light" size="sm">{formatSize(totalBytes)}</Badge></Group>
              <Button color="red" variant="subtle" size="xs" h={24} leftSection={<Trash2 size={12} />} onClick={async () => { if (window.confirm('Clear all local database cache?')) { await clearAllCache(); showToast({ title: 'Cache Cleared', message: 'All items deleted.', tone: 'error' }) } }}>CLEAR ALL</Button>
            </Group>
            {cachedList.length === 0 ? <Center p="xl"><Text c="dimmed" fz="xs">Local cache database is currently empty.</Text></Center> : (
              <ScrollArea h={220} type="auto">
                <Table verticalSpacing={4} horizontalSpacing="xs" highlightOnHover fz="xs">
                  <Table.Thead><Table.Tr><Table.Th>Encounter</Table.Th><Table.Th>Patient</Table.Th><Table.Th ta="right">Size</Table.Th><Table.Th style={{ width: 40 }} /></Table.Tr></Table.Thead>
                  <Table.Tbody>
                    {cachedList.map((item: any) => (
                      <Table.Tr key={item.encounterNo}>
                        <Table.Td><Text size="xs" fw={700}>{item.encounterNo}</Text></Table.Td>
                        <Table.Td><Text size="xs" truncate>{item.patientName}</Text></Table.Td>
                        <Table.Td ta="right"><Text size="xs">{formatSize(item.sizeBytes)}</Text></Table.Td>
                        <Table.Td><Tooltip label="Delete item"><ActionIcon size="xs" color="red" variant="subtle" onClick={() => removeCachedItem(item.encounterNo)}><Trash2 size={12} /></ActionIcon></Tooltip></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="appearance">
          <Box mih={280} pt="xs">
            <Group justify="space-between" mb="xs"><Text size="xs" fw={700}>Border Radius</Text><Badge color={primaryColor} size="xs" variant="light">{radius.toUpperCase()}</Badge></Group>
            <Slider min={0} max={3} step={1} value={tokenToIndex(radius)} onChange={(val) => setRadius(indexToToken(val))} marks={[{ value: 0, label: 'XS' }, { value: 1, label: 'SM' }, { value: 2, label: 'MD' }, { value: 3, label: 'LG' }]} color={primaryColor} size="xs" />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
