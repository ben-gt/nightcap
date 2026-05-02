import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Listing } from '@/types';

interface MapPeekBarProps {
  listings: Listing[];
  onListingPress: (listing: Listing) => void;
}

const HANDLE_HEIGHT = 56; // height of the peek strip (handle + summary)
const HALF_HEIGHT = 280; // shows ~3 cards
const FULL_HEIGHT_FRACTION = 0.7; // 70% of viewport

type Snap = 'peek' | 'half' | 'full';

/**
 * A draggable bottom sheet that shows the listings currently visible in the map's
 * viewport. Three snap heights: peek (handle only), half (preview), full (list).
 */
export default function MapPeekBar({ listings, onListingPress }: MapPeekBarProps) {
  const { height: screenH } = useWindowDimensions();
  const fullHeight = Math.round(screenH * FULL_HEIGHT_FRACTION);

  const heightFor = (s: Snap) =>
    s === 'peek' ? HANDLE_HEIGHT : s === 'half' ? HALF_HEIGHT : fullHeight;

  const [snap, setSnap] = useState<Snap>('peek');
  const animH = useRef(new Animated.Value(HANDLE_HEIGHT)).current;
  const dragStartH = useRef(HANDLE_HEIGHT);

  // Animate to new snap when the user releases the drag or taps the handle.
  useEffect(() => {
    Animated.spring(animH, {
      toValue: heightFor(snap),
      useNativeDriver: false,
      friction: 9,
      tension: 90,
    }).start();
  }, [snap, fullHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        // @ts-ignore — _value is the current animated value
        dragStartH.current = (animH as any)._value ?? heightFor(snap);
        animH.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        // dy is positive when dragging down, so subtract.
        const next = Math.max(
          HANDLE_HEIGHT,
          Math.min(fullHeight, dragStartH.current - g.dy),
        );
        animH.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const released = dragStartH.current - g.dy;
        // Pick the closest snap point
        const points: Snap[] = ['peek', 'half', 'full'];
        let best: Snap = 'peek';
        let bestDist = Infinity;
        for (const p of points) {
          const d = Math.abs(released - heightFor(p));
          if (d < bestDist) {
            bestDist = d;
            best = p;
          }
        }
        // If the user clearly flicked, prefer direction
        if (g.vy < -0.6) best = released > HALF_HEIGHT - 30 ? 'full' : 'half';
        if (g.vy > 0.6) best = released < HALF_HEIGHT + 30 ? 'peek' : 'half';
        setSnap(best);
      },
    }),
  ).current;

  // Tap cycles through peek → half → full → peek. This is the primary interaction;
  // drag is a nice-to-have, but tap works reliably on every platform.
  const cycleSnap = () => {
    setSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek'));
  };

  const count = listings.length;
  const summary =
    count === 0
      ? 'No stays in this area — try panning or zooming out.'
      : `${count} stay${count === 1 ? '' : 's'} in view`;

  return (
    <Animated.View style={[styles.sheet, { height: animH }]}>
      {/* Drag handle + summary header */}
      <Pressable onPress={cycleSnap} style={styles.handleArea} {...panResponder.panHandlers}>
        <View style={styles.grabBar} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>{summary}</Text>
          <Text style={styles.summaryHint}>
            {snap === 'peek' ? 'Tap to expand' : snap === 'half' ? 'Tap for full list' : 'Tap to collapse'}
          </Text>
        </View>
      </Pressable>

      {/* Scrollable list — only meaningful when expanded */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={snap === 'full'}
      >
        {listings.map((listing) => (
          <Pressable
            key={listing.id}
            onPress={() => onListingPress(listing)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.thumbWrap}>
              {listing.images && listing.images[0] ? (
                <Image source={{ uri: listing.images[0] }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbFallbackText}>RR</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>
                {listing.name}
              </Text>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {listing.address}
              </Text>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardPrice}>${listing.pricePerNight}</Text>
                <Text style={styles.cardPriceUnit}> / night</Text>
                {typeof listing.rating === 'number' && (
                  <Text style={styles.cardRating}>★ {listing.rating.toFixed(1)}</Text>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.bgElevated,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderTopWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },
  handleArea: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'stretch',
  },
  grabBar: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    color: Colors.textHi,
    fontFamily: 'Fraunces-SemiBold',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  summaryHint: {
    color: Colors.textLo,
    fontSize: FontSize.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  thumbWrap: {
    width: 88,
    height: 88,
    backgroundColor: Colors.bgElevatedHi,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbFallbackText: {
    color: Colors.accent,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '700',
    fontSize: FontSize.lg,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  cardName: {
    color: Colors.textHi,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    fontSize: FontSize.md,
    marginBottom: 2,
  },
  cardAddress: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
    marginBottom: 6,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardPrice: {
    color: Colors.accent,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  cardPriceUnit: {
    color: Colors.textLo,
    fontSize: FontSize.xs,
    marginRight: Spacing.sm,
  },
  cardRating: {
    color: Colors.textMid,
    fontSize: FontSize.xs,
    marginLeft: 'auto',
  },
});
