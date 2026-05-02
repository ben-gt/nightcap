import { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { Booking, Listing } from '@/types';
import {
  useVisibleBookings,
  useBookingsByListing,
  buildListingColorMap,
  getBookingSpan,
} from '@/lib/calendar';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const BOOKING_HEIGHT = 28;
const BOOKING_GAP = 3;
const LISTING_COL_WIDTH = 110;

interface WeekViewProps {
  bookings: Booking[];
  listings: Listing[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  onSelectBooking: (booking: Booking) => void;
}

export default function WeekView({
  bookings,
  listings,
  selectedDate,
  onChangeDate,
  onSelectBooking,
}: WeekViewProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();

  const visibleBookings = useVisibleBookings(bookings, weekStart, weekEnd);
  const byListing = useBookingsByListing(visibleBookings);
  const colorMap = useMemo(() => buildListingColorMap(listings), [listings]);

  // Only show listings that have bookings this week, plus any remaining
  const sortedListings = useMemo(() => {
    const withBookings = listings.filter((l) => byListing.has(l.id));
    const without = listings.filter((l) => !byListing.has(l.id));
    return [...withBookings, ...without];
  }, [listings, byListing]);

  const dayWidth = gridWidth > 0 ? gridWidth / 7 : 0;

  function onLayout(e: LayoutChangeEvent) {
    setGridWidth(e.nativeEvent.layout.width);
  }

  return (
    <View style={styles.container}>
      {/* Week navigation */}
      <View style={styles.nav}>
        <Pressable onPress={() => onChangeDate(subWeeks(selectedDate, 1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textHi} />
        </Pressable>
        <Text style={styles.navTitle}>
          {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM yyyy')}
        </Text>
        <Pressable onPress={() => onChangeDate(addWeeks(selectedDate, 1))} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color={Colors.textHi} />
        </Pressable>
      </View>

      <ScrollView horizontal={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Day headers */}
            <View style={styles.headerRow}>
              <View style={[styles.listingCol, styles.headerCell]}>
                <Text style={styles.headerLabel}>Property</Text>
              </View>
              <View style={styles.daysRow} onLayout={onLayout}>
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, today);
                  return (
                    <View key={day.toISOString()} style={[styles.dayHeader, { width: dayWidth || 'auto', flex: dayWidth ? undefined : 1 }]}>
                      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                        {format(day, 'EEE')}
                      </Text>
                      <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                        {format(day, 'd')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Listing rows */}
            {sortedListings.map((listing) => {
              const listingBookings = byListing.get(listing.id) ?? [];
              const color = colorMap.get(listing.id) ?? Colors.accent;

              // Stack overlapping bookings
              const rows: Booking[][] = [];
              for (const b of listingBookings) {
                const span = getBookingSpan(b, weekStart, 7);
                if (!span) continue;
                let placed = false;
                for (const row of rows) {
                  const overlaps = row.some((existing) => {
                    const es = getBookingSpan(existing, weekStart, 7);
                    if (!es) return false;
                    return span.startCol < es.startCol + es.spanCols && span.startCol + span.spanCols > es.startCol;
                  });
                  if (!overlaps) {
                    row.push(b);
                    placed = true;
                    break;
                  }
                }
                if (!placed) rows.push([b]);
              }

              const rowHeight = Math.max(1, rows.length) * (BOOKING_HEIGHT + BOOKING_GAP) + BOOKING_GAP;

              return (
                <View key={listing.id} style={styles.listingRow}>
                  {/* Listing name column */}
                  <View style={[styles.listingCol, { borderLeftColor: color, borderLeftWidth: 3 }]}>
                    <Text style={styles.listingName} numberOfLines={2}>{listing.name}</Text>
                    <Text style={styles.listingType}>{listing.type}</Text>
                  </View>

                  {/* Booking spans grid */}
                  <View style={[styles.gridArea, { height: rowHeight, width: gridWidth || '100%' }]}>
                    {/* Day column lines */}
                    {weekDays.map((day, i) => (
                      <View
                        key={day.toISOString()}
                        style={[
                          styles.gridLine,
                          { left: i * dayWidth, width: dayWidth },
                          isSameDay(day, today) && styles.gridLineToday,
                        ]}
                      />
                    ))}

                    {/* Booking bars */}
                    {rows.map((row, rowIdx) =>
                      row.map((b) => {
                        const span = getBookingSpan(b, weekStart, 7);
                        if (!span || dayWidth === 0) return null;
                        return (
                          <Pressable
                            key={b.id}
                            onPress={() => onSelectBooking(b)}
                            style={[
                              styles.bookingBar,
                              {
                                left: span.startCol * dayWidth + 2,
                                width: span.spanCols * dayWidth - 4,
                                top: rowIdx * (BOOKING_HEIGHT + BOOKING_GAP) + BOOKING_GAP,
                                height: BOOKING_HEIGHT,
                                backgroundColor: color,
                              },
                            ]}
                          >
                            <Text style={styles.bookingBarText} numberOfLines={1}>
                              {b.guestName}
                            </Text>
                          </Pressable>
                        );
                      }),
                    )}

                    {/* Empty state */}
                    {rows.length === 0 && (
                      <View style={styles.emptyRow}>
                        <Text style={styles.emptyRowText}>No bookings</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  navTitle: {
    color: Colors.textHi,
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  headerLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  daysRow: {
    flexDirection: 'row',
    flex: 1,
    minWidth: 420,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dayLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  dayLabelToday: {
    color: Colors.accent,
  },
  dayNumber: {
    color: Colors.textHi,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: Colors.accent,
  },

  // Listing rows
  listingRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listingCol: {
    width: LISTING_COL_WIDTH,
    padding: Spacing.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  listingName: {
    color: Colors.textHi,
    fontSize: FontSize.xs,
    fontWeight: '700',
    lineHeight: 16,
  },
  listingType: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'capitalize',
    marginTop: 2,
  },

  // Grid
  gridArea: {
    position: 'relative',
    flex: 1,
    minWidth: 420,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  gridLineToday: {
    backgroundColor: 'rgba(232, 165, 48, 0.05)',
  },

  // Booking bars
  bookingBar: {
    position: 'absolute',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  bookingBarText: {
    color: Colors.bg,
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty
  emptyRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRowText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
