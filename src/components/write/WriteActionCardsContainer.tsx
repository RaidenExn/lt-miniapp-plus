import React from 'react'
import { Stack } from '@mantine/core'
import { useWriteConfigStore } from '../../store/useWriteConfigStore'
import { WriteResubmissionCard } from './WriteResubmissionCard'
import { WriteRaRemarksCard } from './WriteRaRemarksCard'
import { WriteOffCard } from './WriteOffCard'

interface WriteActionCardsContainerProps {
  encounterData: any
  primaryColor?: string
}

export const WriteActionCardsContainer: React.FC<WriteActionCardsContainerProps> = ({
  encounterData,
  primaryColor = 'blue'
}) => {
  const isWriteEnabled = useWriteConfigStore((state) => state.isWriteEnabled)
  const capabilities = useWriteConfigStore((state) => state.capabilities)

  if (!isWriteEnabled) return null

  return (
    <Stack gap="sm">
      {capabilities.saveResubmissionReason && (
        <WriteResubmissionCard encounterData={encounterData} primaryColor={primaryColor} />
      )}
      {capabilities.saveRaRemarks && (
        <WriteRaRemarksCard encounterData={encounterData} primaryColor={primaryColor} />
      )}
      {capabilities.postWriteOff && (
        <WriteOffCard encounterData={encounterData} primaryColor={primaryColor} />
      )}
    </Stack>
  )
}
