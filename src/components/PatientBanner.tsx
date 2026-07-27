import React from 'react'
import { Group, Text, Tooltip, Box } from '@mantine/core'
import { AppCard } from './common/AppCard'
import { resolveRealEncounterStartTime } from '../utils/formatters'

interface PatientBannerProps {
  encounterData: any
}

function formatTrimmedAge(selected: any): string {
  if (!selected) return '-'
  const yrs = Number(selected.age_years ?? selected.years ?? 0)
  if (yrs >= 1) return `${Math.floor(yrs)} yr`
  const mths = Number(selected.age_months ?? selected.months ?? 0)
  if (mths >= 1) return `${Math.floor(mths)} m`
  const raw = String(selected.age || '').trim()
  return raw || '-'
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ encounterData }) => {
  if (!encounterData) return <Box style={{ flex: 1 }} />

  const selected = encounterData?.selected
  const pick = (...vals: any[]) => vals.find((v) => v && String(v).trim() !== '' && String(v).trim() !== '-') || '-'

  const patientName = selected?.patient_name || '-'
  const gender = selected?.description || selected?.gender || '-'
  const age = formatTrimmedAge(selected)
  const doctor = selected?.phy_name || selected?.physician_name || '-'

  const cardNo = pick(selected?.card_no, selected?.insurance_policy_id, selected?.cardNo, selected?.tpa_policy_id, encounterData?.activities?.[0]?.card_no)
  const receiver = pick(selected?.receiver_name, selected?.tpa_company_name, selected?.tpa_name, encounterData?.activities?.[0]?.receiver_name)
  const payer = pick(selected?.payer_name, selected?.insurance_company_name, selected?.payer, encounterData?.activities?.[0]?.payer_name)

  const items = [
    { label: `Patient: ${patientName}`, text: patientName, fw: 500 },
    { label: 'Gender', text: gender, color: 'orange' },
    { label: 'Age', text: age },
    { label: `Doctor: ${doctor}`, text: doctor },
    { label: `Card: ${cardNo}`, text: cardNo, fw: 500 },
    { label: `Receiver: ${receiver}`, text: receiver },
    { label: `Payer: ${payer}`, text: payer }
  ]

  return (
    <AppCard px="xs" py={2} style={{ flex: 1, minWidth: 0, height: 30, display: 'flex', justifyContent: 'center' }}>
      <Group gap={6} align="center" wrap="nowrap" justify="space-between" style={{ width: '100%', overflow: 'hidden' }}>
        {items.map((it, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <Text size="xs" c="dimmed" style={{ opacity: 0.4 }}>|</Text>}
            <Tooltip label={it.label} openDelay={0} closeDelay={0} withinPortal zIndex={3000}>
              <Text size="xs" fw={it.fw || 400} c={it.color} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {it.text}
              </Text>
            </Tooltip>
          </React.Fragment>
        ))}
      </Group>
    </AppCard>
  )
}
