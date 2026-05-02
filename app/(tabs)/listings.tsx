import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import ListingCard from '@/components/ListingCard';
import { useStore } from '@/store';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { Listing, PropertyType } from '@/types';

/** Haversine distance in km between two lat/lng points. */
function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortOption = 'distance' | 'price-asc' | 'price-desc' | 'rating';

const sortLabels: Record<SortOption, string> = {
  distance: 'Nearest',
  'price-asc': 'Price: Low',
  'price-desc': 'Price: High',
  rating: 'Top Rated',
};

const typeLabels: Record<PropertyType, string> = {
  cabin: 'Cabin',
  motel: 'Motel',
  pod: 'Sleep Pod',
  'rv-park': 'RV Park',
  lodge: 'Lodge',
  campground: 'Campground',
};

const ALL_TYPES = Object.keys(typeLabels) as PropertyType[];

export default function ListingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;
  const listings = useStore((s) => s.listings);
  const userLocation = useStore((s) => s.userLocation);
  const setUserLocation = useStore((s) => s.setUserLocation);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('distance');
  const [selectedTypes, setSelectedTypes] = useState<Set<PropertyType>>(new Set());
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    if (userLocation) return;
    if (Platform.OS === 'web' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      );
    }
  }, []);

  const toggleType = useCallback((type: PropertyType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const getDist = useCallback(
    (listing: Listing): number | undefined => {
      if (!userLocation) return undefined;
      return distanceKm(userLocation.latitude, userLocation.longitude, listing.latitude, listing.longitude);
    },
    [userLocation],
  );

  const results = useMemo(() => {
    let filtered = listings;

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q),
      );
    }

    // Type filter
    if (selectedTypes.size > 0) {
      filtered = filtered.filter((l) => selectedTypes.has(l.type));
    }

    // Availability filter
    if (availableOnly) {
      filtered = filtered.filter((l) => l.available);
    }

    // Sort
    const sorted = [...filtered];
    switch (sort) {
      case 'distance':
        if (userLocation) {
          sorted.sort(
            (a, b) =>
              distanceKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
              distanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude),
          );
        }
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
    }

    return sorted;
  }, [listings, search, selectedTypes, availableOnly, sort, userLocation]);

  const hasActiveFilters = search.trim() || selectedTypes.size > 0 || availableOnly;

  return (
    <View style={styles.container}>
      {/* Sticky search bar */}
      <View style={[styles.searchContainer, isWide && styles.centeredRow]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or address..."
          placeholderTextColor={Colors.textLo}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable style={styles.clearButton} onPress={() => setSearch('')}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Filter chips row - separate background, own z-index */}
      <View style={[styles.filterContainer, isWide && styles.centeredRow]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {(Object.keys(sortLabels) as SortOption[]).map((key) => {
            if (key === 'distance' && !userLocation) return null;
            const active = sort === key;
            return (
              <Pressable
                key={key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSort(key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {sortLabels[key]}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.chipDivider} />

          {/* Type filters */}
          {ALL_TYPES.map((type) => {
            const active = selectedTypes.has(type);
            return (
              <Pressable
                key={type}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleType(type)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {typeLabels[type]}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.chipDivider} />

          {/* Available only */}
          <Pressable
            style={[styles.chip, availableOnly && styles.chipActive]}
            onPress={() => setAvailableOnly((v) => !v)}
          >
            <Text style={[styles.chipText, availableOnly && styles.chipTextActive]}>
              Available
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Results count */}
      {hasActiveFilters && (
        <Text style={styles.resultCount}>
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </Text>
      )}

      {/* Listing cards */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, isWide && styles.listWide]}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            distanceKm={getDist(item)}
            onPress={() => router.push(`/listing/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {hasActiveFilters ? 'No listings match your filters.' : 'No listings available.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bg,
    zIndex: 2,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.textHi,
    fontSize: FontSize.md,
  },
  clearButton: {
    position: 'absolute',
    right: Spacing.md + Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  clearText: {
    color: Colors.textLo,
    fontSize: FontSize.md,
  },
  filterContainer: {
    backgroundColor: Colors.bgElevated,
    zIndex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipRow: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md + Spacing.xs,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: Colors.bgElevatedHi,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.accent,
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  resultCount: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  listWide: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  centeredRow: {
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  separator: {
    height: 0,
  },
  empty: {
    color: Colors.textMid,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
