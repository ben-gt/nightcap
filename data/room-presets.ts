import { RoomTypePreset, FeatureCategory, RoomFeature } from '@/types';

// ── Feature category metadata ──

export const FEATURE_CATEGORIES: {
  key: FeatureCategory;
  label: string;
  icon: string;
}[] = [
  { key: 'bedding', label: 'Bedding', icon: '🛏' },
  { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { key: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { key: 'entertainment', label: 'Entertainment', icon: '📺' },
  { key: 'outdoor', label: 'Outdoor', icon: '🌿' },
  { key: 'comfort', label: 'Comfort', icon: '✨' },
  { key: 'connectivity', label: 'Connectivity', icon: '📶' },
  { key: 'accessibility', label: 'Accessibility', icon: '♿' },
  { key: 'custom', label: 'Other', icon: '⚙' },
];

// ── Suggested features per category (vendor sees these as quick-picks) ──

export const SUGGESTED_FEATURES: Record<FeatureCategory, string[]> = {
  bedding: [
    'King Bed',
    'Queen Bed',
    'Single Bed',
    'Double Bed',
    'Bunk Beds',
    'Sofa Bed',
    'Cot Available',
    'Extra Pillows',
    'Premium Linen',
  ],
  kitchen: [
    'Full Kitchen',
    'Kitchenette',
    'Microwave',
    'Mini Fridge',
    'Kettle',
    'Toaster',
    'Coffee Machine',
    'Cooktop',
    'Oven',
    'Dishwasher',
    'Cookware & Utensils',
  ],
  bathroom: [
    'Ensuite',
    'Shared Bathroom',
    'Hot Shower',
    'Bath',
    'Towels Provided',
    'Hairdryer',
    'Toiletries',
  ],
  entertainment: [
    'TV',
    'Smart TV',
    'Netflix',
    'Board Games',
    'Books',
    'Record Player',
    'Bluetooth Speaker',
  ],
  outdoor: [
    'Balcony',
    'Patio',
    'Garden Access',
    'BBQ',
    'Fire Pit',
    'Mountain Views',
    'River Views',
    'Bush Setting',
    'Outdoor Shower',
  ],
  comfort: [
    'AC',
    'Heating',
    'Ceiling Fan',
    'Fireplace',
    'Blackout Curtains',
    'Iron & Board',
    'Safe',
  ],
  connectivity: [
    'Wi-Fi',
    'USB Charging',
    'Power Outlets',
    'Desk & Chair',
    'Power Hookup',
  ],
  accessibility: [
    'Wheelchair Access',
    'Ground Floor',
    'Wide Doorways',
    'Grab Rails',
    'Roll-in Shower',
  ],
  custom: [],
};

// ── Known property-level amenities ──

export const KNOWN_PROPERTY_AMENITIES = [
  'Parking',
  'Truck Parking',
  'Pool',
  'Restaurant',
  'Laundry',
  'Reception',
  'Luggage Storage',
  'Pet Friendly',
  'EV Charging',
  'Water',
  'Dump Station',
  'Camp Kitchen',
  'Common Area',
  'Security',
  '24/7 Access',
];

// ── Room type presets ──

function f(category: FeatureCategory, value: string): RoomFeature {
  return { category, value };
}

export const ROOM_TYPE_PRESETS: RoomTypePreset[] = [
  {
    key: 'standard-room',
    name: 'Standard Room',
    description: 'Simple, clean room with the essentials.',
    beds: '1 Queen',
    maxGuests: 2,
    features: [
      f('bedding', 'Queen Bed'),
      f('bathroom', 'Ensuite'),
      f('connectivity', 'Wi-Fi'),
    ],
    suggestedPrice: 75,
  },
  {
    key: 'deluxe-room',
    name: 'Deluxe Room',
    description: 'Spacious room with extra comforts.',
    beds: '1 King + 1 Single',
    maxGuests: 3,
    features: [
      f('bedding', 'King Bed'),
      f('bedding', 'Single Bed'),
      f('bathroom', 'Ensuite'),
      f('comfort', 'AC'),
      f('entertainment', 'TV'),
      f('connectivity', 'Wi-Fi'),
    ],
    suggestedPrice: 110,
  },
  {
    key: 'twin-room',
    name: 'Twin Room',
    description: 'Two single beds — great for mates or colleagues.',
    beds: '2 Single',
    maxGuests: 2,
    features: [
      f('bedding', 'Single Bed'),
      f('bedding', 'Single Bed'),
      f('bathroom', 'Ensuite'),
      f('connectivity', 'Wi-Fi'),
    ],
    suggestedPrice: 70,
  },
  {
    key: 'family-room',
    name: 'Family Room',
    description: 'Room for the whole crew with flexible bedding.',
    beds: '1 Queen + 2 Single',
    maxGuests: 4,
    features: [
      f('bedding', 'Queen Bed'),
      f('bedding', 'Single Bed'),
      f('bedding', 'Single Bed'),
      f('bathroom', 'Ensuite'),
      f('comfort', 'AC'),
      f('connectivity', 'Wi-Fi'),
    ],
    suggestedPrice: 130,
  },
  {
    key: 'roadside-suite',
    name: 'Roadside Suite',
    description: 'Premium suite with kitchenette for longer stays.',
    beds: '1 King',
    maxGuests: 2,
    features: [
      f('bedding', 'King Bed'),
      f('bathroom', 'Ensuite'),
      f('kitchen', 'Kitchenette'),
      f('comfort', 'AC'),
      f('entertainment', 'Smart TV'),
      f('connectivity', 'Wi-Fi'),
      f('connectivity', 'Desk & Chair'),
    ],
    suggestedPrice: 150,
  },
  {
    key: 'roadside-suite-kitchen',
    name: 'Roadside Suite + Kitchen',
    description: 'Full suite with complete kitchen — cook your own meals.',
    beds: '1 King',
    maxGuests: 2,
    features: [
      f('bedding', 'King Bed'),
      f('bathroom', 'Ensuite'),
      f('kitchen', 'Full Kitchen'),
      f('comfort', 'AC'),
      f('entertainment', 'Smart TV'),
      f('connectivity', 'Wi-Fi'),
      f('connectivity', 'Desk & Chair'),
    ],
    suggestedPrice: 175,
  },
  {
    key: 'cabin',
    name: 'Cabin',
    description: 'Self-contained cabin in a bush or roadside setting.',
    beds: '1 Queen + Sofa Bed',
    maxGuests: 4,
    features: [
      f('bedding', 'Queen Bed'),
      f('bedding', 'Sofa Bed'),
      f('bathroom', 'Ensuite'),
      f('kitchen', 'Kitchenette'),
      f('outdoor', 'BBQ'),
      f('outdoor', 'Patio'),
      f('connectivity', 'Wi-Fi'),
    ],
    suggestedPrice: 120,
  },
  {
    key: 'sleep-pod',
    name: 'Sleep Pod',
    description: 'Compact pod for a quick rest — efficient and private.',
    beds: '1 Double',
    maxGuests: 1,
    features: [
      f('bedding', 'Double Bed'),
      f('connectivity', 'USB Charging'),
      f('connectivity', 'Wi-Fi'),
      f('comfort', 'AC'),
    ],
    suggestedPrice: 55,
  },
  {
    key: 'rv-site',
    name: 'RV / Powered Site',
    description: 'Level powered site with hookups for RVs and caravans.',
    beds: 'N/A',
    maxGuests: 4,
    features: [
      f('connectivity', 'Power Hookup'),
      f('connectivity', 'Wi-Fi'),
    ],
    suggestedPrice: 45,
  },
  {
    key: 'custom',
    name: 'Custom Room Type',
    description: '',
    beds: '',
    maxGuests: 2,
    features: [],
    suggestedPrice: 0,
  },
];
