import { Stack } from 'expo-router'
import { AuthProvider } from '../src/context/AuthContext'
import { useEffect, useState } from 'react'

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure the root layout is ready
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null; // Return nothing until ready
  }

  // Disable the native header globally so no top header appears on any screen
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
