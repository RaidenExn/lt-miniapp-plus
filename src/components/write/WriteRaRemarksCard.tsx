import React, { useState, useMemo } from 'react'
import { Group, Text, Textarea, Button } from '@mantine/core'
import { MessageSquarePlus, Send } from 'lucide-react'
import { AppCard } from '../common/AppCard'
import { ehrService } from '../../services/EhrService'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'
import { useWriteConfigStore } from '../../store/useWriteConfigStore'
import { calculateRcmFinances } from '../../../../shared/utils/helpers'
import { fmtCurrency } from '../../utils/formatters'

interface WriteRaRemarksCardProps {
  encounterData: any
  primaryColor?: string
}

export const WriteRaRemarksCard: React.FC<WriteRaRemarksCardProps> = ({
  encounterData,
  primaryColor = 'blue'
}) => {
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const selectedRow = encounterData?.selected
  const rowActions = useWriteConfigStore((state) => state.rowActions)
  const activities = encounterData?.activities || []

  const finances = useMemo(() => {
    return calculateRcmFinances(activities, rowActions, false)
  }, [activities, rowActions])

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      showToast({ title: 'Validation Error', message: 'Enter RA remarks before saving', tone: 'warning' })
      return
    }

    try {
      setIsSubmitting(true)
      await ehrService.saveRaRemarks(selectedRow, {
        remarks: remarks.trim(),
        tabStatusId: 1
      })

      showToast({ title: 'RA Remarks Saved', message: 'Remittance advice remarks committed successfully to EMR', tone: 'success' })
      setRemarks('')
      queryClient.invalidateQueries({ queryKey: ['encounter'] })
    } catch (err: any) {
      showToast({ title: 'Save Failed', message: err.message || 'Could not save RA remarks', tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppCard p="sm">
      <Group justify="space-between" align="center" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
        <Group gap="xs" align="center">
          <MessageSquarePlus size={14} color={`var(--mantine-color-${primaryColor}-filled)`} />
          <Text size="xs" fw={800}>
            WRITE RA REMARKS
          </Text>
        </Group>

        <AppCard px="xs" py={1} style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
          <Group gap={8} align="center" wrap="nowrap">
            <Text size="xs" fw={500} style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
              Gross Re-sub:{' '}
              <Text component="span" fw={700} c={finances.grossResub > 0 ? 'orange' : undefined}>
                {fmtCurrency(finances.grossResub)}
              </Text>
            </Text>
            <Text size="xs" c="dimmed" style={{ opacity: 0.4 }}>|</Text>
            <Text size="xs" fw={500} style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
              Gross W-off:{' '}
              <Text component="span" fw={700} c={finances.grossWriteOff > 0 ? 'red' : undefined}>
                {fmtCurrency(finances.grossWriteOff)}
              </Text>
            </Text>
            <Text size="xs" c="dimmed" style={{ opacity: 0.4 }}>|</Text>
            <Text size="xs" fw={500} style={{ whiteSpace: 'nowrap', fontSize: '11px' }}>
              Pending W-off:{' '}
              <Text component="span" fw={700} c={finances.pendingWriteOff > 0 ? 'red' : undefined}>
                {fmtCurrency(finances.pendingWriteOff)}
              </Text>
            </Text>
          </Group>
        </AppCard>
      </Group>

      <Textarea
        placeholder="Type RA remarks for eligible activities..."
        size="xs"
        minRows={2}
        maxRows={4}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        mb="xs"
      />

      <Group justify="flex-end">
        <Button
          size="xs"
          color={primaryColor}
          loading={isSubmitting}
          leftSection={<Send size={13} />}
          onClick={handleSubmit}
        >
          Save RA Remarks
        </Button>
      </Group>
    </AppCard>
  )
}
