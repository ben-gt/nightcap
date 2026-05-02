// ── Feature system (categorised, filterable, fully customisable) ──

export type FeatureCategory =
  | 'bedding'
  | 'kitchen'
  | 'bathroom'
  | 'entertainment'
  | 'outdoor'
  | 'accessibility'
  | 'comfort'
  | 'connectivity'
  | 'custom';

export interface RoomFeature {
  category: FeatureCategory;
  value: string;
}

// ── Property & Room hierarchy ──

export type PropertyType = 'cabin' | 'motel' | 'pod' | 'rv-park' | 'lodge' | 'campground';

export interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  beds: string; // e.g. "1 King", "2 Queen", "1 King + 2 Single"
  maxGuests: number;
  features: RoomFeature[];
  roomCount: number; // how many physical rooms of this type
  images: string[];
  layout?: string; // optional layout variant label
  available: boolean;
}

export interface Property {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  type: PropertyType;
  address: string;
  latitude: number;
  longitude: number;
  currency: string;
  images: string[];
  amenities: string[]; // property-level: Parking, Pool, Restaurant, etc.
  checkInTime: string;
  checkOutTime: string;
  rating: number;
  reviewCount: number;
  roomTypes: RoomType[];
}

// ── Room type presets (starting points, fully editable) ──

export interface RoomTypePreset {
  key: string;
  name: string;
  description: string;
  beds: string;
  maxGuests: number;
  features: RoomFeature[];
  suggestedPrice: number;
}

// ── Derived flat listing (backward compat for guest-facing UI) ──

export interface Listing {
  id: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  roomTypeName: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  currency: string;
  images: string[];
  amenities: string[]; // merged: property amenities + room feature values
  features: RoomFeature[]; // structured room features for filtering
  maxGuests: number;
  beds: string;
  available: boolean;
  checkInTime: string;
  checkOutTime: string;
  rating: number;
  reviewCount: number;
  type: PropertyType;
  roomCount: number;
}

// ── Booking ──

export interface Booking {
  id: string;
  listingId: string;
  propertyId?: string;
  roomTypeId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
  accessCode: string;
  createdAt: string;
}

export interface BookingFormData {
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  identityStatus: 'unverified' | 'pending' | 'verified';
  paymentStatus: 'none' | 'pending' | 'active';
  paymentLast4?: string;
  isVendor: boolean;
  createdAt: string;
}
