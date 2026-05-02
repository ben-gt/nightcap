import {
  StyleSheet,
  View,
  SectionList,
  Text,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/auth';
import Button from '@/components/ui/Button';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { Booking, Listing } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type BookingCategory = 'Current' | 'Upcoming' | 'Past';

const statusColors: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.success,
  'checked-in': Colors.accent,
  completed: Colors.textLo,
  cancelled: Colors.danger,
};

/** Dark text for bright badge backgrounds, light text for dark badges. */
function badgeTextColor(bg: string): string {
  // completed badge uses textLo which is dark-ish, so use light text
  if (bg === Colors.textLo) return Colors.textHi;
  // all other bright badges get dark text for readability
  return Colors.bg;
}

function toLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function formatDate(dateStr: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const d = toLocalDate(dateStr);
  const weekday = d.toLocaleDateString('en-AU', { weekday: 'short' });
  const day = d.getDate().toString();
  const month = d.toLocaleDateString('en-AU', { month: 'short' });
  return { weekday, day, month };
}

function nightCount(checkIn: string, checkOut: string): number {
  const a = toLocalDate(checkIn);
  const b = toLocalDate(checkOut);
  return Math.max(
    1,
    Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function categorize(booking: Booking, today: Date): BookingCategory {
  const checkIn = toLocalDate(booking.checkIn);
  const checkOut = toLocalDate(booking.checkOut);
  if (checkIn <= today && today <= checkOut) return 'Current';
  if (checkIn > today) return 'Upcoming';
  return 'Past';
}

function openDirections(listing: Listing) {
  const url = `https://maps.apple.com/?daddr=${listing.latitude},${listing.longitude}`;
  Linking.openURL(url);
}

function friendlyType(type: string): string {
  const labels: Record<string, string> = {
    cabin: 'Cabin', motel: 'Motel', pod: 'Sleep Pod',
    'rv-park': 'RV Park', lodge: 'Lodge', campground: 'Campground',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingsScreen() {
  const router = useRouter();
  const allBookings = useStore((s) => s.bookings);
  const listings = useStore((s) => s.listings);
  const user = useStore((s) => s.user);
  const { login, isLoading } = useAuth();

  // Only show this user's bookings. Match by Auth0 email since that's the
  // only stable identifier on the booking record today. Admins see everything.
  const bookings = useMemo(() => {
    if (!user) return [];
    if (user.isAdmin) return allBookings;
    const email = user.email.toLowerCase();
    if (!email) return [];
    return allBookings.filter((b) => b.guestEmail.toLowerCase() === email);
  }, [allBookings, user]);

  const sections = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: Record<BookingCategory, Booking[]> = {
      Current: [],
      Upcoming: [],
      Past: [],
    };

    for (const b of bookings) {
      buckets[categorize(b, today)].push(b);
    }

    // Sort upcoming by soonest first, past by most recent first
    buckets.Upcoming.sort(
      (a, b) =>
        toLocalDate(a.checkIn).getTime() - toLocalDate(b.checkIn).getTime(),
    );
    buckets.Past.sort(
      (a, b) =>
        toLocalDate(b.checkOut).getTime() - toLocalDate(a.checkOut).getTime(),
    );

    const order: BookingCategory[] = ['Current', 'Upcoming', 'Past'];
    return order
      .filter((key) => buckets[key].length > 0)
      .map((key) => ({ title: key, data: buckets[key] }));
  }, [bookings]);

  // -----------------------------------------------------------------------
  // Signed-out guard (in case someone hits /bookings directly)
  // -----------------------------------------------------------------------
  if (!user) {
    return (
      <View style={[styles.container, styles.signedOutContainer]}>
        <View style={styles.signedOutIcon}>
          <Ionicons name="receipt-outline" size={32} color={Colors.accent} />
        </View>
        <Text style={styles.signedOutTitle}>Sign in to see your stays</Text>
        <Text style={styles.signedOutText}>
          Your bookings are tied to your account. Sign in to view, manage, and unlock rooms.
        </Text>
        <Button
          title="Sign In"
          onPress={login}
          loading={isLoading}
          size="lg"
          style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }}
        />
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------
  if (bookings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No stays yet</Text>
          <Text style={styles.emptyText}>
            Find your first room and hit the road.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.emptyCta,
              pressed && styles.emptyCtaPressed,
            ]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.emptyCtaText}>Explore</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // List
  // -----------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        renderItem={({ item, section }) => {
          const listing = listings.find((l) => l.id === item.listingId);
          const checkIn = formatDate(item.checkIn);
          const checkOut = formatDate(item.checkOut);
          const nights = nightCount(item.checkIn, item.checkOut);
          const isCurrent = section.title === 'Current';
          const isPast = section.title === 'Past';
          const badgeBg = statusColors[item.status] ?? Colors.textLo;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isCurrent && styles.cardCurrent,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push(`/confirmation/${item.id}`)}
            >
              {listing?.images[0] && (
                <Image
                  source={{ uri: listing.images[0] }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.cardBody}>
                {/* Header: name + badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.nameRow}>
                    <Text style={styles.listingName} numberOfLines={1}>
                      {listing?.name ?? 'Unknown'}
                    </Text>
                    {listing && (
                      <Text style={styles.listingType}>
                        {friendlyType(listing.type)}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[styles.statusBadge, { backgroundColor: badgeBg }]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: badgeTextColor(badgeBg) },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Dates row */}
                <View style={styles.datesRow}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>CHECK-IN</Text>
                    <Text style={styles.dateDay}>{checkIn.day}</Text>
                    <Text style={styles.dateMonth}>
                      {checkIn.month} {checkIn.weekday}
                    </Text>
                  </View>

                  <View style={styles.datesConnector}>
                    <View style={styles.connectorLine} />
                    <View style={styles.nightsChip}>
                      <Text style={styles.nightsLabel}>
                        {nights} {nights === 1 ? 'night' : 'nights'}
                      </Text>
                    </View>
                    <View style={styles.connectorLine} />
                  </View>

                  <View style={[styles.dateBlock, styles.dateBlockEnd]}>
                    <Text style={styles.dateLabel}>CHECK-OUT</Text>
                    <Text style={styles.dateDay}>{checkOut.day}</Text>
                    <Text style={styles.dateMonth}>
                      {checkOut.month} {checkOut.weekday}
                    </Text>
                  </View>
                </View>

                {/* Price row */}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    ${item.totalPrice}
                    <Text style={styles.priceCurrency}> AUD</Text>
                  </Text>
                  {listing && (
                    <Text style={styles.perNight}>
                      ${listing.pricePerNight}/night
                    </Text>
                  )}
                </View>

                {/* Action footer */}
                <View style={styles.actionRow}>
                  {listing && !isPast && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionPrimary,
                        isCurrent && styles.actionPrimaryCurrent,
                        pressed && styles.actionPressed,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        if (isCurrent) {
                          router.push(`/confirmation/${item.id}`);
                        } else {
                          openDirections(listing);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.actionPrimaryText,
                          isCurrent && styles.actionPrimaryTextCurrent,
                        ]}
                      >
                        {isCurrent ? 'Unlock Room' : 'Get Directions'}
                      </Text>
                    </Pressable>
                  )}
                  {isPast && listing && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionSecondary,
                        pressed && styles.actionPressed,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        openDirections(listing);
                      }}
                    >
                      <Text style={styles.actionSecondaryText}>
                        Get Directions
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionSecondary,
                      pressed && styles.actionPressed,
                    ]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      router.push(`/confirmation/${item.id}`);
                    }}
                  >
                    <Text style={styles.actionSecondaryText}>View Details</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Sections
  sectionTitle: {
    color: Colors.textMid,
    fontSize: FontSize.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionSeparator: {
    height: Spacing.sm,
  },

  // Card
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCurrent: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  heroImage: {
    width: '100%',
    height: 140,
  },
  cardBody: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  listingName: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  listingType: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xxs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  statusText: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Dates
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevatedHi,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  dateBlock: {
    alignItems: 'flex-start',
  },
  dateBlockEnd: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    color: Colors.textLo,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  dateDay: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontWeight: '700',
    lineHeight: 28,
  },
  dateMonth: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    marginTop: Spacing.xxs,
  },
  datesConnector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  nightsChip: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.pill,
  },
  nightsLabel: {
    color: Colors.accent,
    fontSize: FontSize.caption,
    fontWeight: '700',
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  price: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  priceCurrency: {
    color: Colors.textLo,
    fontSize: FontSize.label,
    fontWeight: '400',
  },
  perNight: {
    color: Colors.textMid,
    fontSize: FontSize.label,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  actionPrimary: {
    flex: 1,
    backgroundColor: Colors.bgElevatedHi,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  actionPrimaryCurrent: {
    backgroundColor: Colors.accent,
  },
  actionPrimaryText: {
    color: Colors.textHi,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  actionPrimaryTextCurrent: {
    color: Colors.bg,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: Colors.bgElevatedHi,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  actionSecondaryText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  actionPressed: {
    opacity: 0.7,
  },

  // Separators
  separator: {
    height: Spacing.md,
  },

  // Empty state
  signedOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  signedOutIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  signedOutTitle: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontWeight: '700',
    textAlign: 'center',
  },
  signedOutText: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyCta: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  emptyCtaPressed: {
    opacity: 0.8,
  },
  emptyCtaText: {
    color: Colors.bg,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
