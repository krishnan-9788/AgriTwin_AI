import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/auth';
import { useColorScheme } from 'nativewind';
import './global.css';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  // Initialize colorScheme to ensure it loads at root level
  useColorScheme();
  
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
