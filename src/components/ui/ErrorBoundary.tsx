'use client';

import React from 'react';
import { Box, Text, Button, Alert } from '@chakra-ui/react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      'Dashboard Error Boundary caught an error:',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={6} maxW="lg" mx="auto" mt={8}>
          <Alert.Root status="error">
            <Alert.Indicator />
            <Box>
              <Alert.Title>Dashboard Error!</Alert.Title>
              <Alert.Description>
                Something went wrong while loading the dashboard.
                <br />
                <Text fontSize="sm" mt={2} color="gray.600">
                  {this.state.error?.message || 'Unknown error occurred'}
                </Text>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  mt={3}
                  onClick={() =>
                    this.setState({ hasError: false, error: undefined })
                  }
                >
                  Try Again
                </Button>
              </Alert.Description>
            </Box>
          </Alert.Root>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
