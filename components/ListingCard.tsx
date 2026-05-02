import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Listing, PropertyType } from '@/types';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  compact?: boolean;
  distanceKm?: number;
}

const typeLabels: Record<PropertyType, string> = {
  cabin: 'Cabin',
  motel: 'Motel',
  pod: 'Sleep Pod',
  'rv-park': 'RV Park',
  lodge: 'Lodge',
  campground: 'Campground',
};

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export default function ListingCard({ listing, onPress, compact, distanceKm }: ListingCardProps) {
  const [saved, setSaved] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Hero image with heart/bookmark overlay */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: listing.images[0] }}
          style={compact ? styles.imageCompact : styles.image}
          resizeMode="cover"
        />
        <Pressable
          style={styles.heartButton}
          onPress={(e) => {
            e.stopPropagation?.();
            setSaved((v) => !v);
          }}
          hitSlop={8}
        >
          <Text style={[styles.heartIcon, saved && styles.heartIconSaved]}>
            {saved ? '♥' : '♡'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Category badge + unavailable tag */}
        <View style={styles.header}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{typeLabels[listing.type]}</Text>
          </View>
          {!listing.available && (
            <View style={[styles.typeTag, styles.unavailableTag]}>
              <Text style={[styles.typeText, styles.unavailableText]}>Unavailable</Text>
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>{listing.name}</Text>
        {listing.roomTypeName && (
          <Text style={styles.roomType} numberOfLines={1}>{listing.roomTypeName}</Text>
        )}

        {/* Address + distance on same line */}
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {listing.address}
          </Text>
          {distanceKm != null && (
            <Text style={styles.distance}> · {formatDistance(distanceKm)}</Text>
          )}
        </View>

        {/* Amenities */}
        {!compact && (
          <View style={styles.amenities}>
            {listing.amenities.slice(0, 4).map((a) => (
              <View key={a} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
            {listing.amenities.length > 4 && (
              <Text style={styles.moreAmenities}>+{listing.amenities.length - 4}</Text>
            )}
          </View>
        )}

        {/* Footer: price left, rating right */}
        <View style={styles.footer}>
          <Text style={styles.price}>
            ${listing.pricePerNight}
            <Text style={styles.perNight}> /night</Text>
          </Text>
          <Text style={styles.rating}>
            ★ {listing.rating} ({listing.reviewCount})
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardCompact: {
    flexDirection: 'row',
    height: 120,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imageCompact: {
    width: 120,
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: Colors.textHi,
    lineHeight: 24,
  },
  heartIconSaved: {
    color: Colors.danger,
  },
  content: {
    padding: Spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  typeTag: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  unavailableTag: {
    backgroundColor: Colors.bgElevatedHi,
  },
  typeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  unavailableText: {
    color: Colors.textLo,
  },
  name: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xxs,
  },
  roomType: {
    color: Colors.textMid,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xxs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  address: {
    color: Colors.textMid,
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  distance: {
    color: Colors.textMid,
    fontSize: FontSize.sm,
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  price: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  perNight: {
    color: Colors.textMid,
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  rating: {
    color: Colors.warning,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  amenityTag: {
    backgroundColor: Colors.bgElevatedHi,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: BorderRadius.sm,
  },
  amenityText: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
  },
  moreAmenities: {
    color: Colors.textLo,
    fontSize: FontSize.xs,
    alignSelf: 'center',
  },
});
