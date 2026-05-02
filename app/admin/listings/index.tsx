import { StyleSheet, View, Text, FlatList, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/store';
import { Property, PropertyType } from '@/types';
import Button from '@/components/ui/Button';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const TYPE_LABELS: Record<PropertyType, string> = {
  motel: 'Motel',
  cabin: 'Cabin',
  pod: 'Pod',
  'rv-park': 'RV Park',
  lodge: 'Lodge',
  campground: 'Campground',
};

export default function AdminListingsScreen() {
  const router = useRouter();
  const properties = useStore((s) => s.properties);
  const deleteProperty = useStore((s) => s.deleteProperty);
  const updateRoomType = useStore((s) => s.updateRoomType);

  function handleDelete(id: string, name: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}" and all its room types? This cannot be undone.`)) {
        deleteProperty(id);
      }
    } else {
      Alert.alert('Delete Property', `Delete "${name}" and all its room types? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProperty(id) },
      ]);
    }
  }

  function toggleRoomAvailability(propertyId: string, roomTypeId: string, available: boolean) {
    updateRoomType(propertyId, roomTypeId, { available: !available });
  }

  function renderProperty({ item: prop }: { item: Property }) {
    const totalRooms = prop.roomTypes.reduce((sum, rt) => sum + rt.roomCount, 0);
    const priceRange = prop.roomTypes.length > 0
      ? `$${Math.min(...prop.roomTypes.map((r) => r.basePrice))}–$${Math.max(...prop.roomTypes.map((r) => r.basePrice))}`
      : 'No rooms';

    return (
      <View style={styles.propertyCard}>
        {/* Property header */}
        <View style={styles.propertyHeader}>
          <View style={styles.propertyInfo}>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{TYPE_LABELS[prop.type]}</Text>
            </View>
            <Text style={styles.propertyName}>{prop.name}</Text>
            <Text style={styles.propertyAddress} numberOfLines={1}>{prop.address}</Text>
            <Text style={styles.propertySummary}>
              {prop.roomTypes.length} type{prop.roomTypes.length !== 1 ? 's' : ''} {'\u00B7'} {totalRooms} room{totalRooms !== 1 ? 's' : ''} {'\u00B7'} {priceRange}/night
            </Text>
          </View>
          <View style={styles.propertyActions}>
            <Pressable onPress={() => router.push(`/admin/listings/${prop.id}`)}>
              <Text style={styles.actionEdit}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(prop.id, prop.name)}>
              <Text style={styles.actionDelete}>Delete</Text>
            </Pressable>
          </View>
        </View>

        {/* Room types */}
        {prop.roomTypes.map((rt) => (
          <View key={rt.id} style={styles.roomRow}>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{rt.name}</Text>
              <Text style={styles.roomMeta}>
                ${rt.basePrice}/night {'\u00B7'} {rt.beds} {'\u00B7'} {rt.roomCount} room{rt.roomCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Pressable onPress={() => toggleRoomAvailability(prop.id, rt.id, rt.available)}>
              <Text style={[styles.availabilityBadge, rt.available ? styles.badgeAvailable : styles.badgeUnavailable]}>
                {rt.available ? 'Available' : 'Disabled'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            title="+ Add New Property"
            onPress={() => router.push('/admin/listings/new')}
            variant="outline"
            style={styles.addButton}
          />
        }
        renderItem={renderProperty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md },
  addButton: { marginBottom: Spacing.md },
  separator: { height: Spacing.md },

  // Property card
  propertyCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  propertyHeader: {
    padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between',
  },
  propertyInfo: { flex: 1 },
  typeTag: {
    backgroundColor: Colors.accentMuted, paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1, borderRadius: BorderRadius.sm, alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  typeText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' },
  propertyName: { color: Colors.textHi, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xxs },
  propertyAddress: { color: Colors.textMid, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  propertySummary: { color: Colors.textLo, fontSize: FontSize.sm },
  propertyActions: { gap: Spacing.sm, alignItems: 'flex-end' },
  actionEdit: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },
  actionDelete: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },

  // Room rows
  roomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  roomInfo: { flex: 1 },
  roomName: { color: Colors.textHi, fontSize: FontSize.sm, fontWeight: '600' },
  roomMeta: { color: Colors.textLo, fontSize: FontSize.xs, marginTop: Spacing.xxs },
  availabilityBadge: {
    fontSize: FontSize.xs, fontWeight: '700', paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs + 1, borderRadius: BorderRadius.sm, overflow: 'hidden',
  },
  badgeAvailable: { backgroundColor: Colors.success + '22', color: Colors.success },
  badgeUnavailable: { backgroundColor: Colors.bgElevatedHi, color: Colors.textLo },
});
