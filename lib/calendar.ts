import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  parseISO,
  format,
  areIntervalsOverlapping,
  differenceInDays,
} from 'date-fns';
import { Booking, Listing } from '@/types';

// ── Listing color palette (complements gold-on-navy) ──────────────────
const LISTING_COLORS = [
  '#E8A530', // gold (primary)
  '#5EEAD4', // teal
  '#F472B6', // rose
  '#818CF8', // indigo
  '#A3E635', // lime
  '#FB923C', // orange
  '#67E8F9', // cyan
  '#C084FC', // purple
  '#FCA5A5', // coral
  '#86EFAC', // mint
];

export function getListingColor(index: number): string {
  return LISTING_COLORS[index % LISTING_COLORS.length];
}

export function buildListingColorMap(listings: Listing[]): Map<string, string> {
  const map = new Map<string, string>();
  listings.forEach((l, i) => map.set(l.id, getListingColor(i)));
  return map;
}

// ── Booking density map (date string → count) ────────────────────────
export function useDensityMap(bookings: Booking[]) {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      const days = eachDayOfInterval({
        start: parseISO(b.checkIn),
        end: parseISO(b.checkOut),
      });
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd');
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [bookings]);
}

// ── Bookings by date map ─────────────────────────────────────────────
export function useBookingsByDate(bookings: Booking[]) {
  return useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const days = eachDayOfInterval({
        start: parseISO(b.checkIn),
        end: parseISO(b.checkOut),
      });
      for (const d of days) {
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) ?? [];
        existing.push(b);
        map.set(key, existing);
      }
    }
    return map;
  }, [bookings]);
}

// ── Bookings grouped by listing ──────────────────────────────────────
export function useBookingsByListing(bookings: Booking[]) {
  return useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const existing = map.get(b.listingId) ?? [];
      existing.push(b);
      map.set(b.listingId, existing);
    }
    return map;
  }, [bookings]);
}

// ── Filter bookings to a visible date range ──────────────────────────
export function useVisibleBookings(
  bookings: Booking[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  return useMemo(() => {
    const range = { start: rangeStart, end: rangeEnd };
    return bookings.filter((b) => {
      const bookingRange = { start: parseISO(b.checkIn), end: parseISO(b.checkOut) };
      return areIntervalsOverlapping(range, bookingRange, { inclusive: true });
    });
  }, [bookings, rangeStart.getTime(), rangeEnd.getTime()]);
}

// ── Span calculation for week view ───────────────────────────────────
export function getBookingSpan(
  booking: Booking,
  weekStart: Date,
  totalDays: number,
): { startCol: number; spanCols: number } | null {
  const checkIn = parseISO(booking.checkIn);
  const checkOut = parseISO(booking.checkOut);
  const startIdx = differenceInDays(checkIn, weekStart);
  const endIdx = differenceInDays(checkOut, weekStart);

  const clampedStart = Math.max(startIdx, 0);
  const clampedEnd = Math.min(endIdx, totalDays);

  if (clampedStart >= totalDays || clampedEnd <= 0) return null;

  return {
    startCol: clampedStart,
    spanCols: clampedEnd - clampedStart,
  };
}

export type ViewMode = 'list' | 'week' | 'month' | 'year';
