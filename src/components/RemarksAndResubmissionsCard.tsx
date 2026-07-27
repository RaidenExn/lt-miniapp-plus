import { useMemo } from 'react'
import { Table, Text, Group, Badge, Stack } from '@mantine/core'
import { AppCard } from './common/AppCard'
import { MessageSquare, FileText } from 'lucide-react'

interface RemarksAndResubmissionsCardProps {
  remarks?: any[]; resubmissions?: any[]; resubmissionReasons?: any[]; claimHistory?: any[]
}

function getRemarkDate(item: any): string {
  return item.remarks_date || item.transact_date || item.captured_on || item.created_on || '-'
}

function getRemarkUser(item: any): string {
  return item.user_name || item.created_by || '-'
}

function getRemarkText(item: any): string {
  const statusId = Number(item.status_id || 0)
  if (statusId === 1) return (item.remarks_ra || item.remarks || '').trim()
  if (statusId === 2) return (item.remarks_write_off || item.remarks || '').trim()
  if (statusId === 3) return (item.remarks_resub || item.remarks || '').trim()
  if (statusId === 4) return (item.remarks_pat_pay_ar || item.remarks || '').trim()
  return (
    item.remarks_ra || item.remarks_write_off || item.remarks_resub || item.remarks_pat_pay_ar ||
    item.remarks || item.ra_claim_comment || item.comments || ''
  ).trim()
}

function getRemarkSource(item: any): string {
  const statusId = Number(item.status_id || 0)
  if (statusId === 1) return 'RA Remarks'
  if (statusId === 2) return 'Write Off Remarks'
  if (statusId === 3) return 'Resubmission Remarks'
  if (statusId === 4) return 'Patient Pay AR Remarks'
  return item.remarks_from || item.source || 'RA Remarks'
}

export function RemarksAndResubmissionsCard({
  remarks = [], resubmissions = [], resubmissionReasons = [], claimHistory = []
}: RemarksAndResubmissionsCardProps) {
  // Strictly filter actual EHR remarks from claim/remarks/get
  const filteredRemarks = useMemo(
    () => remarks.filter((r) => getRemarkText(r).length > 0),
    [remarks]
  )

  const resubmissionRows = useMemo(() => {
    const seen = new Set<string>()
    const rows: any[] = []
    const push = (date: string, comment: string, source: string, type: string, user: string) => {
      const trimmed = comment.trim()
      if (!trimmed) return
      const key = `${date}|${trimmed}`
      if (seen.has(key)) return
      seen.add(key)
      rows.push({ date, comment: trimmed, source, type, user })
    }

    for (const item of resubmissionReasons) {
      push(
        item.resubmit_reason_createdon || '-',
        item.resubmit_reason_desc || item.resubmit_reason_captured || '',
        item.source || 'Saved Comment',
        item.type || 'Correction',
        String(item.resubmit_reason_createdby || '-')
      )
    }
    for (const item of resubmissions) {
      push(
        item.transact_date || '-',
        item.ra_claim_comment || item.remarks || '',
        item.source || 'RA File',
        item.type || '',
        item.user_name || '-'
      )
    }
    for (const item of claimHistory) {
      if (/resub|correction|complaint/i.test(String(item.file_name || ''))) {
        push(item.transact_date || '-', item.ra_claim_comment || '', 'Claim History', '', '-')
      }
    }
    return rows
  }, [resubmissionReasons, resubmissions, claimHistory])

  if (filteredRemarks.length === 0 && resubmissionRows.length === 0) return null

  return (
    <Stack gap="md">
      {filteredRemarks.length > 0 && (
        <AppCard p="sm">
          <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
            <MessageSquare size={14} /><Text size="xs" fw={800}>REMARKS</Text><Badge size="xs" variant="light" color="gray">{filteredRemarks.length}</Badge>
          </Group>
          <Table verticalSpacing={2} horizontalSpacing="xs" withColumnBorders highlightOnHover fz="xs">
            <Table.Thead><Table.Tr><Table.Th w={80}>Date</Table.Th><Table.Th w={90}>Source</Table.Th><Table.Th w={80}>User</Table.Th><Table.Th>Remarks</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filteredRemarks.map((item, i) => (
                <Table.Tr key={i}>
                  <Table.Td style={{ padding: '2px 6px' }}>{getRemarkDate(item)}</Table.Td>
                  <Table.Td style={{ padding: '2px 6px' }}>{getRemarkSource(item)}</Table.Td>
                  <Table.Td style={{ padding: '2px 6px' }}>{getRemarkUser(item)}</Table.Td>
                  <Table.Td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '2px 6px' }}>{getRemarkText(item)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </AppCard>
      )}

      {resubmissionRows.length > 0 && (
        <AppCard p="sm">
          <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
            <FileText size={14} /><Text size="xs" fw={800}>RESUBMISSIONS</Text><Badge size="xs" variant="light" color="gray">{resubmissionRows.length}</Badge>
          </Group>
          <Table verticalSpacing={2} horizontalSpacing="xs" withColumnBorders highlightOnHover fz="xs">
            <Table.Thead><Table.Tr><Table.Th w={80}>Date</Table.Th><Table.Th w={90}>Type</Table.Th><Table.Th w={80}>Source</Table.Th><Table.Th w={80}>User</Table.Th><Table.Th>Comments</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {resubmissionRows.map((item, i) => (
                <Table.Tr key={i}>
                  <Table.Td style={{ padding: '2px 6px' }}>{item.date}</Table.Td>
                  <Table.Td style={{ padding: '2px 6px' }}>{item.type}</Table.Td>
                  <Table.Td style={{ padding: '2px 6px' }}>{item.source}</Table.Td>
                  <Table.Td style={{ padding: '2px 6px' }}>{item.user}</Table.Td>
                  <Table.Td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '2px 6px' }}>{item.comment}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </AppCard>
      )}
    </Stack>
  )
}
