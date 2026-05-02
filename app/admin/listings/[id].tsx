import { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/store';
import { PropertyType, RoomType, FeatureCategory } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  ROOM_TYPE_PRESETS,
  FEATURE_CATEGORIES,
  SUGGESTED_FEATURES,
  KNOWN_PROPERTY_AMENITIES,
} from '@/data/room-presets';

const CHECK_IN_OPTIONS = ['24/7', '14:00', '15:00', '16:00'];
const CHECK_OUT_OPTIONS = ['24/7', '10:00', '11:00', '12:00'];

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  motel: 'Motel',
  cabin: 'Cabin',
  pod: 'Pod',
  'rv-park': 'RV Park',
  lodge: 'Lodge',
  campground: 'Campground',
};

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const property = useStore((s) => s.properties.find((p) => p.id === id));
  const updateProperty = useStore((s) => s.updateProperty);
  const addRoomType = useStore((s) => s.addRoomType);
  const updateRoomType = useStore((s) => s.updateRoomType);
  const deleteRoomType = useStore((s) => s.deleteRoomType);
  const properties = useStore((s) => s.properties);

  const [name, setName] = useState(property?.name ?? '');
  const [description, setDescription] = useState(property?.description ?? '');
  const [address, setAddress] = useState(property?.address ?? '');
  const [latitude, setLatitude] = useState(property?.latitude.toString() ?? '');
  const [longitude, setLongitude] = useState(property?.longitude.toString() ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType>(property?.type ?? 'motel');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenities ?? []);
  const [customAmenity, setCustomAmenity] = useState('');
  const [checkInTime, setCheckInTime] = useState(property?.checkInTime ?? '24/7');
  const [checkOutTime, setCheckOutTime] = useState(property?.checkOutTime ?? '11:00');

  const [addressResults, setAddressResults] = useState<NominatimResult[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const addressDebounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [isNewRoom, setIsNewRoom] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showFeatureEditor, setShowFeatureEditor] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<FeatureCategory | null>(null);
  const [customFeatureValue, setCustomFeatureValue] = useState('');
  const [customFeatureCategory, setCustomFeatureCategory] = useState<FeatureCategory>('custom');

  if (!property) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Property not found.</Text>
      </View>
    );
  }

  const allAmenities = (() => {
    const fromProperties = properties.flatMap((p) => p.amenities);
    const combined = new Set([...KNOWN_PROPERTY_AMENITIES, ...fromProperties]);
    return Array.from(combined).sort();
  })();

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 4) { setAddressResults([]); setShowAddressResults(false); return; }
    setAddressLoading(true);
    try {
      const params = new URLSearchParams({ q: query, format: 'json', countrycodes: 'au', limit: '5', addressdetails: '1' });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': 'RoadsideRooms/1.0' } });
      const data: NominatimResult[] = await res.json();
      setAddressResults(data);
      setShowAddressResults(data.length > 0);
    } catch { setAddressResults([]); }
    finally { setAddressLoading(false); }
  }, []);

  const handleAddressChange = useCallback((text: string) => {
    setAddress(text);
    if (addressDebounce.current) clearTimeout(addressDebounce.current);
    addressDebounce.current = setTimeout(() => searchAddress(text), 400);
  }, [searchAddress]);

  const selectAddress = useCallback((result: NominatimResult) => {
    setAddress(result.display_name);
    setLatitude(parseFloat(result.lat).toFixed(4));
    setLongitude(parseFloat(result.lon).toFixed(4));
    setShowAddressResults(false);
    setAddressResults([]);
  }, []);

  const captureLocation = useCallback(async () => {
    setLocating(true); setLocationError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        } else { reject(new Error('Geolocation not available')); }
      });
      setLatitude(position.coords.latitude.toFixed(4));
      setLongitude(position.coords.longitude.toFixed(4));
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`, { headers: { 'User-Agent': 'RoadsideRooms/1.0' } });
        const data = await res.json();
        if (data.display_name) setAddress(data.display_name);
      } catch {}
    } catch { setLocationError('Could not get location. Check browser permissions.'); }
    finally { setLocating(false); }
  }, []);

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities((prev) => prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]);
  }, []);

  const addCustomAmenity = useCallback(() => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) setSelectedAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity('');
  }, [customAmenity, selectedAmenities]);

  function startAddRoom(presetKey: string) {
    const preset = ROOM_TYPE_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setEditingRoom({
      id: `rt${Date.now()}`, name: preset.name, description: preset.description,
      basePrice: preset.suggestedPrice, beds: preset.beds, maxGuests: preset.maxGuests,
      features: [...preset.features], roomCount: 1, images: [], available: true,
    });
    setIsNewRoom(true);
    setShowPresetPicker(false);
  }

  function saveEditingRoom() {
    if (!editingRoom || !property) return;
    if (isNewRoom) { addRoomType(property.id, editingRoom); }
    else { updateRoomType(property.id, editingRoom.id, editingRoom); }
    setEditingRoom(null); setIsNewRoom(false); setShowFeatureEditor(false);
  }

  function handleDeleteRoom(rtId: string, rtName: string) {
    if (!property) return;
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete room type "${rtName}"?`)) deleteRoomType(property.id, rtId);
    } else {
      Alert.alert('Delete Room Type', `Delete "${rtName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRoomType(property.id, rtId) },
      ]);
    }
  }

  function toggleFeature(category: FeatureCategory, value: string) {
    if (!editingRoom) return;
    const has = editingRoom.features.some((f) => f.category === category && f.value === value);
    setEditingRoom({
      ...editingRoom,
      features: has
        ? editingRoom.features.filter((f) => !(f.category === category && f.value === value))
        : [...editingRoom.features, { category, value }],
    });
  }

  function addCustomFeature() {
    if (!editingRoom || !customFeatureValue.trim()) return;
    const value = customFeatureValue.trim();
    if (!editingRoom.features.some((f) => f.category === customFeatureCategory && f.value === value)) {
      setEditingRoom({ ...editingRoom, features: [...editingRoom.features, { category: customFeatureCategory, value }] });
    }
    setCustomFeatureValue('');
  }

  function handleSaveProperty() {
    if (!property) return;
    updateProperty(id, {
      name, description, type: propertyType, address,
      latitude: parseFloat(latitude) || property.latitude,
      longitude: parseFloat(longitude) || property.longitude,
      amenities: selectedAmenities, checkInTime, checkOutTime,
    });
    router.back();
  }

  useEffect(() => {
    return () => { if (addressDebounce.current) clearTimeout(addressDebounce.current); };
  }, []);

  // ── Room type editor subview ──
  if (editingRoom) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{isNewRoom ? 'New' : 'Edit'} Room Type</Text>

        <Input label="Room Type Name" value={editingRoom.name}
          onChangeText={(v) => setEditingRoom({ ...editingRoom, name: v })} placeholder="e.g. Deluxe Room" />
        <Input label="Description" value={editingRoom.description}
          onChangeText={(v) => setEditingRoom({ ...editingRoom, description: v })} multiline numberOfLines={2} />
        <Input label="Beds" value={editingRoom.beds}
          onChangeText={(v) => setEditingRoom({ ...editingRoom, beds: v })} placeholder="e.g. 1 King + 2 Single" />

        <View style={styles.row}>
          <Input label="Price / Night ($)" value={editingRoom.basePrice.toString()}
            onChangeText={(v) => setEditingRoom({ ...editingRoom, basePrice: parseInt(v) || 0 })}
            keyboardType="numeric" containerStyle={styles.thirdInput} />
          <Input label="Max Guests" value={editingRoom.maxGuests.toString()}
            onChangeText={(v) => setEditingRoom({ ...editingRoom, maxGuests: parseInt(v) || 1 })}
            keyboardType="numeric" containerStyle={styles.thirdInput} />
          <Input label="Room Count" value={editingRoom.roomCount.toString()}
            onChangeText={(v) => setEditingRoom({ ...editingRoom, roomCount: parseInt(v) || 1 })}
            keyboardType="numeric" containerStyle={styles.thirdInput} />
        </View>

        <Input label="Layout Variant (optional)" value={editingRoom.layout || ''}
          onChangeText={(v) => setEditingRoom({ ...editingRoom, layout: v || undefined })} placeholder="e.g. Layout A, Garden View" />

        <Pressable style={styles.featureToggle} onPress={() => setShowFeatureEditor(!showFeatureEditor)}>
          <Text style={styles.sectionLabel}>Room Features ({editingRoom.features.length})</Text>
          <Text style={styles.toggleArrow}>{showFeatureEditor ? '\u25B2' : '\u25BC'}</Text>
        </Pressable>

        {editingRoom.features.length > 0 && !showFeatureEditor && (
          <View style={styles.chipRowCompact}>
            {editingRoom.features.map((f, i) => (
              <Pressable key={`${f.category}-${f.value}-${i}`} style={styles.featureChipActive}
                onPress={() => { setShowFeatureEditor(true); setExpandedCategory(f.category); }}>
                <Text style={styles.featureChipActiveText}>{f.value}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {showFeatureEditor && (
          <View style={styles.featureEditor}>
            {FEATURE_CATEGORIES.map((cat) => {
              const isExpanded = expandedCategory === cat.key;
              const selectedInCat = editingRoom.features.filter((f) => f.category === cat.key);
              const suggestions = SUGGESTED_FEATURES[cat.key];
              return (
                <View key={cat.key} style={styles.categoryBlock}>
                  <Pressable style={styles.categoryHeader} onPress={() => setExpandedCategory(isExpanded ? null : cat.key)}>
                    <Text style={styles.categoryLabel}>
                      {cat.icon} {cat.label}
                      {selectedInCat.length > 0 && <Text style={styles.categoryCount}> ({selectedInCat.length})</Text>}
                    </Text>
                    <Text style={styles.toggleArrow}>{isExpanded ? '\u25B2' : '\u25BC'}</Text>
                  </Pressable>
                  {isExpanded && (
                    <View style={styles.categoryContent}>
                      {suggestions.length > 0 && (
                        <View style={styles.chipRow}>
                          {suggestions.map((value) => {
                            const sel = editingRoom.features.some((f) => f.category === cat.key && f.value === value);
                            return (
                              <Pressable key={value} style={[styles.chip, sel && styles.chipActive]}
                                onPress={() => toggleFeature(cat.key, value)}>
                                <Text style={[styles.chipText, sel && styles.chipTextActive]}>{value}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}
                      {selectedInCat.filter((f) => !suggestions.includes(f.value)).map((f, i) => (
                        <View key={`c-${f.value}-${i}`} style={styles.customFeatureRow}>
                          <View style={[styles.chip, styles.chipActive]}>
                            <Text style={[styles.chipText, styles.chipTextActive]}>{f.value}</Text>
                          </View>
                          <Pressable onPress={() => toggleFeature(cat.key, f.value)}>
                            <Text style={styles.removeFeatureText}>{'\u2715'}</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={styles.customFeatureSection}>
              <Text style={styles.smallLabel}>Add custom feature</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryPickerRow}>
                  {FEATURE_CATEGORIES.map((cat) => (
                    <Pressable key={cat.key} style={[styles.chipSmall, customFeatureCategory === cat.key && styles.chipActive]}
                      onPress={() => setCustomFeatureCategory(cat.key)}>
                      <Text style={[styles.chipText, customFeatureCategory === cat.key && styles.chipTextActive]}>
                        {cat.icon} {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.customRow}>
                <Input label="" value={customFeatureValue} onChangeText={setCustomFeatureValue}
                  placeholder="Type anything..." containerStyle={styles.customInput} onSubmitEditing={addCustomFeature} />
                <Pressable style={[styles.addButton, !customFeatureValue.trim() && styles.addButtonDisabled]}
                  onPress={addCustomFeature} disabled={!customFeatureValue.trim()}>
                  <Text style={styles.addButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Available for Booking</Text>
          <Switch value={editingRoom.available}
            onValueChange={(v) => setEditingRoom({ ...editingRoom, available: v })}
            trackColor={{ false: Colors.border, true: Colors.accent }} thumbColor={Colors.white} />
        </View>

        <View style={styles.navRow}>
          <Pressable onPress={() => { setEditingRoom(null); setIsNewRoom(false); setShowFeatureEditor(false); }}>
            <Text style={styles.backText}>Cancel</Text>
          </Pressable>
          <Button title="Save Room Type" onPress={saveEditingRoom} size="lg" style={styles.navButton} />
        </View>
      </ScrollView>
    );
  }

  // ── Main property edit view ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Input label="Property Name" value={name} onChangeText={setName} />
      <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

      <View style={styles.addressSection}>
        <Input label="Address" value={address} onChangeText={handleAddressChange} placeholder="Start typing to search..." />
        {addressLoading && <ActivityIndicator size="small" color={Colors.accent} style={styles.addressSpinner} />}
        {showAddressResults && (
          <View style={styles.addressDropdown}>
            {addressResults.map((result, i) => (
              <Pressable key={`${result.lat}-${result.lon}-${i}`}
                style={({ pressed }) => [styles.addressOption, pressed && styles.addressOptionPressed]}
                onPress={() => selectAddress(result)}>
                <Text style={styles.addressOptionText} numberOfLines={2}>{result.display_name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Input label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" containerStyle={styles.halfInput} />
        <Input label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" containerStyle={styles.halfInput} />
      </View>

      <Pressable style={({ pressed }) => [styles.locationButton, pressed && styles.locationButtonPressed]}
        onPress={captureLocation} disabled={locating}>
        {locating ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={styles.locationButtonText}>Use My Location</Text>}
      </Pressable>
      {locationError ? <Text style={styles.fieldError}>{locationError}</Text> : null}

      <Text style={styles.sectionLabel}>Property Type</Text>
      <View style={styles.chipRow}>
        {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
          <Pressable key={t} style={[styles.chip, propertyType === t && styles.chipActive]} onPress={() => setPropertyType(t)}>
            <Text style={[styles.chipText, propertyType === t && styles.chipTextActive]}>{PROPERTY_TYPE_LABELS[t]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.sectionLabel}>Check-in</Text>
          <View style={styles.chipRow}>
            {CHECK_IN_OPTIONS.map((t) => (
              <Pressable key={t} style={[styles.chipSmall, checkInTime === t && styles.chipActive]} onPress={() => setCheckInTime(t)}>
                <Text style={[styles.chipText, checkInTime === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.sectionLabel}>Check-out</Text>
          <View style={styles.chipRow}>
            {CHECK_OUT_OPTIONS.map((t) => (
              <Pressable key={t} style={[styles.chipSmall, checkOutTime === t && styles.chipActive]} onPress={() => setCheckOutTime(t)}>
                <Text style={[styles.chipText, checkOutTime === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Property Amenities</Text>
      <View style={styles.chipRow}>
        {allAmenities.map((amenity) => (
          <Pressable key={amenity} style={[styles.chip, selectedAmenities.includes(amenity) && styles.chipActive]}
            onPress={() => toggleAmenity(amenity)}>
            <Text style={[styles.chipText, selectedAmenities.includes(amenity) && styles.chipTextActive]}>{amenity}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.customRow}>
        <Input label="" value={customAmenity} onChangeText={setCustomAmenity} placeholder="Add custom amenity..."
          containerStyle={styles.customInput} onSubmitEditing={addCustomAmenity} />
        <Pressable style={[styles.addButton, !customAmenity.trim() && styles.addButtonDisabled]}
          onPress={addCustomAmenity} disabled={!customAmenity.trim()}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Room Types</Text>
      {property.roomTypes.map((rt) => (
        <View key={rt.id} style={styles.roomCard}>
          <View style={styles.roomCardHeader}>
            <Text style={styles.roomCardName}>{rt.name}</Text>
            <Text style={styles.roomCardPrice}>${rt.basePrice}/night</Text>
          </View>
          <Text style={styles.roomCardMeta}>
            {rt.beds} {'\u00B7'} {rt.maxGuests} guests {'\u00B7'} {rt.roomCount} room{rt.roomCount !== 1 ? 's' : ''}
            {rt.layout ? ` \u00B7 ${rt.layout}` : ''}
          </Text>
          {rt.features.length > 0 && (
            <View style={styles.chipRowCompact}>
              {rt.features.map((f, i) => (
                <View key={`${f.category}-${f.value}-${i}`} style={styles.featureChipSmall}>
                  <Text style={styles.featureChipText}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.roomCardActions}>
            <Pressable onPress={() => { setEditingRoom({ ...rt }); setIsNewRoom(false); }}>
              <Text style={styles.actionEdit}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => handleDeleteRoom(rt.id, rt.name)}>
              <Text style={styles.actionDelete}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {showPresetPicker ? (
        <View style={styles.presetPicker}>
          <Text style={styles.presetTitle}>Choose a starting point</Text>
          {ROOM_TYPE_PRESETS.map((preset) => (
            <Pressable key={preset.key} style={styles.presetOption} onPress={() => startAddRoom(preset.key)}>
              <View style={styles.presetOptionHeader}>
                <Text style={styles.presetOptionName}>{preset.name}</Text>
                {preset.suggestedPrice > 0 && <Text style={styles.presetOptionPrice}>~${preset.suggestedPrice}</Text>}
              </View>
              {preset.description ? <Text style={styles.presetOptionDesc}>{preset.description}</Text> : null}
            </Pressable>
          ))}
          <Pressable onPress={() => setShowPresetPicker(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Button title="+ Add Room Type" onPress={() => setShowPresetPicker(true)} variant="outline" style={styles.addRoomButton} />
      )}

      <Button title="Save Changes" onPress={handleSaveProperty} size="lg" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xxl },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfInput: { flex: 1 },
  thirdInput: { flex: 1 },
  sectionLabel: { color: Colors.textMid, fontSize: FontSize.label, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.xs },
  sectionTitle: { color: Colors.textHi, fontSize: FontSize.h1, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.lg },
  smallLabel: { color: Colors.textLo, fontSize: FontSize.caption, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.sm },
  fieldError: { color: Colors.danger, fontSize: FontSize.caption, marginTop: -Spacing.md, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  chipRowCompact: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  chip: { backgroundColor: Colors.bgElevatedHi, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
  chipSmall: { backgroundColor: Colors.bgElevatedHi, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textMid, fontSize: FontSize.sm, fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  featureChipSmall: { backgroundColor: Colors.bgElevatedHi, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  featureChipText: { color: Colors.textMid, fontSize: FontSize.xs },
  featureChipActive: { backgroundColor: Colors.accentMuted, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  featureChipActiveText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '600' },
  addressSection: { position: 'relative', zIndex: 10 },
  addressSpinner: { position: 'absolute', right: Spacing.md, top: 38 },
  addressDropdown: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, marginTop: -Spacing.sm, marginBottom: Spacing.md, overflow: 'hidden' },
  addressOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: Colors.border },
  addressOptionPressed: { backgroundColor: Colors.bgElevatedHi },
  addressOptionText: { color: Colors.textHi, fontSize: FontSize.sm },
  locationButton: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.accent, marginBottom: Spacing.lg, minWidth: 140, alignItems: 'center' },
  locationButtonPressed: { backgroundColor: Colors.accentMuted },
  locationButtonText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.md },
  customInput: { flex: 1, marginBottom: 0 },
  addButton: { backgroundColor: Colors.accent, width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { color: Colors.white, fontSize: FontSize.h1, fontWeight: '700', lineHeight: 26 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  switchLabel: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  roomCard: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  roomCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomCardName: { color: Colors.textHi, fontSize: FontSize.lg, fontWeight: '700' },
  roomCardPrice: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '700' },
  roomCardMeta: { color: Colors.textMid, fontSize: FontSize.sm, marginTop: Spacing.xs },
  roomCardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.lg, marginTop: Spacing.sm },
  actionEdit: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },
  actionDelete: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
  addRoomButton: { marginBottom: Spacing.lg },
  presetPicker: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  presetTitle: { color: Colors.textHi, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  presetOption: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  presetOptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  presetOptionName: { color: Colors.textHi, fontSize: FontSize.md, fontWeight: '600' },
  presetOptionPrice: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },
  presetOptionDesc: { color: Colors.textMid, fontSize: FontSize.sm, marginTop: Spacing.xxs },
  cancelText: { color: Colors.textLo, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.md },
  featureToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  toggleArrow: { color: Colors.textLo, fontSize: FontSize.sm },
  featureEditor: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  categoryBlock: { marginBottom: Spacing.sm },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryLabel: { color: Colors.textHi, fontSize: FontSize.md, fontWeight: '600' },
  categoryCount: { color: Colors.accent, fontWeight: '700' },
  categoryContent: { paddingTop: Spacing.sm },
  customFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  removeFeatureText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '700' },
  customFeatureSection: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.sm },
  categoryPickerRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.lg },
  navButton: { flex: 1, marginLeft: Spacing.md },
  backText: { color: Colors.textMid, fontSize: FontSize.md, fontWeight: '600', paddingVertical: Spacing.sm },
});
