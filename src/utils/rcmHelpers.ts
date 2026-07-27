export function derivePriorAuthCode(row: any): string {
  if (!row) return ''
  if (row.derived_prior_auth && typeof row.derived_prior_auth === 'string') {
    const trimmed = row.derived_prior_auth.trim()
    if (trimmed && trimmed !== '-') return trimmed
  }

  const lineCandidates = [
    row.prior_auth_no,
    row.prior_auth_code,
    row.prior_auth_number,
    row.prior_authorization_number,
    row.payer_auth_id,
    row.claimAuthNumber,
    row.idPayer,
    row.auth_number,
    row.authorization_number
  ]

  for (const c of lineCandidates) {
    if (c !== undefined && c !== null) {
      const s = String(c).trim()
      if (
        s === '' ||
        s === '0' ||
        s === '-' ||
        s.toLowerCase() === 'not authorized' ||
        s.toLowerCase() === 'null' ||
        s.toLowerCase() === 'undefined'
      ) {
        continue
      }
      if (
        s.toLowerCase().includes('.xml') ||
        s.toLowerCase().includes('.html') ||
        /^dha-/i.test(s) ||
        s.split('-').length >= 4 ||
        s.length > 50 ||
        /\b(approved|denied|pending|reject|remark|comment|reason|history|none|null|undefined|not required)\b/i.test(s)
      ) {
        continue
      }
      return s
    }
  }

  return ''
}
