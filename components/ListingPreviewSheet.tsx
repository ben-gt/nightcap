import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Listing, PropertyType } from '@/types';
import Button from '@/components/ui/Button';

interface ListingPreviewSheetProps {
  listing: Listing;
  distanceKm?: number;
  onViewDetails: () => void;
  onBookNow: () => void;
  onClose: () => void;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

const typeLabels: Record<PropertyType, string> = {
  cabin: 'Cabin',
  motel: 'Motel',
  pod: 'Sleep Pod',
  'rv-park': 'RV Park',
  lodge: 'Lodge',
  campground: 'Campground',
};

export default function ListingPreviewSheet({
  listing,
  distanceKm,
  onViewDetails,
  onBookNow,
  onClose,
}: ListingPreviewSheetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <Pressable style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={20} color={Colors.textLo} />
      </Pressable>

      <Pressable onPress={onViewDetails} style={styles.contentRow}>
        <Image source={{ uri: listing.images[0] }} style={styles.image} resizeMode="cover" />
        <View style={styles.info}>
          <View style={styles.tagRow}>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{typeLabels[listing.type]}</Text>
            </View>
            {distanceKm != null && (
              <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>{listing.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{listing.address}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${listing.pricePerNight}</Text>
            <Text style={styles.perNight}>/night</Text>
            <Text style={styles.rating}>  ★ {listing.rating}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.amenityRow}>
        {listing.amenities.slice(0, 5).map((a) => (
          <View key={a} style={styles.amenityTag}>
            <Text style={styles.amenityText}>{a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="View Details"
          onPress={onViewDetails}
          variant="secondary"
          size="md"
          style={styles.actionButton}
        />
        <Button
          title="Book Now"
          onPress={onBookNow}
          size="md"
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.textLo,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.md,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.bgElevatedHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeTag: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  distance: {
    color: Colors.textMid,
    fontSize: FontSize.caption,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  name: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  address: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  perNight: {
    color: Colors.textMid,
    fontSize: FontSize.label,
  },
  rating: {
    color: Colors.warning,
    fontSize: FontSize.label,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  amenityTag: {
    backgroundColor: Colors.bgElevatedHi,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  amenityText: {
    color: Colors.textMid,
    fontSize: FontSize.caption,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
