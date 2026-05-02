import { StyleSheet, View, Text, FlatList, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import ListingCard from '@/components/ListingCard';
import Button from '@/components/ui/Button';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function VendorScreen() {
  const router = useRouter();
  const listings = useStore((s) => s.listings);
  const bookings = useStore((s) => s.bookings);
  const deleteListing = useStore((s) => s.deleteListing);
  const updateListing = useStore((s) => s.updateListing);

  const stats = {
    total: listings.length,
    available: listings.filter((l) => l.available).length,
    activeBookings: bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked-in').length,
    revenue: bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0),
  };

  function handleDelete(id: string, name: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}"? This cannot be undone.`)) deleteListing(id);
    } else {
      Alert.alert('Delete Listing', `Delete "${name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteListing(id) },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard value={String(stats.total)} label="Properties" />
              <StatCard value={String(stats.available)} label="Available" />
              <StatCard value={String(stats.activeBookings)} label="Active Stays" />
              <StatCard value={`$${stats.revenue}`} label="Revenue" color={Colors.success} />
            </View>

            {/* Quick actions */}
            <View style={styles.actions}>
              <Button
                title="+ Add Listing"
                variant="outline"
                size="sm"
                onPress={() => router.push('/admin/listings/new')}
                style={{ flex: 1 }}
              />
              <Button
                title="All Bookings"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/admin/bookings')}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.sectionTitle}>Your Listings</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ListingCard listing={item} onPress={() => router.push(`/admin/listings/${item.id}`)} compact />
            <View style={styles.cardActions}>
              <Pressable
                style={styles.actionChip}
                onPress={() => updateListing(item.id, { available: !item.available })}
              >
                <Ionicons
                  name={item.available ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={16}
                  color={item.available ? Colors.warning : Colors.success}
                />
                <Text style={[styles.actionText, { color: item.available ? Colors.warning : Colors.success }]}>
                  {item.available ? 'Disable' : 'Enable'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionChip}
                onPress={() => router.push(`/admin/listings/${item.id}`)}
              >
                <Ionicons name="create-outline" size={16} color={Colors.accent} />
                <Text style={[styles.actionText, { color: Colors.accent }]}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.actionChip}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySubtitle}>Add your first property to start accepting bookings.</Text>
            <Button
              title="Add Listing"
              onPress={() => router.push('/admin/listings/new')}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        }
      />
    </View>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    color: Colors.accent,
    fontSize: FontSize.xxl,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  // Section
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },

  // Cards
  cardWrapper: {
    gap: Spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  separator: {
    height: Spacing.md,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
