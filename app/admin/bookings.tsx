import { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { Booking } from '@/types';
import { buildListingColorMap, type ViewMode } from '@/lib/calendar';
import WeekView from '@/components/admin/WeekView';
import MonthView from '@/components/admin/MonthView';
import YearView from '@/components/admin/YearView';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const VIEW_MODES: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'list', label: 'List', icon: 'list' },
  { key: 'week', label: 'Week', icon: 'calendar-outline' },
  { key: 'month', label: 'Month', icon: 'grid-outline' },
  { key: 'year', label: 'Year', icon: 'albums-outline' },
];

const statusColors: Record<string, string> = {
  pending: Colors.warning,
  confirmed: Colors.success,
  'checked-in': Colors.accent,
  completed: Colors.textMuted,
  cancelled: Colors.error,
};

const nextStatus: Record<string, Booking['status'] | null> = {
  pending: 'confirmed',
  confirmed: 'checked-in',
  'checked-in': 'completed',
  completed: null,
  cancelled: null,
};

export default function AdminBookingsScreen() {
  const bookings = useStore((s) => s.bookings);
  const listings = useStore((s) => s.listings);
  const updateBookingStatus = useStore((s) => s.updateBookingStatus);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const colorMap = useMemo(() => buildListingColorMap(listings), [listings]);

  function renderBookingCard(item: Booking) {
    const listing = listings.find((l) => l.id === item.listingId);
    const color = colorMap.get(item.listingId) ?? Colors.accent;
    const next = nextStatus[item.status];
    return (
      <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]} key={item.id}>
        <View style={styles.cardHeader}>
          <Text style={styles.guestName}>{item.guestName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.listingName}>{listing?.name ?? 'Unknown'}</Text>
        <Text style={styles.listingType}>{listing?.type ?? ''}</Text>
        <Text style={styles.dates}>{item.checkIn} → {item.checkOut}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>${item.totalPrice} AUD</Text>
          <Text style={styles.accessCode}>Code: {item.accessCode}</Text>
        </View>
        {next && (
          <Pressable
            style={styles.advanceButton}
            onPress={() => updateBookingStatus(item.id, next)}
          >
            <Text style={styles.advanceText}>Mark as {next}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Group list view by listing
  const groupedForList = useMemo(() => {
    const map = new Map<string, { listing: typeof listings[0] | undefined; bookings: Booking[] }>();
    for (const b of bookings) {
      const existing = map.get(b.listingId);
      if (existing) {
        existing.bookings.push(b);
      } else {
        map.set(b.listingId, {
          listing: listings.find((l) => l.id === b.listingId),
          bookings: [b],
        });
      }
    }
    return Array.from(map.values());
  }, [bookings, listings]);

  return (
    <View style={styles.container}>
      {/* View mode segmented control */}
      <View style={styles.toggleBar}>
        {VIEW_MODES.map(({ key, label, icon }) => {
          const active = viewMode === key;
          return (
            <Pressable
              key={key}
              style={[styles.toggleBtn, active && styles.toggleBtnActive]}
              onPress={() => setViewMode(key)}
            >
              <Ionicons name={icon as any} size={16} color={active ? Colors.bg : Colors.textMid} />
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Booking detail overlay (from week view tap) */}
      {selectedBooking && viewMode === 'week' && (
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            {renderBookingCard(selectedBooking)}
            <Pressable
              style={styles.closeDetail}
              onPress={() => setSelectedBooking(null)}
            >
              <Text style={styles.closeDetailText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Views */}
      {viewMode === 'list' && (
        <ScrollView contentContainerStyle={styles.list}>
          {groupedForList.length === 0 ? (
            <Text style={styles.empty}>No bookings yet.</Text>
          ) : (
            groupedForList.map(({ listing, bookings: lBookings }) => {
              const color = colorMap.get(listing?.id ?? '') ?? Colors.accent;
              return (
                <View key={listing?.id ?? 'unknown'} style={styles.listingGroup}>
                  <View style={[styles.listingGroupHeader, { borderLeftColor: color }]}>
                    <Text style={styles.listingGroupName}>
                      {listing?.name ?? 'Unknown Property'}
                    </Text>
                    <Text style={styles.listingGroupMeta}>
                      {listing?.type} · {listing?.address}
                    </Text>
                    <Text style={styles.listingGroupCount}>
                      {lBookings.length} booking{lBookings.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {lBookings.map((b) => renderBookingCard(b))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {viewMode === 'week' && (
        <WeekView
          bookings={bookings}
          listings={listings}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onSelectBooking={setSelectedBooking}
        />
      )}

      {viewMode === 'month' && (
        <ScrollView>
          <MonthView
            bookings={bookings}
            listings={listings}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            onUpdateStatus={updateBookingStatus}
          />
        </ScrollView>
      )}

      {viewMode === 'year' && (
        <ScrollView>
          <YearView
            bookings={bookings}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            onNavigateToMonth={(date) => {
              setSelectedDate(date);
              setViewMode('month');
            }}
          />
        </ScrollView>
      )}
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

  // Toggle bar
  toggleBar: {
    flexDirection: 'row',
    margin: Spacing.md,
    marginBottom: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent,
  },
  toggleText: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.bg,
  },

  // Listing groups (list view)
  listingGroup: {
    marginBottom: Spacing.lg,
  },
  listingGroupHeader: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  listingGroupName: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  listingGroupMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  listingGroupCount: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  // Booking cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  guestName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: Colors.black,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  listingName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  listingType: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
  dates: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  price: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  accessCode: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
  },
  advanceButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  advanceText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Detail overlay (week view)
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    zIndex: 10,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  detailCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  closeDetail: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  closeDetailText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Empty
  empty: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
