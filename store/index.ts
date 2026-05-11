import { create } from 'zustand';
import {
  Listing,
  Property,
  RoomType,
  Booking,
  BookingFormData,
  UserProfile,
} from '@/types';
import { mockProperties, mockBookings } from '@/data/mock-listings';

// ── Derive flat listings from properties (one per room type) ──

function deriveListings(properties: Property[]): Listing[] {
  const listings: Listing[] = [];
  for (const prop of properties) {
    for (const rt of prop.roomTypes) {
      const featureValues = rt.features.map((f) => f.value);
      // Merge property amenities + room feature values, deduplicated
      const merged = Array.from(new Set([...prop.amenities, ...featureValues]));

      listings.push({
        id: `${prop.id}-${rt.id}`,
        propertyId: prop.id,
        roomTypeId: rt.id,
        name: prop.name,
        roomTypeName: rt.name,
        description: rt.description || prop.description,
        address: prop.address,
        latitude: prop.latitude,
        longitude: prop.longitude,
        pricePerNight: rt.basePrice,
        currency: prop.currency,
        images: rt.images.length > 0 ? rt.images : prop.images,
        amenities: merged,
        features: rt.features,
        maxGuests: rt.maxGuests,
        beds: rt.beds,
        available: rt.available,
        checkInTime: prop.checkInTime,
        checkOutTime: prop.checkOutTime,
        rating: prop.rating,
        reviewCount: prop.reviewCount,
        type: prop.type,
        roomCount: rt.roomCount,
        accessCode: rt.accessCode,
      });
    }
  }
  return listings;
}

// ── Store ──

interface AppState {
  properties: Property[];
  listings: Listing[]; // derived from properties
  bookings: Booking[];
  selectedListing: Listing | null;
  userLocation: { latitude: number; longitude: number } | null;
  user: UserProfile | null;

  setUserLocation: (location: { latitude: number; longitude: number } | null) => void;
  setSelectedListing: (listing: Listing | null) => void;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addBooking: (formData: BookingFormData, listing: Listing) => Booking;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;

  // Property management (admin)
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Omit<Property, 'roomTypes'>>) => void;
  deleteProperty: (id: string) => void;

  // Room type management (admin)
  addRoomType: (propertyId: string, roomType: RoomType) => void;
  updateRoomType: (propertyId: string, roomTypeId: string, updates: Partial<RoomType>) => void;
  deleteRoomType: (propertyId: string, roomTypeId: string) => void;

  // Backward-compat shims used by existing admin pages
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
}

function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const useStore = create<AppState>((set, get) => {
  const initialProperties = mockProperties;
  const initialListings = deriveListings(initialProperties);

  return {
    properties: initialProperties,
    listings: initialListings,
    bookings: mockBookings,
    selectedListing: null,
    userLocation: null,
    user: null,

    setUserLocation: (location) => set({ userLocation: location }),
    setSelectedListing: (listing) => set({ selectedListing: listing }),
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
    updateUser: (updates) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

    addBooking: (formData, listing) => {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      const nights = Math.max(
        1,
        Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      );

      const booking: Booking = {
        id: `b${Date.now()}`,
        listingId: listing.id,
        propertyId: listing.propertyId,
        roomTypeId: listing.roomTypeId,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalPrice: listing.pricePerNight * nights,
        status: 'confirmed',
        accessCode: listing.accessCode?.trim() || generateAccessCode(),
        createdAt: new Date().toISOString(),
      };

      set((state) => ({ bookings: [...state.bookings, booking] }));
      return booking;
    },

    updateBookingStatus: (bookingId, status) =>
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
      })),

    // ── Property CRUD ──

    addProperty: (property) =>
      set((state) => {
        const properties = [...state.properties, property];
        return { properties, listings: deriveListings(properties) };
      }),

    updateProperty: (id, updates) =>
      set((state) => {
        const properties = state.properties.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        return { properties, listings: deriveListings(properties) };
      }),

    deleteProperty: (id) =>
      set((state) => {
        const properties = state.properties.filter((p) => p.id !== id);
        return { properties, listings: deriveListings(properties) };
      }),

    // ── Room type CRUD ──

    addRoomType: (propertyId, roomType) =>
      set((state) => {
        const properties = state.properties.map((p) =>
          p.id === propertyId ? { ...p, roomTypes: [...p.roomTypes, roomType] } : p
        );
        return { properties, listings: deriveListings(properties) };
      }),

    updateRoomType: (propertyId, roomTypeId, updates) =>
      set((state) => {
        const properties = state.properties.map((p) =>
          p.id === propertyId
            ? {
                ...p,
                roomTypes: p.roomTypes.map((rt) =>
                  rt.id === roomTypeId ? { ...rt, ...updates } : rt
                ),
              }
            : p
        );
        return { properties, listings: deriveListings(properties) };
      }),

    deleteRoomType: (propertyId, roomTypeId) =>
      set((state) => {
        const properties = state.properties.map((p) =>
          p.id === propertyId
            ? { ...p, roomTypes: p.roomTypes.filter((rt) => rt.id !== roomTypeId) }
            : p
        );
        return { properties, listings: deriveListings(properties) };
      }),

    // ── Backward-compat shims (used by existing pages until fully migrated) ──

    addListing: (_listing) => {
      // No-op: use addProperty + addRoomType instead
    },

    updateListing: (id, updates) => {
      // Parse composite id: propertyId-roomTypeId
      const parts = id.split('-');
      if (parts.length >= 2) {
        const propertyId = parts[0];
        const roomTypeId = parts.slice(1).join('-');
        const rtUpdates: Partial<RoomType> = {};
        if (updates.available !== undefined) rtUpdates.available = updates.available;
        if (Object.keys(rtUpdates).length > 0) {
          get().updateRoomType(propertyId, roomTypeId, rtUpdates);
        }
      }
    },

    deleteListing: (id) => {
      const parts = id.split('-');
      if (parts.length >= 2) {
        const propertyId = parts[0];
        const roomTypeId = parts.slice(1).join('-');
        get().deleteRoomType(propertyId, roomTypeId);
      }
    },
  };
});
