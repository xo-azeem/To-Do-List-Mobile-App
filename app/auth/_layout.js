import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function AuthLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          headerTitle: '', // Remove default title
          contentStyle: { backgroundColor: '#f9f9f9' }
        }}
      />
    </>
  );
}