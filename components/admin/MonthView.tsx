import { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { Booking, Listing } from '@/types';
import { useBookingsByDate, buildListingColorMap } from '@/lib/calendar';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

interface MonthViewProps {
  bookings: Booking[];
  listings: Listing[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  onUpdateStatus: (bookingId: string, status: Booking['status']) => void;
}

export default function MonthView({
  bookings,
  listings,
  selectedDate,
  onChangeDate,
  onUpdateStatus,
}: MonthViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const bookingsByDate = useBookingsByDate(bookings);
  const colorMap = useMemo(() => buildListingColorMap(listings), [listings]);
  const today = new Date();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [selectedDate]);

  const selectedBookings = selectedDay
    ? bookingsByDate.get(format(selectedDay, 'yyyy-MM-dd')) ?? []
    : [];

  // Group selected day's bookings by listing
  const groupedBookings = useMemo(() => {
    const map = new Map<string, { listing: Listing | undefined; bookings: Booking[] }>();
    for (const b of selectedBookings) {
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
  }, [selectedBookings, listings]);

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.nav}>
        <Pressable onPress={() => onChangeDate(subMonths(selectedDate, 1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textHi} />
        </Pressable>
        <Text style={styles.navTitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
        <Pressable onPress={() => onChangeDate(addMonths(selectedDate, 1))} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color={Colors.textHi} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekdayLabel}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.dayGrid}>
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isToday = isSameDay(day, today);

          // Get unique listing colors for this day's bookings
          const listingDots = [...new Set(dayBookings.map((b) => b.listingId))]
            .slice(0, 4)
            .map((id) => colorMap.get(id) ?? Colors.accent);

          return (
            <Pressable
              key={key}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !isCurrentMonth && styles.dayNumberOutside,
                  isToday && styles.dayNumberToday,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {format(day, 'd')}
              </Text>
              {listingDots.length > 0 && (
                <View style={styles.dotRow}>
                  {listingDots.map((color, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected date bookings grouped by listing */}
      {selectedDay && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedDateTitle}>
            {format(selectedDay, 'EEEE, d MMMM')}
          </Text>
          {groupedBookings.length === 0 ? (
            <Text style={styles.noBookingsText}>No bookings on this day.</Text>
          ) : (
            groupedBookings.map(({ listing, bookings: lBookings }) => {
              const color = colorMap.get(listing?.id ?? '') ?? Colors.accent;
              return (
                <View key={listing?.id ?? 'unknown'} style={styles.listingGroup}>
                  <View style={[styles.listingGroupHeader, { borderLeftColor: color }]}>
                    <Text style={styles.listingGroupName}>
                      {listing?.name ?? 'Unknown Property'}
                    </Text>
                    <Text style={styles.listingGroupType}>
                      {listing?.type} · {lBookings.length} booking{lBookings.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {lBookings.map((b) => {
                    const next = nextStatus[b.status];
                    return (
                      <View key={b.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.guestName}>{b.guestName}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusColors[b.status] }]}>
                            <Text style={styles.statusText}>{b.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.dates}>{b.checkIn} → {b.checkOut}</Text>
                        <View style={styles.cardFooter}>
                          <Text style={styles.price}>${b.totalPrice} AUD</Text>
                          <Text style={styles.accessCode}>Code: {b.accessCode}</Text>
                        </View>
                        {next && (
                          <Pressable
                            style={styles.advanceButton}
                            onPress={() => onUpdateStatus(b.id, next)}
                          >
                            <Text style={styles.advanceText}>Mark as {next}</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navTitle: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  // Weekday headers
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Day grid
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: BorderRadius.sm,
  },
  dayCellSelected: {
    backgroundColor: Colors.accentMuted,
  },
  dayNumber: {
    color: Colors.textHi,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  dayNumberOutside: {
    color: Colors.textMuted,
    opacity: 0.4,
  },
  dayNumberToday: {
    color: Colors.accent,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: Colors.accent,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Selected section
  selectedSection: {
    marginTop: Spacing.lg,
  },
  selectedDateTitle: {
    color: Colors.textHi,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  noBookingsText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  // Listing groups
  listingGroup: {
    marginBottom: Spacing.md,
  },
  listingGroupHeader: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  listingGroupName: {
    color: Colors.textHi,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  listingGroupType: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
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
});
