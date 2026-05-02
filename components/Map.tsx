import { StyleSheet, View, Text } from 'react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { Listing } from '@/types';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapProps {
  listings: Listing[];
  onMarkerPress: (listing: Listing) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Native fallback — Leaflet is web-only.
// For native, swap this with react-native-maps.
export default function Map({ listings, onMarkerPress }: MapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Map view is available on web.{'\n'}
        For native, integrate react-native-maps.
      </Text>
      {listings.filter((l) => l.available).map((listing) => (
        <Text
          key={listing.id}
          style={styles.listingLink}
          onPress={() => onMarkerPress(listing)}
        >
          📍 {listing.name} — ${listing.pricePerNight}/night
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  text: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  listingLink: {
    color: Colors.accent,
    fontSize: FontSize.md,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
});
