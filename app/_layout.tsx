import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TamaguiProvider, Theme } from 'tamagui';
import config from '../tamagui.config';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/contexts/auth';

const TERMS_KEY = 'rr.termsAccepted';

/**
 * Redirect first-time visitors to the welcome/T&Cs splash.
 * Only runs on web (where we deploy) and only after mount, so SSR/static
 * export isn't disturbed. Once accepted, persisted in localStorage.
 */
function TermsGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Allow welcome, terms, and the auth callback to load freely
    const exempt =
      pathname === '/welcome' ||
      pathname === '/terms' ||
      pathname.startsWith('/auth');
    if (exempt) return;
    let accepted = false;
    try {
      accepted = window.localStorage?.getItem(TERMS_KEY) === '1';
    } catch {
      accepted = false;
    }
    if (!accepted) {
      router.replace('/welcome');
    }
  }, [pathname, router]);

  return null;
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Fraunces-Regular': require('../assets/fonts/Fraunces-Regular.ttf'),
    'Fraunces-Medium': require('../assets/fonts/Fraunces-Medium.ttf'),
    'Fraunces-SemiBold': require('../assets/fonts/Fraunces-SemiBold.ttf'),
    'Fraunces-Bold': require('../assets/fonts/Fraunces-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config} defaultTheme="light">
        <Theme name="light">
          <AuthProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.bg },
                headerTintColor: Colors.textHi,
                headerTitleStyle: { fontWeight: '600', fontFamily: 'Fraunces-SemiBold' },
                contentStyle: { backgroundColor: Colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
              <Stack.Screen name="listing/[id]" options={{ title: 'Details' }} />
              <Stack.Screen name="booking/[id]" options={{ title: 'Book' }} />
              <Stack.Screen name="confirmation/[id]" options={{ title: 'Confirmed', headerBackVisible: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            </Stack>
            <TermsGate />
          </AuthProvider>
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
