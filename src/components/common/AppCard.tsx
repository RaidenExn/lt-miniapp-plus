import React from 'react'
import { Card, CardProps } from '@mantine/core'
import { useThemeStore } from '../../theme'

export interface AppCardProps extends CardProps {
  children: React.ReactNode
}

/**
 * Standardized AppCard component enforcing uniform border, border color,
 * background panel color, radius, and elevation across the entire application.
 * Height automatically expands dynamically based on inner content height.
 */
export const AppCard: React.FC<AppCardProps> = ({ children, style, p = 'md', radius, ...props }) => {
  const themeRadius = useThemeStore((state) => state.radius)

  return (
    <Card
      withBorder
      radius={radius ?? themeRadius}
      p={p}
      style={{
        backgroundColor: 'var(--panel, var(--mantine-color-body))',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
        transition: 'all 0.15s ease',
        ...style
      }}
      {...props}
    >
      {children}
    </Card>
  )
}
