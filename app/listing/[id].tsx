import { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Image, Dimensions, Pressable,
  NativeSyntheticEvent, NativeScrollEvent, Platform, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import Button from '@/components/ui/Button';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listing = useStore((s) => s.listings.find((l) => l.id === id));
  const userLocation = useStore((s) => s.userLocation);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const imageWidth = Math.min(screenWidth, 600);

  const distance = listing && userLocation
    ? distanceKm(userLocation.latitude, userLocation.longitude, listing.latitude, listing.longitude)
    : null;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
    setActiveImageIndex(idx);
  }, [imageWidth]);

  const openDirections = useCallback(() => {
    if (!listing) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${listing.latitude},${listing.longitude}`,
      android: `geo:0,0?q=${listing.latitude},${listing.longitude}(${encodeURIComponent(listing.name)})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`,
    });
    Linking.openURL(url!);
  }, [listing]);

  if (!listing) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Listing not found.</Text>
      </View>
    );
  }

  const typeLabels: Record<string, string> = {
    cabin: 'Cabin', motel: 'Motel', pod: 'Sleep Pod',
    'rv-park': 'RV Park', lodge: 'Lodge', campground: 'Campground',
  };
  const typeLabel = typeLabels[listing.type] || listing.type;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Image Gallery ── */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.imageCarousel}
          >
            {listing.images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={[styles.image, { width: imageWidth }]} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Image count badge top-right */}
          {listing.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Ionicons name="images-outline" size={12} color={Colors.textHi} style={{ marginRight: 4 }} />
              <Text style={styles.imageCountText}>
                {activeImageIndex + 1} / {listing.images.length}
              </Text>
            </View>
          )}

          {/* Pagination dots bottom-centre */}
          {listing.images.length > 1 && (
            <View style={styles.dots}>
              {listing.images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.details}>
          {/* ── Header Row: Category pill + rating ── */}
          <View style={styles.headerMetaRow}>
            <View style={styles.headerMetaLeft}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{typeLabel}</Text>
              </View>
              {distance != null && (
                <View style={styles.distanceBadge}>
                  <Ionicons name="location-outline" size={12} color={Colors.textMid} style={{ marginRight: 2 }} />
                  <Text style={styles.distanceText}>{formatDistance(distance)}</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={Colors.warning} style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{listing.rating}</Text>
              <Text style={styles.reviewCountText}> ({listing.reviewCount})</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.name}>{listing.name}</Text>

          {/* Address row - tappable with pin icon and chevron */}
          <Pressable
            onPress={openDirections}
            style={({ pressed }) => [styles.addressRow, pressed && styles.addressRowPressed]}
          >
            <Ionicons name="location-sharp" size={16} color={Colors.accent} />
            <Text style={styles.addressText} numberOfLines={1}>{listing.address}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLo} />
          </Pressable>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${listing.pricePerNight}</Text>
            <Text style={styles.perNight}> /night</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{listing.description}</Text>

          {/* ── Amenities ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenities}>
              {listing.amenities.map((a) => (
                <View key={a} style={styles.amenityTag}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Stay Info Card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay Info</Text>
            <View style={styles.stayInfoCard}>
              <View style={styles.stayInfoRow}>
                <View style={styles.stayInfoIconWrap}>
                  <Ionicons name="log-in-outline" size={18} color={Colors.accent} />
                </View>
                <Text style={styles.stayInfoLabel}>Check-in</Text>
                <Text style={styles.stayInfoValue}>After {listing.checkInTime}</Text>
              </View>
              <View style={styles.stayInfoDivider} />
              <View style={styles.stayInfoRow}>
                <View style={styles.stayInfoIconWrap}>
                  <Ionicons name="log-out-outline" size={18} color={Colors.accent} />
                </View>
                <Text style={styles.stayInfoLabel}>Check-out</Text>
                <Text style={styles.stayInfoValue}>Before {listing.checkOutTime}</Text>
              </View>
              <View style={styles.stayInfoDivider} />
              <View style={styles.stayInfoRow}>
                <View style={styles.stayInfoIconWrap}>
                  <Ionicons name="people-outline" size={18} color={Colors.accent} />
                </View>
                <Text style={styles.stayInfoLabel}>Guests</Text>
                <Text style={styles.stayInfoValue}>Up to {listing.maxGuests}</Text>
              </View>
            </View>
          </View>

          {/* ── Access Note ── */}
          <View style={styles.accessNote}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.accent} style={{ marginRight: 8 }} />
            <Text style={styles.accessNoteText}>
              24/7 digital access — you'll receive a smart lock code after booking.
            </Text>
          </View>

          {/* ── Cancellation Policy ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Policy</Text>
            <View style={styles.policyCard}>
              <View style={styles.policyRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.policyText}>Free cancellation up to 48 hours before check-in.</Text>
              </View>
              <View style={styles.policyRow}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.textLo} style={{ marginRight: 8 }} />
                <Text style={styles.policyText}>After that, the first night is non-refundable.</Text>
              </View>
            </View>
          </View>

          {/* ── Host Info ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Host</Text>
            <View style={styles.hostCard}>
              <View style={styles.hostAvatar}>
                <Ionicons name="person-circle-outline" size={40} color={Colors.textLo} />
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>Property Host</Text>
                <Text style={styles.hostMeta}>Typically responds within 1 hour</Text>
              </View>
            </View>
          </View>

          {/* ── Reviews Teaser ── */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <View style={styles.reviewsSummary}>
                <Ionicons name="star" size={14} color={Colors.warning} style={{ marginRight: 3 }} />
                <Text style={styles.reviewsSummaryText}>
                  {listing.rating} ({listing.reviewCount} reviews)
                </Text>
              </View>
            </View>
            <View style={styles.reviewsPlaceholder}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.textLo} />
              <Text style={styles.reviewsPlaceholderText}>
                Reviews will appear here once guests share their experience.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceText}>${listing.pricePerNight}</Text>
          <Text style={styles.footerPriceUnit}> /night</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.footerBookButton,
            !listing.available && styles.footerBookButtonDisabled,
            pressed && listing.available && styles.footerBookButtonPressed,
          ]}
          onPress={() => router.push(`/booking/${listing.id}`)}
          disabled={!listing.available}
        >
          <Text style={[
            styles.footerBookButtonText,
            !listing.available && styles.footerBookButtonTextDisabled,
          ]}>
            {listing.available ? 'Book Now' : 'Unavailable'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Layout ── */
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingBottom: 120,
  },
  errorText: {
    color: Colors.textMid,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },

  /* ── Image Gallery ── */
  carouselContainer: {
    position: 'relative',
  },
  imageCarousel: {
    height: 300,
  },
  image: {
    height: 300,
  },
  imageCountBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCountText: {
    color: Colors.textHi,
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
  },

  /* ── Details area ── */
  details: {
    padding: Spacing.lg,
  },

  /* ── Header meta row: category pill + distance | rating ── */
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryPill: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  categoryPillText: {
    color: Colors.accent,
    fontSize: FontSize.caption,
    fontWeight: '700',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: Colors.textMid,
    fontSize: FontSize.caption,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: Colors.textHi,
    fontSize: FontSize.label,
    fontWeight: '700',
  },
  reviewCountText: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
  },

  /* ── Title ── */
  name: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    lineHeight: 32,
  },

  /* ── Address row ── */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  addressRowPressed: {
    opacity: 0.7,
  },
  addressText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    flex: 1,
  },

  /* ── Price ── */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  price: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  perNight: {
    color: Colors.textMid,
    fontSize: FontSize.body,
  },

  /* ── Description ── */
  description: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },

  /* ── Sections ── */
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textHi,
    fontSize: FontSize.h2,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },

  /* ── Amenities ── */
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenityTag: {
    backgroundColor: Colors.bgElevatedHi,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  amenityText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
  },

  /* ── Stay Info Card ── */
  stayInfoCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  stayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  stayInfoIconWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stayInfoLabel: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    flex: 1,
  },
  stayInfoValue: {
    color: Colors.textHi,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  stayInfoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md + 32 + Spacing.sm,
  },

  /* ── Access Note ── */
  accessNote: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  accessNoteText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    lineHeight: 20,
    flex: 1,
  },

  /* ── Cancellation Policy ── */
  policyCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  policyText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    lineHeight: 20,
    flex: 1,
  },

  /* ── Host Info ── */
  hostCard: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    marginRight: Spacing.md,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    color: Colors.textHi,
    fontSize: FontSize.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  hostMeta: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
  },

  /* ── Reviews ── */
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsSummaryText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  reviewsPlaceholder: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewsPlaceholderText: {
    color: Colors.textLo,
    fontSize: FontSize.label,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── Sticky Footer ── */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.lg,
  },
  footerPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  footerPriceText: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontWeight: '800',
  },
  footerPriceUnit: {
    color: Colors.textMid,
    fontSize: FontSize.label,
  },
  footerBookButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  footerBookButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footerBookButtonDisabled: {
    opacity: 0.5,
  },
  footerBookButtonText: {
    color: Colors.bg,
    fontSize: FontSize.body,
    fontWeight: '800',
  },
  footerBookButtonTextDisabled: {
    color: Colors.textLo,
  },
});
