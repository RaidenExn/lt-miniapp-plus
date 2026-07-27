import { Table, Badge, Text } from '@mantine/core'
import { DataTableCard } from './common/DataTableCard'

interface Diagnosis {
  code: string
  desc: string
  type: 'Primary' | 'Secondary'
}

interface ActiveDiagnosesProps {
  diagnoses: Diagnosis[]
}

const DIAGNOSES_COLUMNS = [
  { label: 'ICD-10', width: 100 },
  { label: 'Description' },
  { label: 'Type', width: 65, align: 'right' as const }
]

export function ActiveDiagnoses({ diagnoses }: ActiveDiagnosesProps) {
  const isEmpty = !diagnoses || diagnoses.length === 0

  return (
    <DataTableCard
      title="ACTIVE DIAGNOSES"
      count={diagnoses?.length}
      columns={DIAGNOSES_COLUMNS}
      isEmpty={isEmpty}
      emptyText="No Active Diagnoses recorded."
      verticalSpacing="2px"
      horizontalSpacing="xs"
    >
      {diagnoses?.map((diag, idx) => {
        const isPrimary = diag.type === 'Primary'
        return (
          <Table.Tr key={diag.code + idx}>
            <Table.Td style={{ padding: '3px 8px' }}>
              <Text size="xs" fw={700} fz={11} style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
                {diag.code}
              </Text>
            </Table.Td>
            <Table.Td style={{ padding: '3px 8px' }}>
              <Text size="xs" fz={11}>
                {diag.desc}
              </Text>
            </Table.Td>
            <Table.Td ta="right" style={{ padding: '2px 8px' }}>
              <Badge size="xs" color={isPrimary ? 'orange' : 'gray'} variant="light" h={18} fz={10} px={6}>
                {isPrimary ? 'pdx' : 'sdx'}
              </Badge>
            </Table.Td>
          </Table.Tr>
        )
      })}
    </DataTableCard>
  )
}
