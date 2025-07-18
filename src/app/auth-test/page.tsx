'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { AuthTestPage } from '@/components/auth/AuthTestPage';

export default function AuthTestPageRoute() {
  return (
    <AuthProvider>
      <AuthTestPage />
    </AuthProvider>
  );
}
