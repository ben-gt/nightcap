import { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { Listing } from '@/types';
import { useStore } from '@/store';

// Warm-tinted light tile layer — Voyager has soft sepia tones that pair well with the cream palette
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

/** CSS overrides for Leaflet controls to match dark theme */
const DARK_THEME_CSS = `
  .leaflet-control-zoom a {
    background-color: ${Colors.bgElevated} !important;
    color: ${Colors.textHi} !important;
    border-color: ${Colors.border} !important;
  }
  .leaflet-control-zoom a:hover {
    background-color: ${Colors.bgElevatedHi} !important;
  }
  .leaflet-control-zoom {
    border: 1px solid ${Colors.border} !important;
    border-radius: 8px !important;
    overflow: hidden;
  }
  .rr-marker {
    background: transparent !important;
    border: none !important;
  }
`;

interface MapProps {
  listings: Listing[];
  onMarkerPress: (listing: Listing) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

const GEOLOCATION_ZOOM = 9;
const FIT_PADDING: [number, number] = [60, 60];
const MAX_FIT_ZOOM = 11;
const CLUSTER_RADIUS_KM = 250; // grouping radius for the densest-cluster fallback

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the densest cluster of listings (greedy: pick the listing with most neighbours within radius). */
function findDensestCluster(listings: Listing[]): Listing[] {
  if (listings.length === 0) return [];
  let best: Listing[] = [listings[0]];
  for (const seed of listings) {
    const group = listings.filter(
      (l) => haversineKm(seed.latitude, seed.longitude, l.latitude, l.longitude) <= CLUSTER_RADIUS_KM
    );
    if (group.length > best.length) best = group;
  }
  return best;
}

/** Find the cluster of listings nearest to a given point (seed = closest listing, then group within radius). */
function findNearestCluster(listings: Listing[], lat: number, lon: number): Listing[] {
  if (listings.length === 0) return [];
  const seed = [...listings].sort(
    (a, b) =>
      haversineKm(lat, lon, a.latitude, a.longitude) -
      haversineKm(lat, lon, b.latitude, b.longitude)
  )[0];
  return listings.filter(
    (l) => haversineKm(seed.latitude, seed.longitude, l.latitude, l.longitude) <= CLUSTER_RADIUS_KM
  );
}

function createPriceIcon(L: any, price: number, available: boolean) {
  const bg = available ? Colors.bgElevated : Colors.bgElevated;
  const textColor = available ? Colors.accent : Colors.textLo;
  const borderColor = available
    ? 'rgba(245,238,220,0.6)'
    : 'rgba(245,238,220,0.25)';
  const opacity = available ? '1' : '0.7';

  return L.divIcon({
    className: 'rr-marker',
    html: `<div style="
      background: ${bg};
      color: ${textColor};
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      border: 1.5px solid ${borderColor};
      cursor: pointer;
      opacity: ${opacity};
      transition: transform 0.15s;
    ">$${price}</div>`,
    iconSize: [52, 24],
    iconAnchor: [26, 12],
  });
}

function createYouAreHereIcon(L: any) {
  return L.divIcon({
    className: 'rr-marker rr-you',
    html: `<div style="
      width: 16px; height: 16px;
      background: #C56B3E;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function injectDarkThemeCSS() {
  if (document.getElementById('rr-leaflet-dark-css')) return;
  const style = document.createElement('style');
  style.id = 'rr-leaflet-dark-css';
  style.textContent = DARK_THEME_CSS;
  document.head.appendChild(style);
}

export default function Map({
  listings,
  onMarkerPress,
  initialCenter = [-30.0, 135.0],
  initialZoom = 5,
}: MapProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const [leaflet, setLeaflet] = useState<any>(null);
  const setUserLocation = useStore((s) => s.setUserLocation);

  const recenter = useCallback(() => {
    if (!mapRef.current || !userLocationRef.current) return;
    const { latitude, longitude } = userLocationRef.current;
    mapRef.current.setView([latitude, longitude], GEOLOCATION_ZOOM, { animate: true });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const L = await import('leaflet');

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject dark theme overrides for Leaflet controls
      injectDarkThemeCSS();

      if (!mounted || !mapContainerRef.current) return;
      if (mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView(initialCenter, initialZoom);

      // Hide Leaflet's default 'Leaflet' prefix (also removes Ukrainian flag emoji)
      map.attributionControl.setPrefix(false);

      // Warm light tiles
      L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);

      // Zoom control — top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Geolocate — fit map to user + nearest listings; fall back to densest cluster if unavailable
      const fitToCluster = () => {
        if (!mounted) return;
        const cluster = findDensestCluster(listings);
        if (cluster.length === 0) return;
        if (cluster.length === 1) {
          map.setView([cluster[0].latitude, cluster[0].longitude], GEOLOCATION_ZOOM);
          return;
        }
        const bounds = L.latLngBounds(cluster.map((l) => [l.latitude, l.longitude]));
        map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM });
      };

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mounted) return;
            const { latitude, longitude } = pos.coords;
            setUserLocation({ latitude, longitude });
            userLocationRef.current = { latitude, longitude };

            // Show user pin
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: createYouAreHereIcon(L),
              interactive: false,
              zIndexOffset: 1000,
            }).addTo(map);

            // Fit bounds to user + the nearest cluster of listings so both are visible
            const nearestCluster = findNearestCluster(listings, latitude, longitude);
            if (nearestCluster.length > 0) {
              const points: [number, number][] = [
                [latitude, longitude],
                ...nearestCluster.map((l) => [l.latitude, l.longitude] as [number, number]),
              ];
              const bounds = L.latLngBounds(points);
              map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM });
            } else {
              map.setView([latitude, longitude], GEOLOCATION_ZOOM);
            }
          },
          () => fitToCluster(),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      } else {
        fitToCluster();
      }

      // Add listing markers
      listings.forEach((listing) => {
        const marker = L.marker([listing.latitude, listing.longitude], {
          icon: createPriceIcon(L, listing.pricePerNight, listing.available),
        }).addTo(map);
        if (listing.available) {
          marker.on('click', () => onMarkerPress(listing));
        }
        marker.bindTooltip(listing.name, { direction: 'top', offset: [0, -14] });
      });

      mapRef.current = map;
      setLeaflet(L);
    }

    init();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update listing markers without removing user location dot
  useEffect(() => {
    if (!mapRef.current || !leaflet) return;

    const map = mapRef.current;

    // Only remove listing markers (not the user location marker)
    map.eachLayer((layer: any) => {
      if (layer instanceof leaflet.Marker && layer !== userMarkerRef.current) {
        map.removeLayer(layer);
      }
    });

    listings.forEach((listing) => {
      const marker = leaflet
        .marker([listing.latitude, listing.longitude], {
          icon: createPriceIcon(leaflet, listing.pricePerNight, listing.available),
        })
        .addTo(map);
      if (listing.available) {
        marker.on('click', () => onMarkerPress(listing));
      }
      marker.bindTooltip(listing.name, { direction: 'top', offset: [0, -14] });
    });
  }, [listings, leaflet]);

  return (
    <View style={styles.container}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <Pressable
        style={({ pressed }) => [styles.recenterButton, pressed && styles.recenterPressed]}
        onPress={recenter}
        accessibilityLabel="Center map on my location"
        accessibilityRole="button"
      >
        <Text style={styles.recenterIcon}>◎</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  recenterButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterPressed: {
    backgroundColor: Colors.bgElevatedHi,
  },
  recenterIcon: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
});
