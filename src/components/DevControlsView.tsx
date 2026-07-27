import React, { useState } from 'react'
import {
  Box,
  Group,
  Text,
  Stack,
  Switch,
  Checkbox,
  Button,
  Badge,
  TextInput,
  NumberInput,
  FileInput,
  Divider,
  Code
} from '@mantine/core'
import {
  Terminal,
  Upload,
  RotateCcw,
  Key,
  Database,
  CheckCircle2,
  FileCode2,
  Lock
} from 'lucide-react'
import { AppCard } from './common/AppCard'
import { useWriteConfigStore } from '../store/useWriteConfigStore'
import { ehrService } from '../services/EhrService'
import { showToast } from '../utils/toast'
import { useThemeStore } from '../theme'

export const DevControlsView: React.FC = () => {
  const primaryColor = useThemeStore((state) => state.primaryColor)

  const isWriteEnabled = useWriteConfigStore((state) => state.isWriteEnabled)
  const capabilities = useWriteConfigStore((state) => state.capabilities)
  const configSource = useWriteConfigStore((state) => state.configSource)
  const writeUserId = useWriteConfigStore((state) => state.writeUserId)
  const writeRole = useWriteConfigStore((state) => state.writeRole)
  const setWriteConfig = useWriteConfigStore((state) => state.setWriteConfig)
  const resetWriteConfig = useWriteConfigStore((state) => state.resetWriteConfig)

  const [settings, setSettings] = useState(ehrService.getSettings())
  const [jsonFile, setJsonFile] = useState<File | null>(null)

  const handleToggleMasterWrite = (enabled: boolean) => {
    setWriteConfig({
      writeEnabled: enabled,
      source: enabled ? 'default' : 'none'
    })
    showToast({
      title: 'Write Addon Master State Updated',
      message: enabled ? 'EMR Write capabilities enabled' : 'EMR Write capabilities disabled',
      tone: enabled ? 'success' : 'warning'
    })
  }

  const handleCapabilityChange = (key: keyof typeof capabilities, value: boolean) => {
    setWriteConfig({
      writeCapabilities: {
        ...capabilities,
        [key]: value
      },
      source: 'uploaded'
    })
  }

  const handleFileUpload = (file: File | null) => {
    setJsonFile(file)
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = JSON.parse(text)

        setWriteConfig({
          writeEnabled: parsed.writeEnabled ?? true,
          writeUserId: parsed.writeUserId ?? 1089,
          writeRole: parsed.writeRole || 'Config User',
          writeCapabilities: parsed.writeCapabilities || {},
          source: 'uploaded'
        })

        showToast({
          title: 'Config Uploaded Successfully',
          message: `Loaded configuration from ${file.name}`,
          tone: 'success'
        })
      } catch (err: any) {
        showToast({
          title: 'Invalid Config File',
          message: err.message || 'Could not parse JSON config',
          tone: 'error'
        })
      }
    }
    reader.readAsText(file)
  }

  const handleLoadSampleConfig = async () => {
    try {
      const res = await fetch('/lt-miniapp-plus/write_config.sample.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const sample = await res.json()

      setWriteConfig({
        writeEnabled: sample.writeEnabled,
        writeUserId: sample.writeUserId,
        writeRole: sample.writeRole,
        writeCapabilities: sample.writeCapabilities,
        source: 'default'
      })

      showToast({
        title: 'Sample Config Loaded',
        message: 'Loaded sample development write configuration',
        tone: 'success'
      })
    } catch (err: any) {
      showToast({
        title: 'Sample Load Failed',
        message: err.message || 'Could not load sample config',
        tone: 'error'
      })
    }
  }

  const handleSaveEhrSettings = () => {
    ehrService.saveSettings(settings)
    showToast({
      title: 'EHR Credentials Saved',
      message: 'Updated host URL, customer ID, user ID, and site ID',
      tone: 'success'
    })
  }

  return (
    <Box p="md" style={{ flex: 1, overflowY: 'auto', height: '100%' }}>
      <Stack gap="md" max-width={900} mx="auto">
        {/* Header Title */}
        <AppCard p="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Terminal size={18} color={`var(--mantine-color-${primaryColor}-filled)`} />
              <Text fw={800} size="sm">
                DEVELOPER CONTROLS & CONFIGURATION WORKSPACE
              </Text>
            </Group>

            <Group gap="xs">
              <Badge color={isWriteEnabled ? 'green' : 'gray'} variant="light" size="sm">
                {isWriteEnabled ? 'WRITE ADDON ACTIVE' : 'READ ONLY'}
              </Badge>
              <Badge color="blue" size="sm" variant="outline">
                CONFIG: {configSource.toUpperCase()}
              </Badge>
            </Group>
          </Group>
        </AppCard>

        {/* EMR Write Addon Feature Master & Capability Toggles */}
        <AppCard p="md">
          <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
            <FileCode2 size={15} color={`var(--mantine-color-${primaryColor}-filled)`} />
            <Text fw={800} size="xs">
              EMR WRITE ADDON CONFIGURATION
            </Text>
          </Group>

          <Group justify="space-between" align="center" mb="md">
            <Box>
              <Text size="xs" fw={700}>
                Master Write Addon Toggle
              </Text>
              <Text size="xs" c="dimmed">
                Enables or hides all write forms, action cards, and CORS write endpoints across the app
              </Text>
            </Box>
            <Switch
              size="sm"
              color={primaryColor}
              checked={isWriteEnabled}
              onChange={(e) => handleToggleMasterWrite(e.currentTarget.checked)}
            />
          </Group>

          <Divider mb="md" />

          <Text size="xs" fw={700} mb="xs">
            Active Addon Capabilities & Functions:
          </Text>

          <Stack gap="xs" mb="md">
            <Checkbox
              size="xs"
              color={primaryColor}
              label="Write Resubmission Reason (add/resubmission/reason)"
              checked={capabilities.saveResubmissionReason}
              onChange={(e) => handleCapabilityChange('saveResubmissionReason', e.currentTarget.checked)}
              disabled={!isWriteEnabled}
            />
            <Checkbox
              size="xs"
              color={primaryColor}
              label="Write RA Remarks (claim/marked/for/write/off/update status 1)"
              checked={capabilities.saveRaRemarks}
              onChange={(e) => handleCapabilityChange('saveRaRemarks', e.currentTarget.checked)}
              disabled={!isWriteEnabled}
            />
            <Checkbox
              size="xs"
              color={primaryColor}
              label="Write-Off Remarks & Financial Sub-Ledger Posting (accrec/account/receivable/write/off)"
              checked={capabilities.postWriteOff}
              onChange={(e) => handleCapabilityChange('postWriteOff', e.currentTarget.checked)}
              disabled={!isWriteEnabled}
            />
            <Checkbox
              size="xs"
              color={primaryColor}
              label="Bypass Activity Status Locks (Rule Overrides)"
              checked={capabilities.bypassStatusLocks}
              onChange={(e) => handleCapabilityChange('bypassStatusLocks', e.currentTarget.checked)}
              disabled={!isWriteEnabled}
            />
          </Stack>

          <Divider mb="md" />

          {/* Config File Upload & Sample Reset */}
          <Text size="xs" fw={700} mb="xs">
            Upload Custom Write Config JSON:
          </Text>

          <Group gap="xs" align="flex-end">
            <FileInput
              size="xs"
              placeholder="Upload write_config.json"
              leftSection={<Upload size={13} />}
              value={jsonFile}
              onChange={handleFileUpload}
              accept=".json"
              style={{ flex: 1 }}
            />
            <Button
              size="xs"
              variant="outline"
              color={primaryColor}
              leftSection={<FileCode2 size={13} />}
              onClick={handleLoadSampleConfig}
            >
              Load Sample Config
            </Button>
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<RotateCcw size={13} />}
              onClick={() => {
                resetWriteConfig()
                showToast({ title: 'Config Reset', message: 'Reset back to Read-Only mode', tone: 'warning' })
              }}
            >
              Reset to Read Only
            </Button>
          </Group>
        </AppCard>

        {/* EHR Credentials & Environment Settings */}
        <AppCard p="md">
          <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
            <Key size={15} color={`var(--mantine-color-${primaryColor}-filled)`} />
            <Text fw={800} size="xs">
              LIFETRENZ EHR ENVIRONMENT CREDENTIALS
            </Text>
          </Group>

          <Stack gap="xs" mb="md">
            <TextInput
              label="Host URL"
              size="xs"
              value={settings.hostUrl}
              onChange={(e) => setSettings({ ...settings, hostUrl: e.target.value })}
            />
            <Group grow align="flex-start">
              <NumberInput
                label="Customer ID"
                size="xs"
                value={settings.customerId}
                onChange={(val) => setSettings({ ...settings, customerId: Number(val || 4) })}
              />
              <NumberInput
                label="User ID"
                size="xs"
                value={settings.userId}
                onChange={(val) => setSettings({ ...settings, userId: Number(val || 0) })}
              />
              <NumberInput
                label="Site ID"
                size="xs"
                value={settings.siteId}
                onChange={(val) => setSettings({ ...settings, siteId: Number(val || 11) })}
              />
            </Group>
          </Stack>

          <Group justify="flex-end">
            <Button
              size="xs"
              color={primaryColor}
              leftSection={<CheckCircle2 size={13} />}
              onClick={handleSaveEhrSettings}
            >
              Save Credentials
            </Button>
          </Group>
        </AppCard>

        {/* Runtime Diagnostics */}
        <AppCard p="md">
          <Group gap="xs" mb="xs" pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-border)' }}>
            <Database size={15} color={`var(--mantine-color-${primaryColor}-filled)`} />
            <Text fw={800} size="xs">
              RUNTIME DIAGNOSTICS & ACTIVE CONTEXT
            </Text>
          </Group>

          <Stack gap="xs">
            <Group gap="xs">
              <Text size="xs" fw={700}>Write User ID:</Text>
              <Code color={primaryColor}>{writeUserId || 'None'}</Code>
              <Text size="xs" fw={700} ml="md">Write Role:</Text>
              <Code color={primaryColor}>{writeRole}</Code>
            </Group>
            <Group gap="xs">
              <Text size="xs" fw={700}>Active App Version:</Text>
              <Code color="blue">v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0-plus'}</Code>
            </Group>
          </Stack>
        </AppCard>
      </Stack>
    </Box>
  )
}
