import React, { useState } from 'react';
import { Box, Button, Input, VStack, Text, Heading } from '@chakra-ui/react';

interface RegisterFormProps {
  onRegister: (data: {
    email: string;
    password: string;
    passwordConfirm: string;
    site_id: string;
    role: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  sites: Array<{ id: string; name: string }>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  isLoading,
  error,
  sites,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [siteId, setSiteId] = useState('');
  const [role, setRole] = useState('viewer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && passwordConfirm && siteId) {
      await onRegister({
        email,
        password,
        passwordConfirm,
        site_id: siteId,
        role,
      });
    }
  };

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
          Create Account
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
                Email
              </Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Password
              </Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Confirm Password
              </Text>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Site
              </Text>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #CBD5E0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                }}
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Role
              </Text>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #CBD5E0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              loading={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};
