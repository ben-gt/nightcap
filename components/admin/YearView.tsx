import { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  format,
  isSameMonth,
  isSameDay,
  addYears,
  subYears,
} from 'date-fns';
import { Booking } from '@/types';
import { useDensityMap } from '@/lib/calendar';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface YearViewProps {
  bookings: Booking[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  onNavigateToMonth: (date: Date) => void;
}

export default function YearView({
  bookings,
  selectedDate,
  onChangeDate,
  onNavigateToMonth,
}: YearViewProps) {
  const year = selectedDate.getFullYear();
  const densityMap = useDensityMap(bookings);
  const today = new Date();

  const maxDensity = useMemo(() => {
    let max = 0;
    densityMap.forEach((v) => { if (v > max) max = v; });
    return max || 1;
  }, [densityMap]);

  const months = useMemo(
    () => eachMonthOfInterval({ start: startOfYear(selectedDate), end: endOfYear(selectedDate) }),
    [year],
  );

  return (
    <View style={styles.container}>
      {/* Year navigation */}
      <View style={styles.nav}>
        <Pressable onPress={() => onChangeDate(subYears(selectedDate, 1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textHi} />
        </Pressable>
        <Text style={styles.navTitle}>{year}</Text>
        <Pressable onPress={() => onChangeDate(addYears(selectedDate, 1))} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color={Colors.textHi} />
        </Pressable>
      </View>

      {/* 4x3 grid of mini-months */}
      <View style={styles.monthsGrid}>
        {months.map((month) => (
          <MiniMonth
            key={month.toISOString()}
            month={month}
            densityMap={densityMap}
            maxDensity={maxDensity}
            today={today}
            onPress={() => onNavigateToMonth(month)}
          />
        ))}
      </View>
    </View>
  );
}

function MiniMonth({
  month,
  densityMap,
  maxDensity,
  today,
  onPress,
}: {
  month: Date;
  densityMap: Map<string, number>;
  maxDensity: number;
  today: Date;
  onPress: () => void;
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  return (
    <Pressable style={styles.miniMonth} onPress={onPress}>
      <Text style={styles.miniMonthTitle}>{format(month, 'MMM')}</Text>
      <View style={styles.miniWeekdays}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.miniWeekday}>{d}</Text>
        ))}
      </View>
      <View style={styles.miniDayGrid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const density = densityMap.get(key) ?? 0;
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const opacity = density > 0 ? 0.25 + 0.75 * (density / maxDensity) : 0;

          return (
            <View key={key} style={styles.miniDayCell}>
              {isCurrentMonth ? (
                <View
                  style={[
                    styles.miniDayDot,
                    density > 0 && { backgroundColor: Colors.accent, opacity },
                    isToday && styles.miniDayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.miniDayText,
                      !isCurrentMonth && styles.miniDayTextOutside,
                      isToday && styles.miniDayTextToday,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>
              ) : (
                <View style={styles.miniDayDot}>
                  <Text style={[styles.miniDayText, styles.miniDayTextOutside]}>
                    {format(day, 'd')}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navTitle: {
    color: Colors.textHi,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },

  // Grid of mini-months
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  miniMonth: {
    width: '31.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  miniMonthTitle: {
    color: Colors.textHi,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  miniWeekdays: {
    flexDirection: 'row',
  },
  miniWeekday: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '600',
  },
  miniDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDayDot: {
    width: '85%',
    height: '85%',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDayToday: {
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  miniDayText: {
    color: Colors.textHi,
    fontSize: 8,
    fontWeight: '500',
  },
  miniDayTextOutside: {
    opacity: 0.2,
  },
  miniDayTextToday: {
    color: Colors.accent,
    fontWeight: '700',
  },
});
