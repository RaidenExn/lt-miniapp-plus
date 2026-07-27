import React from 'react'
import { Group, Button, Popover, TextInput, Text, Stack, Box, Flex } from '@mantine/core'
import { Search, RefreshCw, Clipboard } from 'lucide-react'

interface HeaderSearchBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  popoverOpened: boolean
  setPopoverOpened: (opened: boolean) => void
  cachedList: any[]
  triggerSearch: (query?: string) => void
  handleForceRefresh: () => void
  handlePasteAndLoad: () => void
  isLoading: boolean
  isFetching: boolean
  setShowSettings: (val: boolean) => void
  primaryColor: string
}

export const HeaderSearchBar: React.FC<HeaderSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  popoverOpened,
  setPopoverOpened,
  cachedList,
  triggerSearch,
  handleForceRefresh,
  handlePasteAndLoad,
  isLoading,
  isFetching,
  setShowSettings,
  primaryColor
}) => {
  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Button
        onClick={handleForceRefresh}
        color="orange"
        variant="outline"
        loading={isLoading || isFetching}
        size="xs"
        px={{ base: 6, sm: 'xs' }}
        title="Force Refresh"
      >
        <Flex gap={4} align="center" wrap="nowrap">
          <RefreshCw size={13} />
          <Box visibleFrom="sm">force refresh</Box>
        </Flex>
      </Button>

      <Popover
        opened={popoverOpened}
        onChange={setPopoverOpened}
        width="target"
        position="bottom-start"
        radius="md"
        shadow="md"
        withinPortal={true}
        zIndex={3000}
      >
        <Popover.Target>
          <TextInput
            placeholder="Encounter Suffix (e.g. 11255)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setPopoverOpened(true)}
            onKeyDown={(e) => e.key === 'Enter' && (setPopoverOpened(false), triggerSearch())}
            leftSection={<Search size={13} color="var(--mantine-color-dimmed)" />}
            size="xs"
            w={{ base: 120, xs: 150, sm: 200 }}
            disabled={isLoading || isFetching}
          />
        </Popover.Target>
        <Popover.Dropdown p={4}>
          {cachedList.length === 0 ? (
            <Text size="xs" p="xs" c="dimmed" ta="center">
              No recent encounters
            </Text>
          ) : (
            <Stack gap={2} style={{ maxHeight: 200, overflowY: 'auto' }}>
              {cachedList.map((item: any) => (
                <Box
                  key={item.encounterNo}
                  onClick={() => {
                    setSearchQuery(item.encounterNo)
                    triggerSearch(item.encounterNo)
                    setPopoverOpened(false)
                  }}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 'var(--mantine-radius-sm)',
                    padding: '5px 10px',
                    transition: 'background-color 0.1s ease'
                  }}
                  bg="transparent"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--mantine-color-default-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Text size="xs" fw={700} c={primaryColor}>
                    {item.encounterNo}
                  </Text>
                </Box>
              ))}
            </Stack>
          )}
        </Popover.Dropdown>
      </Popover>

      <Button
        onClick={() => triggerSearch()}
        color={primaryColor}
        loading={isLoading || isFetching}
        size="xs"
        px={{ base: 6, sm: 'xs' }}
      >
        <Flex gap={4} align="center" wrap="nowrap">
          <Search size={13} />
          <Box visibleFrom="xs">Search</Box>
        </Flex>
      </Button>

      <Button
        onClick={handlePasteAndLoad}
        color="orange"
        variant="outline"
        loading={isLoading || isFetching}
        size="xs"
        px={{ base: 6, sm: 'xs' }}
        title="Paste & Load"
      >
        <Flex gap={4} align="center" wrap="nowrap">
          <Clipboard size={13} />
          <Box visibleFrom="sm">paste & load</Box>
        </Flex>
      </Button>
    </Group>
  )
}
