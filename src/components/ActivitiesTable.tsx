import { useMemo, useState } from 'react'
import { Table, Text, Tooltip, Select } from '@mantine/core'
import { derivePriorAuthCode } from '../utils/rcmHelpers'
import { DataTableCard } from './common/DataTableCard'
import { fmtCurrency } from '../utils/formatters'
import { useWriteConfigStore } from '../store/useWriteConfigStore'

export interface ClaimHistoryItem {
  file_id?: string | number; file_name?: string; ra_file_name?: string; transact_date?: string
  ra_id_payer?: string; idPayer?: string; payment_ref?: string; conf_payer_payable?: number | string
  auth_payer_payable?: number | string; ra_payer_credit?: number | string; ra_claim_comment?: string
  remarks?: string; children?: any[]; [key: string]: any
}

export interface ActivityItem {
  code?: string; activity_code?: string; order_name?: string; activity_name?: string
  order_type_desc?: string; activity_type?: string; claim_quantity?: number | string; claim_qty?: number | string
  quantity?: number | string; claim_patient_pay?: number | string; claim_payer_pay?: number | string
  claim_net_payable?: number | string; claim_net_pay?: number | string; gross_amount?: number | string
  ra_qty?: number | string; ra_pat_payable?: number | string; ra_patient_share?: number | string
  ra_payer_payable?: number | string; ra_payer_share?: number | string; total_ra_amount?: number | string
  ra_net_payable?: number | string; total_rej_amount?: number | string; rej_amount?: number | string
  derived_ra_status?: string; activity_status?: string; status?: string; claim_status?: string
  claim_denial_code?: string; claim_denial_desc?: string; refusal_for_auth_reason?: string; comments?: string
  payer_auth_id?: string; claimAuthNumber?: string; auth_number?: string; order_authorization_id?: number | string; _has_ra?: boolean
  [key: string]: any
}

interface ActivitiesTableProps {
  activities?: ActivityItem[]
  claimHistory?: ClaimHistoryItem[]
}

