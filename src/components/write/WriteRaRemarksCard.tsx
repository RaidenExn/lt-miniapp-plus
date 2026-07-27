import React, { useState } from 'react'
import { Group, Text, Textarea, Button, Badge } from '@mantine/core'
import { MessageSquarePlus, Send } from 'lucide-react'
import { AppCard } from '../common/AppCard'
import { ehrService } from '../../services/EhrService'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'

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
      <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
        <MessageSquarePlus size={14} color={`var(--mantine-color-${primaryColor}-filled)`} />
        <Text size="xs" fw={800}>
          WRITE RA REMARKS
        </Text>
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
