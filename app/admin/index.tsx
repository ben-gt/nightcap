import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const listings = useStore((s) => s.listings);
  const bookings = useStore((s) => s.bookings);

  const stats = {
    totalListings: listings.length,
    availableListings: listings.filter((l) => l.available).length,
    totalBookings: bookings.length,
    activeBookings: bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked-in').length,
    revenue: bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Roadside Rooms Admin</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalListings}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.availableListings}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeBookings}</Text>
          <Text style={styles.statLabel}>Active Stays</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>${stats.revenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Manage</Text>

      <AdminMenuItem
        icon="bed-outline"
        label="Listings"
        subtitle={`${stats.totalListings} properties`}
        onPress={() => router.push('/admin/listings')}
      />
      <AdminMenuItem
        icon="receipt-outline"
        label="Bookings"
        subtitle={`${stats.totalBookings} total bookings`}
        onPress={() => router.push('/admin/bookings')}
      />
      <AdminMenuItem
        icon="add-circle-outline"
        label="Add New Listing"
        subtitle="Create a new property"
        onPress={() => router.push('/admin/listings/new')}
      />
      <AdminMenuItem
        icon="people-outline"
        label="Users & Roles"
        subtitle="Grant or revoke admin / vendor access"
        onPress={() => router.push('/admin/users')}
      />

      <Pressable style={styles.backLink} onPress={() => router.replace('/')}>
        <Text style={styles.backLinkText}>← Back to Guest View</Text>
      </Pressable>
    </ScrollView>
  );
}

function AdminMenuItem({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={24} color={Colors.accent} />
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemLabel}>{label}</Text>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
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
  greeting: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
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
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  menuItemPressed: {
    opacity: 0.85,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  menuItemSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  backLink: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  backLinkText: {
    color: Colors.accent,
    fontSize: FontSize.md,
  },
});
