import { Stack } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

export default function TodoLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.accent,
        headerBackTitle: 'Back',
        headerTitle: '',
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerShadowVisible: false,
      }}
    />
  );
}