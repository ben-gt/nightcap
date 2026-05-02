import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

export default function TermsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms & Conditions' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text style={styles.h1}>Terms &amp; Conditions</Text>
          <Text style={styles.lead}>
            Last updated: 2 May 2026
          </Text>

          <Section title="1. About Roadside Rooms">
            <Text style={styles.body}>
              Roadside Rooms (“we”, “us”) operates a directory and booking
              marketplace that connects travellers with roadside accommodation
              providers (“Operators”) across Australia. By using this app or
              website (the “Service”) you agree to these Terms &amp; Conditions.
            </Text>
          </Section>

          <Section title="2. Bookings &amp; Payments">
            <Text style={styles.body}>
              All bookings are made directly between you and the Operator.
              Roadside Rooms is not a party to any booking, does not own the
              listed properties, and is not responsible for the rooms,
              services, or experiences provided. Pricing, availability, taxes
              and fees are set by the Operator and may change without notice.
            </Text>
          </Section>

          <Section title="3. Cancellations &amp; Refunds">
            <Text style={styles.body}>
              Each Operator sets its own cancellation policy, which is shown on
              the listing detail page at the time of booking. Refund requests
              must be made directly with the Operator. Where Roadside Rooms
              processes a payment on the Operator’s behalf, refunds will be
              issued via the original payment method once approved.
            </Text>
          </Section>

          <Section title="4. Your Account">
            <Text style={styles.body}>
              You are responsible for keeping your account credentials secure
              and for any activity under your account. You agree to provide
              accurate information and to notify us promptly of any
              unauthorised use. We may suspend or terminate accounts that
              violate these Terms.
            </Text>
          </Section>

          <Section title="5. Conduct on the Platform">
            <Text style={styles.body}>
              You agree to use the Service lawfully and respectfully. Misuse
              including harassment of Operators or other users, fraudulent
              bookings, scraping, reverse engineering, or interfering with the
              Service may result in suspension and possible legal action.
            </Text>
          </Section>

          <Section title="6. Privacy">
            <Text style={styles.body}>
              We collect and use your personal information in accordance with
              our Privacy Policy. By using the Service you consent to the
              collection, use and disclosure of your information as described
              there.
            </Text>
          </Section>

          <Section title="7. Limitation of Liability">
            <Text style={styles.body}>
              To the maximum extent permitted by law, Roadside Rooms is not
              liable for any indirect, incidental, or consequential loss
              arising out of your use of the Service or any booking made
              through it. Nothing in these Terms excludes statutory
              consumer guarantees that cannot be lawfully excluded.
            </Text>
          </Section>

          <Section title="8. Changes to These Terms">
            <Text style={styles.body}>
              We may update these Terms from time to time. The latest version
              will always be available within the app. Continued use after a
              change means you accept the updated Terms.
            </Text>
          </Section>

          <Section title="9. Contact">
            <Text style={styles.body}>
              Questions about these Terms? Email hello@roadsiderooms.com.
            </Text>
          </Section>

          <Text style={styles.footnote}>
            Roadside Rooms · Made in Australia
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 720,
  },
  h1: {
    color: Colors.textHi,
    fontSize: FontSize.xxl,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  lead: {
    color: Colors.textLo,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  h2: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  body: {
    color: Colors.textMid,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  footnote: {
    marginTop: Spacing.lg,
    color: Colors.textLo,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
