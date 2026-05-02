import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type Step = {
  number: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    number: '01',
    icon: 'bed-outline',
    title: 'Book a room',
    body:
      'Browse honest roadside stays across the outback, pick the night that suits, and pay securely in seconds.',
  },
  {
    number: '02',
    icon: 'keypad-outline',
    title: 'Receive your door pin',
    body:
      'Your unique door pin is sent the moment your booking is confirmed — no front desk, no waiting around.',
  },
  {
    number: '03',
    icon: 'moon-outline',
    title: 'Get a great night sleep',
    body:
      'Arrive on your own schedule, settle in, and rest easy knowing the room has been verified by the operator.',
  },
  {
    number: '04',
    icon: 'log-out-outline',
    title: 'Checkout at the agreed time',
    body:
      "Lock the door behind you when you're done. Your pin expires automatically at the agreed checkout time.",
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>How it works</Text>
        <Text style={styles.subtitle}>
          Roadside Rooms gives you a simple, contactless stay — four steps from
          booking to checkout.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((s) => (
            <View key={s.number} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={s.icon} size={22} color={Colors.accent} />
                </View>
                <Text style={styles.stepNumber}>{s.number}</Text>
              </View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Got it</Text>
        </Pressable>

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
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 720,
  },
  title: {
    color: Colors.textHi,
    fontSize: FontSize.h1 ?? 32,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textMid,
    fontSize: FontSize.md ?? 16,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  steps: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full ?? 20,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: Colors.textLo,
    fontSize: FontSize.sm ?? 14,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    letterSpacing: 1,
  },
  stepTitle: {
    color: Colors.textHi,
    fontSize: FontSize.lg ?? 20,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  stepBody: {
    color: Colors.textMid,
    fontSize: FontSize.sm ?? 14,
    lineHeight: 22,
  },
  cta: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ctaText: {
    color: '#FFF',
    fontSize: FontSize.md ?? 16,
    fontWeight: '700',
    fontFamily: 'Fraunces-SemiBold',
  },
  footnote: {
    color: Colors.textLo,
    fontSize: FontSize.xs ?? 12,
    textAlign: 'center',
  },
});
