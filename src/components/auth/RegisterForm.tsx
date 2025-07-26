import React, { useState } from 'react';
import { Box, Button, Input, VStack, Text, Heading } from '@chakra-ui/react';

interface RegisterFormProps {
  onRegister: (data: {
    email: string;
    password: string;
    passwordConfirm: string;
    accountName: string;
    siteDomain?: string;
    role?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  isLoading,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [accountName, setAccountName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && passwordConfirm && accountName) {
      await onRegister({
        email,
        password,
        passwordConfirm,
        accountName: accountName.toLowerCase().trim(),
        siteDomain: siteDomain.trim() || undefined,
        role: 'admin', // Default role for new account creators
      });
    }
  };

  // Validate account name (alphanumeric, hyphens, no spaces)
  const isValidAccountName = (name: string) => {
    return (
      /^[a-zA-Z0-9-]+$/.test(name) && name.length >= 3 && name.length <= 50
    );
  };

  const accountNameError =
    accountName && !isValidAccountName(accountName)
      ? 'Account name must be 3-50 characters, alphanumeric and hyphens only'
      : '';

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <Box
        bg="white"
        p={8}
        borderRadius="md"
        shadow="lg"
        border="1px"
        borderColor="gray.200"
        _dark={{
          bg: 'gray.800',
          borderColor: 'gray.600',
        }}
      >
        <Heading size="lg" textAlign="center" mb={6}>
          Create Your Analytics Account
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack gap={4}>
            {error && (
              <Box
                p={3}
                bg="red.50"
                border="1px"
                borderColor="red.200"
                borderRadius="md"
                width="full"
                _dark={{
                  bg: 'red.900',
                  borderColor: 'red.700',
                }}
              >
                <Text color="red.700" _dark={{ color: 'red.200' }}>
                  {error}
                </Text>
              </Box>
            )}

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Account Name *
              </Text>
              <Input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="mysite"
                required
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                You will access your analytics at https://
                {accountName || 'account-name'}.pocketwebanalytics.com
              </Text>
              {accountNameError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {accountNameError}
                </Text>
              )}
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Site Domain{' '}
                <Text as="span" color="gray.500" fontSize="sm">
                  (optional)
                </Text>
              </Text>
              <Input
                type="text"
                value={siteDomain}
                onChange={(e) => setSiteDomain(e.target.value)}
                placeholder="example.com"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Your website&apos;s domain, used for display and linking
              </Text>
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Email Address *
              </Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                For password resets and important announcements
              </Text>
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Password *
              </Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Confirm Password *
              </Text>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              loading={isLoading}
              disabled={
                !!accountNameError ||
                !accountName ||
                !email ||
                !password ||
                !passwordConfirm
              }
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};
