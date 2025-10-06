import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = () => {
    // Add logout logic here (clear token, etc.)
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Top bar with profile icon on the right */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <View style={{ flex: 1 }} />
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push('/profile' as any)}
          accessibilityLabel="Open profile"
        >
          {/* You can replace the Image source with a user avatar when available */}
          <Image
            source={{ uri: 'https://ui-avatars.com/api/?name=You&background=10B981&color=fff&size=128' }}
            style={styles.profileAvatar}
          />
        </Pressable>
      </View>

      <Text style={styles.title}>Welcome to Home</Text>
      <Text style={styles.subtitle}>You are now logged in!</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
