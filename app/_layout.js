import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import TodoService from '../services/TodoService';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  useEffect(() => {
    // Setup network change listener to sync when coming back online
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        // Try to sync any pending offline changes
        await TodoService.syncOfflineChanges();
      }
    });

    return () => {
      // Clean up the subscription
      unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="todo/[id]"
            options={{
              headerTitle: "Task Details",
              headerTintColor: "#4A6FA5",
              headerBackTitle: "Back"
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}