import { useMemo } from 'react'
import { ClaimHistoryItem } from '../components/ClaimHistoryTable'

export interface ProcessedClaimHistoryItem extends ClaimHistoryItem {
  badgeLabel: string
  badgeColor: string
  fileRateCardTotal: number
  fileClaimedTotal: number
  fileRaTotal: number | null
  isRemittance: boolean
  fileName: string
  transactDate: string
  fileComment: string
  hasRaRemarks: boolean
  children: any[]
}

const getOrdinalPrefix = (n: number): string => {
  if (n <= 1) return ''
  if (n === 2) return '2ND '
  if (n === 3) return '3RD '
  return `${n}TH `
}

export function useClaimHistory(claimHistory: ClaimHistoryItem[] = []) {
  return useMemo(() => {
    if (!claimHistory || claimHistory.length === 0) {
      return {
        processedHistory: [] as ProcessedClaimHistoryItem[],
        lastFileMode: null as string | null,
        isEmpty: true
      }
    }

    let raCount = 0
    let initialSubCount = 0
    let resubCount = 0
    let reconCount = 0

    const processedHistory: ProcessedClaimHistoryItem[] = claimHistory.map((row) => {
      const fileName = (row.file_name || row.ra_file_name || 'Manual').trim()
      const transactDate = row.transact_date || '-'
      const fileComment = (row.ra_claim_comment || row.remarks || '').trim()
      const hasRaRemarks = Boolean(fileComment && fileComment !== '-')
      const children = row.children || []

      const hasExplicitRaCredit =
        (row.ra_payer_credit !== undefined && row.ra_payer_credit !== null) ||
        children.some((c) => c.ra_payer_credit !== null && c.ra_payer_credit !== undefined)

      const isRemittance =
        hasExplicitRaCredit ||
        hasRaRemarks ||
        Boolean(row.payment_ref) ||
        Boolean(row.ra_id_payer) ||
        fileName.toLowerCase().includes('rem_') ||
        fileName.toLowerCase().includes('rejected') ||
        fileName.toLowerCase().includes('ra_')

      // Compute Financial Totals
      const fileRateCardTotal =
        row.conf_payer_payable !== undefined && row.conf_payer_payable !== null
          ? parseFloat(String(row.conf_payer_payable)) || 0
          : children.reduce((sum, c) => sum + (parseFloat(String(c.conf_payer_payable)) || 0), 0)

      const fileClaimedTotal =
        row.auth_payer_payable !== undefined && row.auth_payer_payable !== null
          ? parseFloat(String(row.auth_payer_payable)) || 0
          : children.reduce(
              (sum, c) => sum + (parseFloat(String(c.auth_payer_payable || c.conf_payer_payable)) || 0),
              0
            )

      const fileRaTotal = isRemittance
        ? row.ra_payer_credit !== undefined && row.ra_payer_credit !== null
          ? parseFloat(String(row.ra_payer_credit)) || 0
          : children.reduce((sum, c) => sum + (parseFloat(String(c.ra_payer_credit)) || 0), 0)
        : null

      let badgeLabel = ''
      let badgeColor = 'blue'

      if (isRemittance) {
        raCount += 1
        const prefix = getOrdinalPrefix(raCount)
        badgeLabel = raCount === 1 ? 'REMITTANCE ADVICE' : `${prefix}REMITTANCE ADVICE`

        const raVal = fileRaTotal || 0
        const claimedVal = fileClaimedTotal > 0 ? fileClaimedTotal : fileRateCardTotal

        if (raVal <= 0 || fileName.toLowerCase().includes('rejected')) {
          badgeColor = 'red'
        } else if (claimedVal > 0 && raVal < claimedVal) {
          badgeColor = 'orange'
        } else {
          badgeColor = 'green'
        }
      } else {
        const reasonStr = (
          row.resubmission_type ||
          row.resubmission_reason ||
          row.resubmissionReason ||
          row.resubmit_reason_type ||
          fileComment ||
          ''
        ).toLowerCase()

        const isReconciliation =
          reasonStr.includes('reconcil') || reasonStr.includes('recon') || fileName.toLowerCase().includes('recon')

        if (isReconciliation) {
          reconCount += 1
          const prefix = getOrdinalPrefix(reconCount)
          badgeLabel = reconCount === 1 ? 'RECONCILIATION' : `${prefix}RECONCILIATION`
          badgeColor = 'grape'
        } else {
          initialSubCount += 1
          if (initialSubCount === 1) {
            badgeLabel = 'SUBMISSION'
            badgeColor = 'blue'
          } else {
            resubCount += 1
            const prefix = getOrdinalPrefix(resubCount)
            badgeLabel = resubCount === 1 ? 'RESUBMISSION' : `${prefix}RESUBMISSION`
            badgeColor = 'cyan'
          }
        }
      }

      return {
        ...row,
        row,
        badgeLabel,
        badgeColor,
        fileRateCardTotal,
        fileClaimedTotal,
        fileRaTotal,
        isRemittance,
        fileName,
        transactDate,
        fileComment,
        hasRaRemarks,
        children: row.children || []
      }
    })

    const lastFileMode = processedHistory.length > 0 ? processedHistory[processedHistory.length - 1].badgeLabel : null

    return {
      processedHistory,
      lastFileMode,
      isEmpty: false
    }
  }, [claimHistory])
}
