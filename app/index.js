import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Import auth inside effect to avoid initialization issues
    const { auth } = require('../firebase');
    const { onAuthStateChanged } = require('firebase/auth');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, check if email is verified
        if (user.emailVerified) {
          router.replace('/(tabs)'); // Redirect to tasks page
        } else {
          router.replace('/auth/login'); // Redirect to login if email is not verified
        }
      } else {
        // No user is signed in, redirect to login
        router.replace('/auth/login');
      }
    });

    return () => unsubscribe(); // Clean up the subscription
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A6FA5" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4A6FA5',
  },
});