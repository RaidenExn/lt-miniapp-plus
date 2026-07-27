import React, { useState } from 'react'
import { Group, Text, Select, Textarea, Button, Badge } from '@mantine/core'
import { FileEdit, Send } from 'lucide-react'
import { AppCard } from '../common/AppCard'
import { ehrService } from '../../services/EhrService'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'

interface WriteResubmissionCardProps {
  encounterData: any
  primaryColor?: string
}

export const WriteResubmissionCard: React.FC<WriteResubmissionCardProps> = ({
  encounterData,
  primaryColor = 'blue'
}) => {
  const queryClient = useQueryClient()
  const [resubmitType, setResubmitType] = useState<string>('1')
  const [raFileId, setRaFileId] = useState<string>('')
  const [comments, setComments] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const selectedRow = encounterData?.selected
  const resubFiles = encounterData?.resubmissionFiles || []

  const fileOptions = resubFiles.map((file: any) => ({
    value: String(file.file_id || file.fileId || file.id || ''),
    label: `${file.file_name || file.fileName || 'RA File'} (${file.created_on || file.date || ''})`
  }))

  const handleSubmit = async () => {
    if (!comments.trim()) {
      showToast({ title: 'Validation Error', message: 'Enter resubmission comments before saving', tone: 'warning' })
      return
    }
    if (!raFileId && fileOptions.length > 0) {
      showToast({ title: 'Validation Error', message: 'Select an RA File before saving', tone: 'warning' })
      return
    }

    try {
      setIsSubmitting(true)
      await ehrService.saveResubmissionReason(selectedRow, {
        resubmitType: Number(resubmitType),
        raFileId: Number(raFileId || fileOptions[0]?.value || 0),
        comments: comments.trim()
      })

      showToast({ title: 'Resubmission Saved', message: 'Resubmission reason submitted successfully to EMR', tone: 'success' })
      setComments('')
      queryClient.invalidateQueries({ queryKey: ['encounter'] })
    } catch (err: any) {
      showToast({ title: 'Submission Failed', message: err.message || 'Could not save resubmission reason', tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppCard p="sm">
      <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
        <FileEdit size={14} color={`var(--mantine-color-${primaryColor}-filled)`} />
        <Text size="xs" fw={800}>
          WRITE RESUBMISSION REASON
        </Text>
        <Badge size="xs" variant="light" color={primaryColor}>
          ADDON
        </Badge>
      </Group>

      <Group grow align="flex-start" mb="xs">
        <Select
          label="Resubmission Type"
          size="xs"
          data={[
            { value: '1', label: '1 - Correction' },
            { value: '2', label: '2 - Internal Complaints' },
            { value: '3', label: '3 - Reconciliation' }
          ]}
          value={resubmitType}
          onChange={(val) => setResubmitType(val || '1')}
        />
        <Select
          label="Remittance Advice (RA) File"
          size="xs"
          placeholder="Select RA File"
          data={fileOptions}
          value={raFileId}
          onChange={(val) => setRaFileId(val || '')}
        />
      </Group>

      <Textarea
        label="Resubmission Comments"
        placeholder="Enter detailed resubmission comments or justification..."
        size="xs"
        minRows={2}
        maxRows={4}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
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
          Save Resubmission
        </Button>
      </Group>
    </AppCard>
  )
}
