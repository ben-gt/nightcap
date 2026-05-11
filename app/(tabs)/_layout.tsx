import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { Colors } from '@/constants/theme';

const TAB_ICON_SIZE = 24;

export default function TabLayout() {
  const user = useStore((s) => s.user);
  const isVendor = user?.isVendor ?? false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textLo,
        tabBarStyle: {
          backgroundColor: Colors.bgElevated,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        headerStyle: { backgroundColor: Colors.bgElevated },
        headerTintColor: Colors.textHi,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerTitle: () => (
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 160, height: 44, resizeMode: 'contain' }}
            />
          ),
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bed" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Stays',
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendor"
        options={{
          title: 'Vendor',
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront" size={TAB_ICON_SIZE} color={color} />
          ),
          href: isVendor ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
