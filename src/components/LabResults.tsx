import { useState, useEffect } from 'react'
import { Table, Tooltip, Button, Text, Group, Loader } from '@mantine/core'
import { ExternalLink, Calendar } from 'lucide-react'
import { DatePickerInput } from '@mantine/dates'
import { DataTableCard } from './common/DataTableCard'
import { useThemeStore } from '../theme'
import { getDefaultDatePreset, formatApiDate } from '../utils/dateUtils'
import { ehrService } from '../services/EhrService'

interface LabResultsProps { attachments: any[]; openPdfInNewTab: (url: string) => void; selectedRow?: any }

const LAB_COLUMNS = [{ label: 'Report Date', width: 130 }, { label: 'Name' }, { label: 'Action', width: 75, align: 'right' as const }]

export function LabResults({ attachments, openPdfInNewTab, selectedRow }: LabResultsProps) {
  const primaryColor = useThemeStore((state) => state.primaryColor)
  const [displayAttachments, setDisplayAttachments] = useState<any[]>(attachments || [])
  const [startDate, setStartDate] = useState<Date | null>(() => getDefaultDatePreset(selectedRow)[0])
  const [endDate, setEndDate] = useState<Date | null>(() => getDefaultDatePreset(selectedRow)[1])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDisplayAttachments(attachments || [])
    const [s, e] = getDefaultDatePreset(selectedRow)
    setStartDate(s); setEndDate(e)
  }, [attachments, selectedRow])

  const handleDateChange = async (s: Date | null, e: Date | null) => {
    if (!selectedRow) return
    setLoading(true)
    try {
      const fromDate = formatApiDate(s || getDefaultDatePreset(selectedRow)[0])
      const toDate = formatApiDate(e || getDefaultDatePreset(selectedRow)[1])
      setDisplayAttachments(await ehrService.fetchAttachments(selectedRow, fromDate, toDate))
    } catch {
      /* ignore fetch error */
    } finally {
      setLoading(false)
    }
  }

  const headerAction = (
    <Group gap={4} align="center">
      {loading && <Loader size={12} color={primaryColor} />}
      <DatePickerInput placeholder="From Date" leftSection={<Calendar size={11} />} value={startDate} onChange={(v: any) => { const d = v ? new Date(v) : null; setStartDate(d); handleDateChange(d, endDate) }} valueFormat="DD/MM/YYYY" size="xs" clearable h={24} w={110} />
      <Text size="xs" c="dimmed">-</Text>
      <DatePickerInput placeholder="To Date" leftSection={<Calendar size={11} />} value={endDate} onChange={(v: any) => { const d = v ? new Date(v) : null; setEndDate(d); handleDateChange(startDate, d) }} valueFormat="DD/MM/YYYY" size="xs" clearable h={24} w={110} />
    </Group>
  )

  return (
    <DataTableCard title="LAB & RADIOLOGY RESULTS" count={displayAttachments?.length || 0} action={headerAction} columns={LAB_COLUMNS} isEmpty={!displayAttachments || displayAttachments.length === 0} emptyText={loading ? 'Reloading...' : 'No result documents recorded.'} verticalSpacing="2px" horizontalSpacing="xs">
      {displayAttachments?.map((item, i) => (
        <Table.Tr key={i}>
          <Table.Td style={{ padding: '3px 8px' }}><Text size="xs">{item.reportedDate}</Text></Table.Td>
          <Table.Td style={{ padding: '3px 8px' }}><Tooltip label={item.name} openDelay={0} closeDelay={0} withinPortal zIndex={3000}><Text size="xs" truncate>{item.name}</Text></Tooltip></Table.Td>
          <Table.Td ta="right" style={{ padding: '2px 8px' }}>
            {item.downloadUrl ? (
              <Button size="xxs" variant="outline" color="orange" leftSection={<ExternalLink size={10} />} onClick={() => openPdfInNewTab(item.downloadUrl!)} h={20} fz={10} px={6}>Open</Button>
            ) : <Text size="xs" c="dimmed">-</Text>}
          </Table.Td>
        </Table.Tr>
      ))}
    </DataTableCard>
  )
}
