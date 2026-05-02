import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import AuthGate from '@/components/AuthGate';

export default function AdminLayout() {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="listings/index" options={{ title: 'Manage Listings' }} />
        <Stack.Screen name="listings/[id]" options={{ title: 'Edit Listing' }} />
        <Stack.Screen name="listings/new" options={{ title: 'New Listing' }} />
        <Stack.Screen name="bookings" options={{ title: 'All Bookings' }} />
      </Stack>
    </AuthGate>
  );
}
