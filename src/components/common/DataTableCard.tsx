import React from 'react'
import { Group, Text, Badge, ScrollArea, Table, Center } from '@mantine/core'
import { AppCard } from './AppCard'

interface ColumnDef {
  label: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

interface DataTableCardProps {
  title: string
  count?: number
  action?: React.ReactNode
  columns: ColumnDef[]
  isEmpty: boolean
  emptyText?: string
  children: React.ReactNode
  maxHeight?: string | number
  fixedLayout?: boolean
  minWidth?: number | string
  verticalSpacing?: string | number
  horizontalSpacing?: string | number
}

export const DataTableCard: React.FC<DataTableCardProps> = ({
  title,
  count,
  action,
  columns,
  isEmpty,
  emptyText = 'No data available',
  children,
  maxHeight,
  fixedLayout = true,
  minWidth,
  verticalSpacing = 2,
  horizontalSpacing = 'xs'
}) => {
  const calculatedMinWidth =
    minWidth ??
    columns.reduce((acc, col) => {
      if (typeof col.width === 'number') return acc + col.width
      if (typeof col.width === 'string' && col.width.endsWith('px')) return acc + parseInt(col.width, 10)
      return acc + 150
    }, 0)

  return (
    <AppCard p="md">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Text fw={700} fz="xs" style={{ letterSpacing: '0.5px' }}>
            {title}
          </Text>
          {count !== undefined && (
            <Badge size="xs" variant="light">
              {count}
            </Badge>
          )}
        </Group>
        {action}
      </Group>

      {isEmpty ? (
        <Center p="xl">
          <Text c="dimmed" fz="xs">
            {emptyText}
          </Text>
        </Center>
      ) : (
        <ScrollArea
          type="auto"
          style={{
            maxHeight:
              maxHeight !== undefined ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined
          }}
        >
          <Table
            verticalSpacing={verticalSpacing}
            horizontalSpacing={horizontalSpacing}
            highlightOnHover
            withColumnBorders
            fz="xs"
            style={{
              tableLayout: fixedLayout ? 'fixed' : 'auto',
              minWidth: typeof calculatedMinWidth === 'number' ? `${calculatedMinWidth}px` : calculatedMinWidth,
              width: '100%'
            }}
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map((col, idx) => (
                  <Table.Th
                    key={idx}
                    style={{
                      fontSize: 'var(--mantine-font-size-xs)',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      width: col.width,
                      textAlign: col.align || 'left'
                    }}
                  >
                    {col.label}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{children}</Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </AppCard>
  )
}
