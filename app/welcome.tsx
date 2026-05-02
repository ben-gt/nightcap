import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const TERMS_KEY = 'rr.termsAccepted';

/** Mark the user as having accepted the T&Cs (web localStorage; native silently no-ops). */
function persistAcceptance() {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(TERMS_KEY, '1');
    } catch {
      // ignore quota / private-mode errors
    }
  }
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  function handleContinue() {
    if (!accepted) return;
    persistAcceptance();
    router.replace('/');
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
    >
      <View style={styles.inner}>
        <View style={styles.logoBlock}>
          <Image
            source={require('@/assets/images/logo-horizontal.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>
            Honest roadside stays across the great Australian outback.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Before you set off</Text>
          <Text style={styles.cardBody}>
            Roadside Rooms is a marketplace for travellers and roadside operators.
            Bookings and payments are handled directly with each property —
            please review how the service works before you continue.
          </Text>

          <Link href="/terms" asChild>
            <Pressable style={({ pressed }) => [styles.termsLink, pressed && styles.pressed]}>
              <Text style={styles.termsLinkText}>Read the Terms &amp; Conditions →</Text>
            </Pressable>
          </Link>

          <Pressable
            style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
            onPress={() => setAccepted((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
              {accepted && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and agree to the Terms &amp; Conditions and Privacy Policy.
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              !accepted && styles.continueDisabled,
              accepted && pressed && styles.pressed,
            ]}
            onPress={handleContinue}
            disabled={!accepted}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.continueText,
                !accepted && styles.continueTextDisabled,
              ]}
            >
              Continue
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>© Roadside Rooms · Made in Australia</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  inner: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 280,
    height: 180,
    marginBottom: Spacing.md,
  },
  tagline: {
    color: Colors.textMid,
    fontSize: FontSize.md,
    textAlign: 'center',
    fontFamily: 'Fraunces-Regular',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    width: '100%',
    ...Shadows.md,
  },
  cardTitle: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  cardBody: {
    color: Colors.textMid,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  termsLink: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  termsLinkText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxTick: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
    color: Colors.textMid,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  continueDisabled: {
    backgroundColor: Colors.bgElevatedHi,
  },
  continueText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: 'Fraunces-SemiBold',
  },
  continueTextDisabled: {
    color: Colors.textLo,
  },
  pressed: {
    opacity: 0.85,
  },
  footnote: {
    marginTop: Spacing.xl,
    color: Colors.textLo,
    fontSize: FontSize.xs,
  },
});
