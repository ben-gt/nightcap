import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Map from '@/components/Map';
import ListingPreviewSheet from '@/components/ListingPreviewSheet';
import { useStore } from '@/store';
import { Listing } from '@/types';
import { Colors } from '@/constants/theme';

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ExploreScreen() {
  const router = useRouter();
  const listings = useStore((s) => s.listings);
  const userLocation = useStore((s) => s.userLocation);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const availableListings = useMemo(() => listings.filter((l) => l.available), [listings]);

  const getDistance = useCallback(
    (listing: Listing) => {
      if (!userLocation) return undefined;
      return distanceKm(userLocation.latitude, userLocation.longitude, listing.latitude, listing.longitude);
    },
    [userLocation]
  );

  return (
    <View style={styles.container}>
      <Map
        listings={availableListings}
        onMarkerPress={(listing) => setSelectedListing(listing)}
      />
      {selectedListing && (
        <View style={styles.sheetOverlay}>
          <ListingPreviewSheet
            listing={selectedListing}
            distanceKm={getDistance(selectedListing)}
            onViewDetails={() => {
              setSelectedListing(null);
              router.push(`/listing/${selectedListing.id}`);
            }}
            onBookNow={() => {
              setSelectedListing(null);
              router.push(`/booking/${selectedListing.id}`);
            }}
            onClose={() => setSelectedListing(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
