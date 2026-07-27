import React, { useState, useRef, useCallback } from 'react'
import { Box, Flex, Stack } from '@mantine/core'
import { RemarksAndResubmissionsCard } from '../RemarksAndResubmissionsCard'
import { LabResults } from '../LabResults'
import { WriteActionCardsContainer } from './WriteActionCardsContainer'

interface WriteWorkspaceProps {
  encounterData: any
  primaryColor?: string
}

export const WriteWorkspace: React.FC<WriteWorkspaceProps> = ({
  encounterData,
  primaryColor = 'blue'
}) => {
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50)
  const isDraggingRef = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const offsetX = moveEvent.clientX - rect.left
      const newPercent = Math.max(30, Math.min(70, (offsetX / rect.width) * 100))
      setLeftWidthPercent(newPercent)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <Box ref={containerRef} style={{ width: '100%' }}>
      <Flex gap={0} align="stretch" direction={{ base: 'column', md: 'row' }}>
        {/* Left Reference Pane */}
        <Box style={{ width: `${leftWidthPercent}%`, flexShrink: 0 }}>
          <Stack gap="md" pr={{ base: 0, md: 'xs' }}>
            <RemarksAndResubmissionsCard
              remarks={encounterData.remarks || encounterData.claimRemarks}
              resubmissions={encounterData.resubmissionFiles}
              resubmissionReasons={encounterData.resubmissionReasons}
              claimHistory={encounterData.remittanceHistory}
            />
            <LabResults
              attachments={encounterData.attachments}
              openPdfInNewTab={(url) => window.open(url, '_blank')}
              selectedRow={encounterData.selected}
            />
          </Stack>
        </Box>

        {/* Draggable Splitter Bar */}
        <Box
          onMouseDown={handleMouseDown}
          style={{
            width: '8px',
            cursor: 'col-resize',
            backgroundColor: 'var(--mantine-color-border)',
            borderRadius: '4px',
            margin: '0 4px',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `var(--mantine-color-${primaryColor}-filled)`)}
          onMouseLeave={(e) => {
            if (!isDraggingRef.current) {
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-border)'
            }
          }}
        >
          <Box style={{ width: '2px', height: '24px', backgroundColor: 'var(--mantine-color-dimmed)', borderRadius: '1px' }} />
        </Box>

        {/* Right Write Actions Pane */}
        <Box style={{ width: `${100 - leftWidthPercent}%`, flexShrink: 0 }}>
          <Stack gap="md" pl={{ base: 0, md: 'xs' }}>
            <WriteActionCardsContainer encounterData={encounterData} primaryColor={primaryColor} />
          </Stack>
        </Box>
      </Flex>
    </Box>
  )
}
