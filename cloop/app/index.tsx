import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home/home');
    }
  }, [isAuthenticated, router]);

  return (
    <View style={styles.container}>
      {/* make the native status bar translucent so system time/battery overlays the app */}
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.card}>
        <View style={styles.logo}><Text style={styles.logoText}>C</Text></View>
        <Text style={styles.brand}>Cloop</Text>
        <Text style={styles.tag}>Your Agentic AI Tutor</Text>

        <View style={styles.pills}>
          <Text style={styles.pill}>🎯 Personalized</Text>
          <Text style={styles.pill}>🧠 Adaptive</Text>
          <Text style={styles.pill}>⚡ 24/7</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => {
              console.log('navigate to signup');
              router.push({ pathname: '/login-sigup/sigup' });
            }}
          >
            <Text style={styles.btnText}>Create an Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => {
              console.log('navigate to login');
              router.push({ pathname: '/login-sigup/login' });
            }}
          >
            <Text style={styles.btnTextSecondary}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Join thousands of learners achieving their goals</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // keep top padding 0 so the StatusBar overlays the app; if you want content
  // visible below the status bar add paddingTop manually (e.g. 24) or use SafeAreaView
  container: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', paddingTop: 0, paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 420, alignItems: 'center', padding: 28 },
  logo: { width: 88, height: 88, borderRadius: 18, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 36, fontWeight: '900' },
  brand: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 6 },
  tag: { color: '#cbd5e1', marginBottom: 16 },
  pills: { width: '100%', marginVertical: 12 },
  pill: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 999, color: '#9FB3C8', textAlign: 'center', marginBottom: 8 },
  actions: { width: '100%', marginTop: 12 },
  btn: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  btnPrimary: { backgroundColor: '#111111' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnTextSecondary: { color: '#fff', fontWeight: '800' },
  footer: { marginTop: 18, color: '#9FB3C8' },
});
