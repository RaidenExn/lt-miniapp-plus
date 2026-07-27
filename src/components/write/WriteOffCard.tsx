import React, { useState } from 'react'
import { Group, Text, Textarea, Button, Badge } from '@mantine/core'
import { DollarSign, CheckCircle2 } from 'lucide-react'
import { AppCard } from '../common/AppCard'
import { ehrService } from '../../services/EhrService'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'

interface WriteOffCardProps {
  encounterData: any
  primaryColor?: string
}

export const WriteOffCard: React.FC<WriteOffCardProps> = ({
  encounterData,
  primaryColor = 'blue'
}) => {
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const selectedRow = encounterData?.selected
  const activities = encounterData?.activities || []

  const writeOffItems = activities
    .filter((act: any) => Number(act.total_rej_amount || act.rej_amount || 0) > 0)
    .map((act: any) => ({
      itemId: Number(act.bill_item_id || act.activity_id || 0),
      amount: parseFloat(act.total_rej_amount || act.rej_amount || 0)
    }))

  const writeAmount = writeOffItems.reduce((sum: number, item: any) => sum + item.amount, 0)

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      showToast({ title: 'Validation Error', message: 'Enter write-off remarks before posting', tone: 'warning' })
      return
    }

    try {
      setIsSubmitting(true)
      await ehrService.postWriteOff(selectedRow, {
        remarks: remarks.trim(),
        writeAmount,
        writeOffItems
      })

      showToast({ title: 'Write-Off Posted', message: 'Write-off remarks and financial ledger committed successfully', tone: 'success' })
      setRemarks('')
      queryClient.invalidateQueries({ queryKey: ['encounter'] })
    } catch (err: any) {
      showToast({ title: 'Posting Failed', message: err.message || 'Could not post write-off transaction', tone: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppCard p="sm">
      <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
        <DollarSign size={14} color="var(--mantine-color-red-filled)" />
        <Text size="xs" fw={800}>
          WRITE-OFF REMARKS & LEDGER POSTING
        </Text>
        <Badge size="xs" variant="light" color="red">
          AED {writeAmount.toFixed(2)}
        </Badge>
      </Group>

      <Textarea
        placeholder="Enter mandatory write-off remarks or financial justification..."
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
          color="red"
          loading={isSubmitting}
          leftSection={<CheckCircle2 size={13} />}
          onClick={handleSubmit}
        >
          Post Write-Off
        </Button>
      </Group>
    </AppCard>
  )
}
