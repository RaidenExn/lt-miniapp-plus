import { useState, useEffect } from 'react'
import { Table, Text, Group, Loader } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { Calendar } from 'lucide-react'
import { useThemeStore } from '../theme'
import { DataTableCard } from './common/DataTableCard'
import { resolveRealEncounterStartTime, fmtCurrency } from '../utils/formatters'
import { getDefaultDatePreset, formatApiDate } from '../utils/dateUtils'
import { ehrService } from '../services/EhrService'

interface VisitsTimelineProps { visits: any[]; currentEncounter?: string; selectedRow?: any }

const VISITS_COLUMNS = [
  { label: 'Encounter', width: 140 }, { label: 'Status', width: 100 }, { label: 'Enc. Date', width: 110 },
  { label: 'Doctor', width: 150 }, { label: 'Payer Type', width: 110 },
  { label: 'Payer', align: 'right' as const, width: 90 }, { label: 'Patient', align: 'right' as const, width: 90 }
]

export function VisitsTimeline({ visits, currentEncounter, selectedRow }: VisitsTimelineProps) {
  const primaryColor = useThemeStore((state) => state.primaryColor)
  const cleanCurrentEnc = (currentEncounter || '').trim().toUpperCase()

  const [displayVisits, setDisplayVisits] = useState<any[]>(visits || [])
  const [startDate, setStartDate] = useState<Date | null>(() => getDefaultDatePreset(selectedRow)[0])
  const [endDate, setEndDate] = useState<Date | null>(() => getDefaultDatePreset(selectedRow)[1])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDisplayVisits(visits || [])
    const [defStart, defEnd] = getDefaultDatePreset(selectedRow)
    setStartDate(defStart); setEndDate(defEnd)
  }, [visits, selectedRow])

  const handleDateChange = async (s: Date | null, e: Date | null) => {
    if (!selectedRow) return
    setLoading(true)
    try {
      const fromDate = formatApiDate(s || getDefaultDatePreset(selectedRow)[0])
      const toDate = formatApiDate(e || getDefaultDatePreset(selectedRow)[1])
      setDisplayVisits(await ehrService.fetchVisits(selectedRow, fromDate, toDate))
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
    <DataTableCard title="VISIT HISTORY" count={displayVisits?.length || 0} action={headerAction} columns={VISITS_COLUMNS} isEmpty={!displayVisits || displayVisits.length === 0} emptyText={loading ? 'Reloading...' : 'No historic visits found.'} verticalSpacing="2px" horizontalSpacing="xs">
      {displayVisits?.map((visit, index) => {
        const rawEnc = visit.display_encounter || visit.display_encounter_configno || ''
        const cleanVisitEnc = rawEnc.trim().toUpperCase()
        const isCurrent = Boolean(cleanCurrentEnc && cleanVisitEnc && (cleanVisitEnc === cleanCurrentEnc || cleanVisitEnc.endsWith(cleanCurrentEnc)))

        return (
          <Table.Tr key={index} style={{ backgroundColor: isCurrent ? `var(--mantine-color-${primaryColor}-light)` : undefined, fontWeight: isCurrent ? 800 : undefined }}>
            <Table.Td style={{ whiteSpace: 'nowrap', padding: '3px 8px' }}><Text size="xs">{rawEnc || 'Encounter'}</Text></Table.Td>
            <Table.Td style={{ padding: '3px 8px' }}><Text size="xs">{visit.appointment_status || 'Consulted'}</Text></Table.Td>
            <Table.Td style={{ padding: '3px 8px' }}><Text size="xs">{resolveRealEncounterStartTime(visit)}</Text></Table.Td>
            <Table.Td style={{ padding: '3px 8px' }}><Text size="xs" truncate>{visit.phy_name || '-'}</Text></Table.Td>
            <Table.Td style={{ padding: '3px 8px' }}><Text size="xs">{visit.payer_type || 'Self Pay'}</Text></Table.Td>
            <Table.Td ta="right" style={{ padding: '3px 8px' }}><Text size="xs">{fmtCurrency(visit.payer_pay)}</Text></Table.Td>
            <Table.Td ta="right" style={{ padding: '3px 8px' }}><Text size="xs">{fmtCurrency(visit.patient_payable)}</Text></Table.Td>
          </Table.Tr>
        )
      })}
    </DataTableCard>
  )
}
