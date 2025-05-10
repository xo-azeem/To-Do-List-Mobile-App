import { Stack } from 'expo-router';

export default function TodoLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#4A6FA5',
        headerBackTitle: 'Back',
        headerTitle: 'Task Details',
      }}
    />
  );
}
