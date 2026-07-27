import { useState, useEffect } from 'react'
import { Table, Text, Group, ActionIcon, Badge, Box, Stack } from '@mantine/core'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { AppCard } from './common/AppCard'
import { fmtCurrency } from '../utils/formatters'
import { useClaimHistory } from '../hooks/useClaimHistory'

export interface ClaimHistoryChildItem {
  codeTypeName?: string; code_type_name?: string; code?: string; itemName?: string; item_name?: string
  denialCode?: string; claim_denial_desc?: string; refusal_for_auth_reason?: string; conf_payer_payable?: number | string
  auth_payer_payable?: number | string; ra_payer_credit?: number | string; ra_claim_comment?: string; remarks?: string; comments?: string
  [key: string]: any
}

export interface ClaimHistoryItem {
  file_id?: string | number; file_name?: string; ra_file_name?: string; transact_date?: string; ra_id_payer?: string
  idPayer?: string; payment_ref?: string; conf_payer_payable?: number | string; auth_payer_payable?: number | string
  ra_payer_credit?: number | string; ra_claim_comment?: string; remarks?: string; resubmission_type?: string
  resubmission_reason?: string; resubmissionReason?: string; children?: ClaimHistoryChildItem[]
  [key: string]: any
}

interface ClaimHistoryTableProps {
  claimHistory?: ClaimHistoryItem[]
}

const SUBMISSION_COLS = [
  { label: 'Code', width: '18%' }, { label: 'Description', width: '64%' },
  { label: 'Rate Card', align: 'right' as const, width: '9%' }, { label: 'Claimed', align: 'right' as const, width: '9%' }
]

const REMITTANCE_COLS = [
  { label: 'Code', width: '18%' }, { label: 'Description', width: '42%' }, { label: 'Denial Code', width: '12%' },
  { label: 'Rate Card', align: 'right' as const, width: '9%' }, { label: 'Claimed', align: 'right' as const, width: '9%' },
  { label: 'RA Amount', align: 'right' as const, width: '10%' }
]

