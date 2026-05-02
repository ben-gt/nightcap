import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/auth';
import { BookingFormData } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DateSelector from '@/components/DateSelector';
import AuthGate from '@/components/AuthGate';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function BookingScreen() {
  return (
    <AuthGate>
      <BookingContent />
    </AuthGate>
  );
}

function BookingContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listing = useStore((s) => s.listings.find((l) => l.id === id));
  const user = useStore((s) => s.user);
  const addBooking = useStore((s) => s.addBooking);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState<BookingFormData>({
    checkIn: today,
    checkOut: tomorrow,
    guestName: user?.name ?? '',
    guestEmail: user?.email ?? '',
    guestPhone: user?.phone ?? '',
  });
  const [errors, setErrors] = useState<Partial<BookingFormData>>({});
  const [loading, setLoading] = useState(false);

  if (!listing) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Listing not found.</Text>
      </View>
    );
  }

  const nights = Math.max(
    1,
    Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000)
  );
  const total = listing.pricePerNight * nights;

  function validate(): boolean {
    const e: Partial<BookingFormData> = {};
    if (!form.guestName.trim()) e.guestName = 'Name is required';
    if (!form.guestEmail.trim() || !form.guestEmail.includes('@')) e.guestEmail = 'Valid email required';
    if (!form.guestPhone.trim()) e.guestPhone = 'Phone number required';
    if (new Date(form.checkOut) <= new Date(form.checkIn)) e.checkOut = 'Check-out must be after check-in';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleBook() {
    if (!validate()) return;
    setLoading(true);
    // Simulate payment — replace with Airwallex
    await new Promise((r) => setTimeout(r, 1500));
    const booking = addBooking(form, listing!);
    setLoading(false);
    router.replace(`/confirmation/${booking.id}`);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Listing summary with image */}
        <View style={styles.summaryCard}>
          <Image source={{ uri: listing.images[0] }} style={styles.summaryImage} resizeMode="cover" />
          <View style={styles.summaryInfo}>
            <Text style={styles.listingName} numberOfLines={1}>{listing.name}</Text>
            <Text style={styles.listingAddress} numberOfLines={1}>{listing.address}</Text>
            <View style={styles.summaryMeta}>
              <Text style={styles.summaryPrice}>${listing.pricePerNight}/night</Text>
              <Text style={styles.summaryRating}>★ {listing.rating}</Text>
            </View>
          </View>
        </View>

        {/* Date selector with Tonight/Tomorrow presets */}
        <DateSelector
          checkIn={form.checkIn}
          checkOut={form.checkOut}
          onChangeCheckIn={(v) => setForm((f) => ({ ...f, checkIn: v }))}
          onChangeCheckOut={(v) => setForm((f) => ({ ...f, checkOut: v }))}
          error={errors.checkOut}
        />

        {/* Guest details */}
        <Text style={styles.sectionTitle}>Your Details</Text>

        <Input
          label="Phone"
          value={form.guestPhone}
          onChangeText={(v) => setForm((f) => ({ ...f, guestPhone: v }))}
          placeholder="e.g. 0412 345 678"
          error={errors.guestPhone}
          keyboardType="phone-pad"
          icon={<Ionicons name="call-outline" size={18} color={Colors.textLo} />}
        />
        <Input
          label="Full Name"
          value={form.guestName}
          onChangeText={(v) => setForm((f) => ({ ...f, guestName: v }))}
          placeholder="e.g. Dave Mitchell"
          error={errors.guestName}
          autoCapitalize="words"
          icon={<Ionicons name="person-outline" size={18} color={Colors.textLo} />}
        />
        <Input
          label="Email"
          value={form.guestEmail}
          onChangeText={(v) => setForm((f) => ({ ...f, guestEmail: v }))}
          placeholder="e.g. dave@email.com"
          error={errors.guestEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Ionicons name="mail-outline" size={18} color={Colors.textLo} />}
        />

        {/* Price summary */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              ${listing.pricePerNight} x {nights} night{nights > 1 ? 's' : ''}
            </Text>
            <Text style={styles.totalValue}>${total}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Total</Text>
            <Text style={styles.totalValueBold}>${total} AUD</Text>
          </View>
        </View>

        <View style={styles.paymentNote}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.textLo} style={{ marginRight: 8 }} />
          <Text style={styles.paymentNoteText}>
            Payment processed securely. Your card details are encrypted and never stored.
          </Text>
        </View>

        <Button
          title={`Pay $${total} AUD`}
          onPress={handleBook}
          loading={loading}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  summaryImage: {
    width: 90,
    height: 90,
  },
  summaryInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  listingName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  listingAddress: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  summaryPrice: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  summaryRating: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  totalCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  totalValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  totalLabelBold: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  totalValueBold: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  paymentNote: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentNoteText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
    flex: 1,
  },
});
