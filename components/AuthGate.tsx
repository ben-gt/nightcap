import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AuthGateProps {
  children: React.ReactNode;
  requireVendor?: boolean;
  requireAdmin?: boolean;
}

export default function AuthGate({ children, requireVendor, requireAdmin }: AuthGateProps) {
  const { isAuthenticated, isLoading, login, authError } = useAuth();
  const user = useStore((s) => s.user);
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Signing you in...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={32} color={Colors.accent} />
        </View>
        <Text style={styles.title}>Sign in required</Text>
        <Text style={styles.subtitle}>
          You need to be signed in to access this page.
        </Text>
        {authError && <Text style={styles.error}>{authError}</Text>}
        <Button
          title="Sign In"
          onPress={login}
          size="lg"
          style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }}
        />
        <Button
          title="Go Back"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    );
  }

  if (requireAdmin && !user?.isAdmin) {
    return (
      <View style={styles.centered}>
        <Ionicons name="shield" size={32} color={Colors.textLo} />
        <Text style={styles.title}>Admin access only</Text>
        <Text style={styles.subtitle}>
          This area is restricted to administrators.
        </Text>
        <Button
          title="Go Back"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    );
  }

  if (requireVendor && !user?.isVendor && !user?.isAdmin) {
    return (
      <View style={styles.centered}>
        <Ionicons name="storefront" size={32} color={Colors.textLo} />
        <Text style={styles.title}>Vendor access only</Text>
        <Text style={styles.subtitle}>
          This area is restricted to vendor accounts.
        </Text>
        <Button
          title="Go Back"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.label,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  loadingText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    marginTop: Spacing.md,
  },
});
