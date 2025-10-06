import { Stack } from 'expo-router'

export default function RootLayout() {
  // Disable the native header globally so no top header appears on any screen
  return <Stack screenOptions={{ headerShown: false }} />
}
