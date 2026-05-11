import { eachDayOfInterval, format, parseISO, isBefore, addDays } from 'date-fns';
import { Booking, Listing } from '@/types';

// A booking occupies nights [checkIn, checkOut) — checkOut day is free.
function bookingNights(b: Booking): string[] {
  const start = parseISO(b.checkIn);
  const end = parseISO(b.checkOut);
  if (!isBefore(start, end)) return [];
  // eachDayOfInterval is inclusive on both ends; we want [start, end)
  return eachDayOfInterval({ start, end: addDays(end, -1) }).map((d) =>
    format(d, 'yyyy-MM-dd'),
  );
}

const ACTIVE_STATUSES: Booking['status'][] = ['pending', 'confirmed', 'checked-in'];

// For a given listing, returns a Map<dateStr, count> of bookings active per night.
function buildOccupancyMap(listingId: string, bookings: Booking[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of bookings) {
    if (b.listingId !== listingId) continue;
    if (!ACTIVE_STATUSES.includes(b.status)) continue;
    for (const night of bookingNights(b)) {
      map.set(night, (map.get(night) ?? 0) + 1);
    }
  }
  return map;
}

// Returns the list of nights (yyyy-MM-dd) within [checkIn, checkOut)
// where occupancy + 1 would exceed the listing's roomCount.
export function getConflictNights(
  listing: Listing,
  bookings: Booking[],
  checkIn: string,
  checkOut: string,
): string[] {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (!isBefore(start, end)) return [];

  const occupancy = buildOccupancyMap(listing.id, bookings);
  const capacity = Math.max(1, listing.roomCount);
  const nights = eachDayOfInterval({ start, end: addDays(end, -1) }).map((d) =>
    format(d, 'yyyy-MM-dd'),
  );

  return nights.filter((n) => (occupancy.get(n) ?? 0) >= capacity);
}

// Returns the next N fully-booked nights from `from` onward, useful for hints.
export function getUpcomingFullyBookedNights(
  listing: Listing,
  bookings: Booking[],
  from: Date,
  lookaheadDays: number,
  limit: number,
): string[] {
  const occupancy = buildOccupancyMap(listing.id, bookings);
  const capacity = Math.max(1, listing.roomCount);
  const nights = eachDayOfInterval({ start: from, end: addDays(from, lookaheadDays - 1) }).map(
    (d) => format(d, 'yyyy-MM-dd'),
  );
  const blocked: string[] = [];
  for (const n of nights) {
    if ((occupancy.get(n) ?? 0) >= capacity) {
      blocked.push(n);
      if (blocked.length >= limit) break;
    }
  }
  return blocked;
}

export function formatNightShort(dateStr: string): string {
  const d = parseISO(dateStr);
  return format(d, 'EEE d MMM');
}
