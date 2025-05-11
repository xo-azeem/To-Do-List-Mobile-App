import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase'; // Adjust the import based on your project structure
import { onAuthStateChanged } from 'firebase/auth'; // Import Firebase auth methods

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Check if the user is authenticated
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.loadingText, { color: theme.accent }]}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});