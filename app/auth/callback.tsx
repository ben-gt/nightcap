import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useStore } from '@/store';
import { Colors, FontSize, Spacing } from '@/constants/theme';

/**
 * Auth0 redirects here after login. expo-auth-session reads `code` and
 * `state` from the URL automatically and the AuthProvider exchanges them
 * for tokens. As soon as we have a user, send them to the home tab.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { isLoading, authError } = useAuth();
  const user = useStore((s) => s.user);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
      <Text style={styles.text}>
        {authError ? 'Sign-in failed. Returning…' : 'Finishing sign-in…'}
      </Text>
      {authError && <Text style={styles.error}>{authError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  text: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    marginTop: Spacing.md,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.label,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
