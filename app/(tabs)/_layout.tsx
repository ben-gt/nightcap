import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { Colors } from '@/constants/theme';

const TAB_ICON_SIZE = 24;

export default function TabLayout() {
  const user = useStore((s) => s.user);
  const isSignedIn = !!user;
  const canAccessVendor = !!user && (user.isVendor || user.isAdmin);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textLo,
        tabBarStyle: {
          backgroundColor: Colors.bgElevated,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.textHi,
        headerTitleStyle: { fontWeight: '600', fontFamily: 'Fraunces-SemiBold' },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerTitle: () => (
            <Image
              source={require('@/assets/images/logo-horizontal.png')}
              style={{ width: 188, height: 28, resizeMode: 'contain' }}
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
          // Sign-in is the gate for personal data; hide the tab when signed out.
          href: isSignedIn ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="vendor"
        options={{
          title: 'Vendor',
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront" size={TAB_ICON_SIZE} color={color} />
          ),
          // Hide the tab entirely from non-vendor / non-admin users
          href: canAccessVendor ? undefined : null,
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
