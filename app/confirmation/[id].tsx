import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const booking = useStore((s) => s.bookings.find((b) => b.id === id));
  const listing = useStore((s) => s.listings.find((l) => l.id === booking?.listingId));
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = useCallback(async () => {
    if (!booking) return;
    await Clipboard.setStringAsync(booking.accessCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  }, [booking]);

  const openDirections = useCallback(() => {
    if (!listing) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${listing.latitude},${listing.longitude}`,
      android: `geo:0,0?q=${listing.latitude},${listing.longitude}(${encodeURIComponent(listing.name)})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`,
    });
    Linking.openURL(url!);
  }, [listing]);

  if (!booking || !listing) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success banner */}
      <View style={styles.successBanner}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={32} color={Colors.white} />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed</Text>
        <Text style={styles.successSubtitle}>You're all set with Roadside Rooms.</Text>
      </View>

      {/* Access code card */}
      <Pressable onPress={copyCode} style={styles.accessCard}>
        <Text style={styles.accessLabel}>Your Smart Lock Code</Text>
        <Text style={styles.accessCode}>{booking.accessCode}</Text>
        <View style={styles.copyRow}>
          <Ionicons
            name={codeCopied ? 'checkmark-circle' : 'copy-outline'}
            size={16}
            color="rgba(11,18,32,0.7)"
          />
          <Text style={styles.copyText}>
            {codeCopied ? 'Copied!' : 'Tap to copy code'}
          </Text>
        </View>
        <Text style={styles.accessHint}>
          Use this code to unlock your door on arrival. Active from check-in until check-out.
        </Text>
      </Pressable>

      {/* Get Directions — primary action */}
      <Button
        title="Get Directions"
        onPress={openDirections}
        size="lg"
        style={styles.directionsButton}
      />

      {/* Stay details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Stay Details</Text>
        <DetailRow label="Property" value={listing.name} />
        <DetailRow label="Address" value={listing.address} />
        <DetailRow label="Check-in" value={formatDate(booking.checkIn)} />
        <DetailRow label="Check-out" value={formatDate(booking.checkOut)} />
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>${booking.totalPrice} AUD</Text>
        </View>
      </View>

      {/* Guest details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Guest Details</Text>
        <DetailRow label="Name" value={booking.guestName} />
        <DetailRow label="Email" value={booking.guestEmail} />
        <DetailRow label="Phone" value={booking.guestPhone} />
      </View>

      {/* ID notice */}
      <View style={styles.idNote}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Colors.warning} style={{ marginRight: 8 }} />
        <Text style={styles.idNoteText}>
          Please have a valid photo ID ready upon check-in to comply with local short-stay regulations.
        </Text>
      </View>

      <Button
        title="Back to Explore"
        onPress={() => router.replace('/')}
        variant="outline"
        size="lg"
      />
    </ScrollView>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  successBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  successTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  accessCard: {
    backgroundColor: Colors.accent,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  accessLabel: {
    color: 'rgba(11,18,32,0.7)',
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accessCode: {
    color: Colors.bg,
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: 14,
    marginBottom: Spacing.sm,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(11,18,32,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  copyText: {
    color: 'rgba(11,18,32,0.8)',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  accessHint: {
    color: 'rgba(11,18,32,0.5)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  directionsButton: {
    marginBottom: Spacing.lg,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  detailValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  totalValue: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  idNote: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  idNoteText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    flex: 1,
  },
});
