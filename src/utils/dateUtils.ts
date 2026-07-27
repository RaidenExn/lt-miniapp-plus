import dayjs from 'dayjs'

export function parseEncounterDate(selectedRow: any): Date {
  if (!selectedRow) return new Date()

  const raw =
    selectedRow.apnt_time ||
    selectedRow.apnt_st_time ||
    selectedRow.app_date_time ||
    selectedRow.enc_date ||
    selectedRow.start_date
  if (raw) {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d
  }

  const rawArrived = selectedRow.arrived_on || selectedRow.arrived_date
  if (rawArrived) {
    const match = String(rawArrived).match(/^(\d{2})[-/](\d{2})[-/](\d{4})/)
    if (match) {
      const d = new Date(`${match[3]}-${match[2]}-${match[1]}`)
      if (!isNaN(d.getTime())) return d
    }
  }

  return new Date()
}

export function getDefaultDatePreset(selectedRow?: any): [Date, Date] {
  const encDate = parseEncounterDate(selectedRow)
  const startDate = dayjs(encDate).subtract(24, 'month').startOf('day').toDate()
  const endDate = dayjs().endOf('day').toDate()
  return [startDate, endDate]
}

export function formatApiDate(date: Date | string | null): string {
  if (!date) return dayjs().format('YYYY-MM-DD')
  return dayjs(date).format('YYYY-MM-DD')
}
