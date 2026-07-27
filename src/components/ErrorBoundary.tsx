import { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Title, Text, Alert, Center, Group } from '@mantine/core'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <Center mih="100vh" p="xl">
          <Alert
            title={
              <Group gap="xs" align="center">
                <AlertTriangle size={20} />
                <Title order={4}>Something went wrong</Title>
              </Group>
            }
            color="red"
            withCloseButton={false}
            maw={480}
            w="100%"
          >
            <Text size="sm" c="dimmed" mb="md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button onClick={this.handleRetry} leftSection={<RefreshCw size={14} />} size="sm">
              Reload Application
            </Button>
          </Alert>
        </Center>
      )
    }

    return this.props.children
  }
}
