import { Stack } from 'expo-router'
import { AuthProvider } from '../src/context/AuthContext'

export default function RootLayout() {
  // Disable the native header globally so no top header appears on any screen
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