export function ClaimHistoryTable({ claimHistory = [] }: ClaimHistoryTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (claimHistory?.length > 0) {
      const last = claimHistory[claimHistory.length - 1]
      setExpanded({ [last.file_id ? String(last.file_id) : `idx-${claimHistory.length - 1}`]: true })
    } else {
      setExpanded({})
    }
  }, [claimHistory])

  const { processedHistory, isEmpty } = useClaimHistory(claimHistory)

  return (
    <AppCard p="md">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Text fw={700} fz="xs" style={{ letterSpacing: '0.5px' }}>CLAIM HISTORY DETAILS</Text>
          {claimHistory?.length > 0 && <Badge size="xs" variant="light">{claimHistory.length}</Badge>}
        </Group>
      </Group>

      {isEmpty ? (
        <Box p="xl" style={{ textAlign: 'center' }}><Text c="dimmed" fz="xs">No Claim History records found.</Text></Box>
      ) : (
        <Stack gap="sm">
          {processedHistory.map(({ row, fileName, transactDate, fileComment, hasRaRemarks, children, isRemittance, badgeLabel, badgeColor, fileRateCardTotal, fileClaimedTotal, fileRaTotal }, idx) => {
            const fileKey = row.file_id ? String(row.file_id) : `idx-${idx}`
            const isExp = Boolean(expanded[fileKey])
            const cols = isRemittance ? REMITTANCE_COLS : SUBMISSION_COLS

            return (
              <AppCard key={fileKey} p={0} style={{ overflow: 'hidden' }}>
                <Box p="xs" onClick={() => setExpanded((p) => ({ ...p, [fileKey]: !p[fileKey] }))} style={{ cursor: 'pointer', backgroundColor: 'var(--mantine-color-default-hover)', userSelect: 'none' }}>
                  <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                    <Group gap="xs" wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
                      <ActionIcon size="xs" variant="subtle" color="orange" style={{ flexShrink: 0 }}>
                        {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </ActionIcon>
                      <Box style={{ width: 165, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <Badge size="xs" variant="light" color={badgeColor}>{badgeLabel}</Badge>
                      </Box>
                      <Box style={{ width: 135, flexShrink: 0 }}>
                        <Text size="xs" fw={700}>{transactDate !== '-' ? transactDate : ''}</Text>
                      </Box>
                      <Text size="xs" fw={600} c="dimmed">|</Text>
                      <Text size="xs" fw={700} truncate style={{ flex: 1, minWidth: 0 }}>{fileName}</Text>
                      {children.length > 0 && <Badge size="xs" variant="outline" color="orange" style={{ flexShrink: 0 }}>{children.length} {children.length === 1 ? 'item' : 'items'}</Badge>}
                    </Group>

                    <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
                      <Box style={{ width: 140, textAlign: 'right' }}>
                        <Group gap={4} justify="flex-end"><Text size="xs" c="dimmed" fw={600}>Rate Card:</Text><Text size="xs" fw={700}>{fmtCurrency(fileRateCardTotal)}</Text></Group>
                      </Box>
                      <Box style={{ width: 140, textAlign: 'right' }}>
                        <Group gap={4} justify="flex-end"><Text size="xs" c="dimmed" fw={600}>Claimed:</Text><Text size="xs" fw={700}>{fmtCurrency(fileClaimedTotal)}</Text></Group>
                      </Box>
                      <Box style={{ width: 150, textAlign: 'right' }}>
                        {isRemittance ? (
                          <Group gap={4} justify="flex-end">
                            <Text size="xs" c="dimmed" fw={600}>RA Amount:</Text>
                            <Text size="xs" fw={700} c={fileRaTotal !== null && fileRaTotal > 0 ? (fileRaTotal >= fileClaimedTotal ? 'green' : 'orange') : 'red'}>{fmtCurrency(fileRaTotal || 0)}</Text>
                          </Group>
                        ) : <Box style={{ width: 150 }} />}
                      </Box>
                    </Group>
                  </Group>
                </Box>

                {isExp && (
                  <Box style={{ borderTop: '1px solid var(--mantine-color-border)' }}>
                    <Table verticalSpacing={2} horizontalSpacing="xs" highlightOnHover withColumnBorders fz="xs" style={{ width: '100%' }}>
                      <Table.Thead>
                        <Table.Tr style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                          {cols.map((col, cIdx) => (
                            <Table.Th key={cIdx} style={{ fontSize: 'var(--mantine-font-size-xs)', fontWeight: 700, width: col.width, textAlign: col.align || 'left', padding: '3px 6px' }}>{col.label}</Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {children.length === 0 ? (
                          <Table.Tr><Table.Td colSpan={cols.length}><Text size="xs" c="dimmed" ta="center" py="xs">No activity items recorded under this file.</Text></Table.Td></Table.Tr>
                        ) : (
                          children.map((child, cIdx) => (
                            <Table.Tr key={`child-${cIdx}`} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                              <Table.Td style={{ paddingLeft: 12, paddingRight: 6, paddingTop: 2, paddingBottom: 2 }}><Text size="xs" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>{child.code || '-'}</Text></Table.Td>
                              <Table.Td style={{ padding: '2px 6px' }}><Text size="xs" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{child.itemName || child.item_name || '-'}</Text></Table.Td>
                              {isRemittance && (
                                <Table.Td style={{ padding: '2px 6px' }}>{child.denialCode && child.denialCode !== '-' ? <Badge size="xs" variant="light" color="red">{child.denialCode}</Badge> : <Text size="xs" c="dimmed">-</Text>}</Table.Td>
                              )}
                              <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(child.conf_payer_payable)}</Text></Table.Td>
                              <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(child.auth_payer_payable || child.conf_payer_payable)}</Text></Table.Td>
                              {isRemittance && (
                                <Table.Td ta="right" style={{ padding: '2px 6px' }}>
                                  <Text size="xs" c={child.ra_payer_credit && parseFloat(String(child.ra_payer_credit)) > 0 ? (parseFloat(String(child.ra_payer_credit)) >= parseFloat(String(child.auth_payer_payable || child.conf_payer_payable || 0)) ? 'green' : 'orange') : 'dimmed'}>
                                    {fmtCurrency(child.ra_payer_credit || 0)}
                                  </Text>
                                </Table.Td>
                              )}
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                    {isRemittance && hasRaRemarks && (
                      <Box p="xs" style={{ borderTop: '1px solid var(--mantine-color-border)', backgroundColor: 'var(--mantine-color-body)' }}>
                        <Group gap="xs" align="flex-start" wrap="nowrap" px="xs">
                          <Text size="xs" fw={800} c="red" style={{ flexShrink: 0 }}>RA Remarks:</Text>
                          <Text size="xs" fw={700} c="red" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', flex: 1, lineHeight: 1.45 }}>{fileComment}</Text>
                        </Group>
                      </Box>
                    )}
                  </Box>
                )}
              </AppCard>
            )
          })}
        </Stack>
      )}
    </AppCard>
  )
}
