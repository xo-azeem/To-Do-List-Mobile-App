import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthLayout() {
  const { theme } = useTheme();
  
  return (
    <>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          headerTitle: '', // Remove default title
          contentStyle: { backgroundColor: theme.background }
        }}
      />
    </>
  );
}