const num = (val: any): number => {
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

const mapRaStatus = (row: ActivityItem): string => {
  if (!row) return 'Billed'
  if (row.derived_ra_status) {
    const s = String(row.derived_ra_status).trim()
    if (s.toLowerCase() === 'full remittance' || s.toLowerCase() === 'full ra') return 'Full RA'
    if (s.toLowerCase() === 'partial remittance' || s.toLowerCase() === 'partial ra') return 'Partial RA'
    if (s.toLowerCase() === 'denied' || s.toLowerCase() === 'denial') return 'Denial'
    return s
  }
  const claimGross = num(row.claim_net_payable || row.claim_net_pay || row.gross_amount)
  const claimPatient = num(row.claim_patient_pay)
  const claimPayer = num(row.claim_payer_pay || Math.max(0, claimGross - claimPatient))
  const raGross = num(row.total_ra_amount || row.ra_net_payable)
  const raPatient = num(row.ra_pat_payable || row.ra_patient_share)
  const raPayer = num(row.ra_payer_payable || row.ra_payer_share)

  const hasExplicitRa =
    !!row._has_ra ||
    !!row.ra_id_payer ||
    !!row.payment_ref ||
    raPayer !== 0 ||
    raGross !== 0 ||
    ((row.claim_denial_code || '').trim() !== '' && (row.claim_denial_desc || '').trim() !== '')

  if (hasExplicitRa) {
    if (raPayer < 0) return 'Recovery'
    if (claimPayer > 0 && raPayer > claimPayer) return 'RA Error'
    if (claimPayer > 0 && raPayer > 0 && raPayer === claimPayer) return 'Full RA'
    if (claimPayer > 0 && raPayer > 0 && raPayer < claimPayer) return 'Partial RA'
    if (claimPayer > 0 && raPayer === 0) return 'Denial'

    const isDenied = (row.claim_denial_code || '').trim() !== '' || Number(row.claim_auth_status) === 2
    if (isDenied) return 'Denial'

    return row.status || 'Remitted'
  }

  const isSubmitted =
    !!row._has_submission ||
    Number(row.claim_resubmission_count || 0) > 0 ||
    !!row.submitted_date ||
    !!row.resubmission_date

  return isSubmitted ? 'Submitted' : 'Billed'
}

const isRowActionEligible = (row: ActivityItem): boolean => {
  if (Number(row.pending_for_write_off || 0) === 2) return false
  const raStatusStr = mapRaStatus(row)
  if (raStatusStr === 'Denial' || raStatusStr === 'Partial RA') return true
  const rejAmt = num(row.total_rej_amount || row.rej_amount)
  if (rejAmt > 0) return true
  if (Number(row.claim_auth_status) === 2 || Number(row.claim_is_partial_activity) === 1) return true
  return String(row.claim_denial_code || '').trim() !== ''
}

const getRaStatusRank = (statusStr: string): number => {
  const s = statusStr.toLowerCase()
  if (s.includes('full')) return 1
  if (s.includes('partial')) return 2
  if (s.includes('denial') || s.includes('denied')) return 3
  return 4
}

const getRaStatusColor = (statusStr: string, claimGross: number): { color?: string; weight: number } => {
  if (claimGross === 0) return { color: undefined, weight: 400 }
  const s = statusStr.toLowerCase()
  if (s.includes('denial') || s.includes('denied')) return { color: 'red', weight: 700 }
  if (s.includes('partial')) return { color: 'orange', weight: 700 }
  if (s.includes('full')) return { color: 'green', weight: 700 }
  return { color: undefined, weight: 400 }
}

export function ActivitiesTable({ activities = [], claimHistory = [] }: ActivitiesTableProps) {
  const isWriteEnabled = useWriteConfigStore((state) => state.isWriteEnabled)
  const [rowActions, setRowActions] = useState<Record<string, string>>({})

  const showRaColumns = useMemo(() => {
    const hasHistoryRa = claimHistory?.some((row) =>
      Boolean(row.payment_ref || row.ra_id_payer || (row.file_name || row.ra_file_name || '').toLowerCase().includes('rem_') || (row.ra_payer_credit && parseFloat(String(row.ra_payer_credit)) > 0))
    )
    const hasActivityRa = activities.some((r) => r._has_ra || r.ra_id_payer || num(r.total_ra_amount || r.ra_net_payable) !== 0)
    return hasHistoryRa || hasActivityRa
  }, [activities, claimHistory])

  // Sort activities by RA status priority: Full RA -> Partial RA -> Denial (bottom)
  const sortedActivities = useMemo(() => {
    if (!activities) return []
    return [...activities].sort((a, b) => {
      const rankA = getRaStatusRank(mapRaStatus(a))
      const rankB = getRaStatusRank(mapRaStatus(b))
      return rankA - rankB
    })
  }, [activities])

  const totals = useMemo(() => {
    return sortedActivities.reduce((acc, act) => {
      const claimGross = num(act.claim_net_payable || act.claim_net_pay || act.gross_amount)
      const claimPatient = num(act.claim_patient_pay)
      const claimPayer = num(act.claim_payer_pay || Math.max(0, claimGross - claimPatient))
      const raGross = num(act.total_ra_amount || act.ra_net_payable)
      const raPatient = num(act.ra_pat_payable || act.ra_patient_share)
      const raPayer = num(act.ra_payer_payable || act.ra_payer_share || Math.max(0, raGross - raPatient))
      const rejAmt = num(act.total_rej_amount || act.rej_amount || Math.max(0, claimGross - raGross))

      acc.claimGross += claimGross; acc.claimPatient += claimPatient; acc.claimPayer += claimPayer
      acc.raGross += raGross; acc.raPatient += raPatient; acc.raPayer += raPayer; acc.rejected += rejAmt
      return acc
    }, { claimGross: 0, claimPatient: 0, claimPayer: 0, raGross: 0, raPatient: 0, raPayer: 0, rejected: 0 })
  }, [sortedActivities])

  const columns = useMemo(() => {
    const cols: Array<{ label: string; width?: string | number; align?: 'left' | 'center' | 'right' }> = [
      { label: 'Code', width: 85 },
      { label: 'Description', width: 200 },
      { label: 'C', align: 'right', width: 40 },
      { label: 'C.Pat', align: 'right', width: 75 },
      { label: 'C.Pay', align: 'right', width: 75 },
      { label: 'C.Grs', align: 'right', width: 75 },
      { label: 'Auth', align: 'left', width: 95 }
    ]
    if (showRaColumns) {
      cols.push(
        { label: 'R', align: 'right', width: 40 },
        { label: 'RA.Pat', align: 'right', width: 75 },
        { label: 'RA.Pay', align: 'right', width: 75 },
        { label: 'RA.Grs', align: 'right', width: 75 },
        { label: 'Rej', align: 'right', width: 75 },
        { label: 'St.', align: 'left', width: 90 },
        { label: 'RA St.', align: 'left', width: 85 },
        { label: 'Denial', align: 'left', width: 90 }
      )
    } else {
      cols.push({ label: 'St.', align: 'left', width: 85 })
    }
    return cols
  }, [showRaColumns])

  return (
    <DataTableCard title="CLINICAL ACTIVITIES" count={sortedActivities?.length || 0} columns={columns} isEmpty={!sortedActivities || sortedActivities.length === 0} emptyText="No Clinical Activities recorded." maxHeight={500} verticalSpacing={2} horizontalSpacing="xs">
      {sortedActivities.map((act, idx) => {
        const cpt = act.code || act.activity_code || '-'
        const desc = act.order_name || act.activity_name || '-'
        const claimQty = act.claim_quantity || act.claim_qty || act.quantity || 1
        const claimGross = num(act.claim_net_payable || act.claim_net_pay || act.gross_amount)
        const claimPatient = num(act.claim_patient_pay)
        const claimPayer = num(act.claim_payer_pay || Math.max(0, claimGross - claimPatient))

        const raQty = act.ra_qty || claimQty
        const raGross = num(act.total_ra_amount || act.ra_net_payable)
        const raPatient = num(act.ra_pat_payable || act.ra_patient_share)
        const raPayer = num(act.ra_payer_payable || act.ra_payer_share || Math.max(0, raGross - raPatient))
        const rejAmt = num(act.total_rej_amount || act.rej_amount || Math.max(0, claimGross - raGross))

        const raStatusStr = mapRaStatus(act)
        const raStyle = getRaStatusColor(raStatusStr, claimGross)
        const authId = String(act.order_authorization_id || idx)

        return (
          <Table.Tr key={cpt + idx}>
            <Table.Td style={{ padding: '2px 6px' }}><Tooltip label={act.order_type_desc || act.activity_type || 'Service'} openDelay={0} closeDelay={0} withinPortal zIndex={3000}><Text size="xs">{cpt}</Text></Tooltip></Table.Td>
            <Table.Td style={{ padding: '2px 6px' }}><Tooltip label={desc} disabled={desc.length <= 30} openDelay={0} closeDelay={0} withinPortal zIndex={3000}><Text size="xs" truncate>{desc}</Text></Tooltip></Table.Td>
            <Table.Td ta="right" style={{ padding: '2px 6px' }}><Tooltip label="Claim Quantity" openDelay={0} closeDelay={0} withinPortal zIndex={3000}><Text size="xs">{claimQty}</Text></Tooltip></Table.Td>
            <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(claimPatient)}</Text></Table.Td>
            <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(claimPayer)}</Text></Table.Td>
            <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(claimGross)}</Text></Table.Td>
            <Table.Td style={{ padding: '2px 6px' }}><Text size="xs">{derivePriorAuthCode(act) || '-'}</Text></Table.Td>

            {showRaColumns && (
              <>
                <Table.Td ta="right" style={{ padding: '2px 6px' }}><Tooltip label="RA Quantity" openDelay={0} closeDelay={0} withinPortal zIndex={3000}><Text size="xs">{raQty}</Text></Tooltip></Table.Td>
                <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(raPatient)}</Text></Table.Td>
                <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(raPayer)}</Text></Table.Td>
                <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs">{fmtCurrency(raGross)}</Text></Table.Td>
                <Table.Td ta="right" style={{ padding: '2px 6px' }}><Text size="xs" c={rejAmt > 0 ? 'red' : undefined} fw={rejAmt > 0 ? 700 : undefined}>{fmtCurrency(rejAmt)}</Text></Table.Td>
              </>
            )}

            <Table.Td style={{ padding: '2px 6px' }}>
              {isWriteEnabled && isRowActionEligible(act) ? (
                <Select
                  size="xs"
                  w={80}
                  data={[
                    { value: 'none', label: act.activity_status || 'Completed' },
                    { value: 're-sub', label: 'Resub' },
                    { value: 'w-off', label: 'Write-off' },
                    { value: 'close', label: 'Close' }
                  ]}
                  value={rowActions[authId] || 'none'}
                  onChange={(val) => setRowActions({ ...rowActions, [authId]: val || 'none' })}
                />
              ) : (
                <Text size="xs">{act.activity_status || act.status || 'Completed'}</Text>
              )}
            </Table.Td>

            {showRaColumns && (
              <Table.Td style={{ padding: '2px 6px' }}>
                <Text size="xs" c={raStyle.color} fw={raStyle.weight}>
                  {raStatusStr}
                </Text>
              </Table.Td>
            )}

            {showRaColumns && (
              <Table.Td style={{ padding: '2px 6px' }}>
                {act.claim_denial_code ? (
                  <Tooltip label={`[${act.claim_denial_code}] ${act.refusal_for_auth_reason || act.claim_denial_desc || ''}`} openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
                    <Text size="xs" c="red" fw={700}>{act.claim_denial_code}</Text>
                  </Tooltip>
                ) : <Text size="xs" c="dimmed">-</Text>}
              </Table.Td>
            )}
          </Table.Tr>
        )
      })}

      <Table.Tr style={{ fontWeight: 800, borderTop: '2px solid var(--mantine-color-border)' }}>
        <Table.Td colSpan={2}><Text size="xs" fw={800}>TOTALS</Text></Table.Td>
        <Table.Td ta="right"><Text size="xs" fw={800}>-</Text></Table.Td>
        <Table.Td ta="right"><Text size="xs" fw={800}>{fmtCurrency(totals.claimPatient)}</Text></Table.Td>
        <Table.Td ta="right"><Text size="xs" fw={800}>{fmtCurrency(totals.claimPayer)}</Text></Table.Td>
        <Table.Td ta="right"><Text size="xs" fw={800}>{fmtCurrency(totals.claimGross)}</Text></Table.Td>
        <Table.Td><Text size="xs" fw={800}>-</Text></Table.Td>
        {showRaColumns && (
          <>
            <Table.Td ta="right"><Text size="xs" fw={800}>-</Text></Table.Td>
            <Table.Td ta="right"><Text size="xs" fw={800}>{fmtCurrency(totals.raPatient)}</Text></Table.Td>
            <Table.Td ta="right"><Text size="xs" fw={800}>{fmtCurrency(totals.raPayer)}</Text></Table.Td>
            <Table.Td ta="right"><Text size="xs" fw={800}>{fmtCurrency(totals.raGross)}</Text></Table.Td>
            <Table.Td ta="right"><Text size="xs" c={totals.rejected > 0 ? 'red' : undefined} fw={800}>{fmtCurrency(totals.rejected)}</Text></Table.Td>
            <Table.Td colSpan={3} />
          </>
        )}
      </Table.Tr>
    </DataTableCard>
  )
}
