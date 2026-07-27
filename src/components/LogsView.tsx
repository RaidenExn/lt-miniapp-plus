import { useState, useEffect, useRef } from 'react'
import { Box, Text, Group, Button, Center, Stack, Tooltip, useComputedColorScheme } from '@mantine/core'
import { AppCard } from './common/AppCard'
import { ArrowDown, Terminal, Activity, Download, Trash2 } from 'lucide-react'
import { loggerService, LogEntry, LogCategory } from '../services/LoggerService'
import { showToast } from '../utils/toast'

export function LogsView() {
  const computedColorScheme = useComputedColorScheme('dark')
  const isDark = computedColorScheme === 'dark'
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [storageBytes, setStorageBytes] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateStorage = async () => {
    const bytes = await loggerService.getStorageBytes()
    setStorageBytes(bytes)
  }

  useEffect(() => {
    updateStorage()
    return loggerService.subscribe((updated) => {
      setLogs([...updated].reverse())
      updateStorage()
    })
  }, [])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 25)
  }

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
      setIsAtBottom(true)
    }
  }

  useEffect(() => {
    if (isAtBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, isAtBottom])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      e.stopPropagation()
      const sel = window.getSelection()
      const range = document.createRange()
      if (containerRef.current && sel) {
        range.selectNodeContents(containerRef.current)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }

  const handleClearLogs = async () => {
    await loggerService.clear()
    setStorageBytes(0)
    showToast({
      title: 'Logs Cleared',
      message: 'All system logs have been purged from memory and storage.',
      tone: 'ok'
    })
  }

  const handleExportLogs = () => {
    if (logs.length === 0) {
      showToast({
        title: 'Export Skipped',
        message: 'No log entries available to export.',
        tone: 'warning'
      })
      return
    }
    loggerService.exportLogs()
    showToast({
      title: 'Logs Exported',
      message: `Downloaded .log file containing ${logs.length} system entries.`,
      tone: 'ok'
    })
  }

  const getCategoryColor = (cat: LogCategory) => {
    switch (cat) {
      case 'HTTP':
        return isDark ? 'teal.4' : 'teal.7'
      case 'UI':
        return isDark ? 'grape.4' : 'grape.7'
      case 'DB':
        return isDark ? 'cyan.4' : 'cyan.7'
      case 'INFO':
        return isDark ? 'blue.4' : 'blue.7'
      case 'WARN':
        return isDark ? 'yellow.4' : 'yellow.7'
      case 'ERROR':
        return isDark ? 'red.4' : 'red.7'
      default:
        return 'dimmed'
    }
  }

  const formatLogDetails = (details?: string) => {
    if (!details) return null
    try {
      const parsed = JSON.parse(details)
      return (
        <Text
          component="div"
          fz="10px"
          c={isDark ? 'gray.5' : 'dark.3'}
          pl="xs"
          mt={2}
          style={{
            borderLeft: `2px solid ${isDark ? '#373a40' : '#dee2e6'}`,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {JSON.stringify(parsed, null, 2)}
        </Text>
      )
    } catch {
      return (
        <Text component="span" c="dimmed" fz="10.5px">
          {' '}
          ({details})
        </Text>
      )
    }
  }

  const renderMessage = (message: string) => {
    const rawIdx = message.indexOf('RAW DATA: {')
    if (rawIdx !== -1) {
      const prefix = message.substring(0, rawIdx + 10)
      const jsonStr = message.substring(rawIdx + 10)
      try {
        const parsed = JSON.parse(jsonStr)
        return (
          <>
            <Text component="span" c={isDark ? 'gray.2' : 'dark.9'} fz="xs">
              {prefix}
            </Text>
            <Text
              component="div"
              fz="10px"
              c={isDark ? 'cyan.3' : 'cyan.8'}
              pl="sm"
              mt={2}
              style={{
                borderLeft: `2px solid ${isDark ? '#22b8cf' : '#1098ad'}`,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                backgroundColor: isDark ? 'rgba(34, 184, 207, 0.05)' : 'rgba(16, 152, 173, 0.05)',
                padding: '4px 8px',
                borderRadius: '3px'
              }}
            >
              {JSON.stringify(parsed, null, 2)}
            </Text>
          </>
        )
      } catch {
        /* ignore parse error */
      }
    }

    return (
      <Text component="span" c={isDark ? 'gray.2' : 'dark.9'} fz="xs">
        {message}
      </Text>
    )
  }

  return (
    <AppCard
      p={0}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header bar with App Running indicator and right-aligned Clear/Export buttons */}
      <Group
        justify="space-between"
        align="center"
        gap="xs"
        px="md"
        pt="md"
        pb="xs"
        style={{ borderBottom: '1px solid var(--mantine-color-border)' }}
      >
        <Group gap="xs" wrap="nowrap">
          <Activity size={14} color="orange" />
          <Text size="xs" fw={800}>
            SYSTEM LOGS
          </Text>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Tooltip
            label="Export all system logs as a .log file"
            openDelay={0}
            closeDelay={0}
            withinPortal
            zIndex={3000}
          >
            <Button
              size="xxs"
              variant="outline"
              color="blue"
              leftSection={<Download size={11} />}
              onClick={handleExportLogs}
              fz={10}
              h={22}
              px={8}
            >
              Export Logs
            </Button>
          </Tooltip>

          <Tooltip
            label="Clear all live and persistent system logs"
            openDelay={0}
            closeDelay={0}
            withinPortal
            zIndex={3000}
          >
            <Button
              size="xxs"
              variant="outline"
              color="red"
              leftSection={<Trash2 size={11} />}
              onClick={handleClearLogs}
              fz={10}
              h={22}
              px={8}
            >
              Clear Logs
            </Button>
          </Tooltip>
        </Group>
      </Group>

      <Box
        ref={containerRef}
        data-log-stream="true"
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        p="md"
        pt="xs"
        ff="monospace"
        fz="xs"
        c={isDark ? 'gray.3' : 'dark.8'}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          outline: 'none',
          userSelect: 'text'
        }}
      >
        {logs.length === 0 ? (
          <Center h="100%">
            <Stack align="center" gap="xs">
              <Terminal size={32} color="gray" style={{ opacity: 0.3 }} />
              <Text size="xs" c="dimmed" fw={700}>
                Live log stream active. Waiting for system events...
              </Text>
            </Stack>
          </Center>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: '3px 0',
                lineHeight: 1.45
              }}
            >
              <Text component="span" c="dimmed" fz="10.5px">
                [{log.timestamp}]
              </Text>{' '}
              <Text component="span" c={getCategoryColor(log.category)} fw={700} fz="10.5px">
                [{log.category}]
              </Text>{' '}
              {renderMessage(log.message)}
              {formatLogDetails(log.details)}
            </div>
          ))
        )}
      </Box>

      {/* Floating Auto-Scroll Resume Button */}
      {!isAtBottom && (
        <Button
          size="xs"
          variant="filled"
          color="orange"
          radius="xl"
          onClick={scrollToBottom}
          leftSection={<ArrowDown size={12} />}
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            fontSize: '10.5px',
            fontWeight: 700
          }}
        >
          Resume Auto-Scroll
        </Button>
      )}
    </AppCard>
  )
}
