/**
 * Shared value, date, and currency formatting helpers for mini-pages-app
 */

export function fmtCurrency(val: any): string {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return String(val)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function fmtDate(val: any): string {
  if (!val) return '-'
  const str = String(val).trim()
  if (!str) return '-'

  // If already DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{2}[/-]\d{2}[/-]\d{4}/.test(str)) {
    return str.substring(0, 10).replace(/-/g, '/')
  }

  try {
    const d = new Date(str)
    if (isNaN(d.getTime())) return str
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return str
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function resolveRealEncounterStartTime(row: any): string {
  if (!row) return '-'

  const arrivedOn = (row.arrived_on || row.encounter_start_time || row.transact_date || '').trim()
  if (arrivedOn && arrivedOn !== '-') {
    const match = arrivedOn.match(/^(\d{2})[-/](\d{2})[-/](\d{4})\s+(\d{2}):(\d{2})/)
    if (match) {
      return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`
    }
  }

  const arrDate = (row.arriv_date || row.arrived_date || '').trim()
  const arrTime = (row.arriv_time || row.arrived_time || '').trim()
  if (arrDate && arrTime) {
    const cleanDate = arrDate.replace(/-/g, '/')
    return `${cleanDate} ${arrTime}`
  }

  const fallback = row.app_date_time || row.appointment_time || row.enc_date || row.start_date
  if (fallback && String(fallback).trim() && String(fallback).trim() !== '-') {
    return String(fallback).trim()
  }

  return '-'
}
