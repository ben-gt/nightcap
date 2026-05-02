import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface DateSelectorProps {
  checkIn: string;
  checkOut: string;
  onChangeCheckIn: (date: string) => void;
  onChangeCheckOut: (date: string) => void;
  error?: string;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

type Preset = 'tonight' | 'tomorrow' | 'custom';

export default function DateSelector({
  checkIn,
  checkOut,
  onChangeCheckIn,
  onChangeCheckOut,
  error,
}: DateSelectorProps) {
  const today = toDateStr(new Date());
  const tomorrowDate = addDays(today, 1);

  const getActivePreset = (): Preset => {
    if (checkIn === today && checkOut === tomorrowDate) return 'tonight';
    if (checkIn === tomorrowDate && checkOut === addDays(tomorrowDate, 1)) return 'tomorrow';
    return 'custom';
  };

  const [showCustom, setShowCustom] = useState(getActivePreset() === 'custom');
  const activePreset = getActivePreset();

  function selectPreset(preset: Preset) {
    if (preset === 'tonight') {
      onChangeCheckIn(today);
      onChangeCheckOut(tomorrowDate);
      setShowCustom(false);
    } else if (preset === 'tomorrow') {
      onChangeCheckIn(tomorrowDate);
      onChangeCheckOut(addDays(tomorrowDate, 1));
      setShowCustom(false);
    } else {
      setShowCustom(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>When do you need a bed?</Text>

      <View style={styles.presets}>
        <Pressable
          style={[styles.preset, activePreset === 'tonight' && styles.presetActive]}
          onPress={() => selectPreset('tonight')}
        >
          <Text style={[styles.presetText, activePreset === 'tonight' && styles.presetTextActive]}>
            Tonight
          </Text>
          <Text style={[styles.presetSubtext, activePreset === 'tonight' && styles.presetSubtextActive]}>
            {formatDisplay(today)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.preset, activePreset === 'tomorrow' && styles.presetActive]}
          onPress={() => selectPreset('tomorrow')}
        >
          <Text style={[styles.presetText, activePreset === 'tomorrow' && styles.presetTextActive]}>
            Tomorrow
          </Text>
          <Text style={[styles.presetSubtext, activePreset === 'tomorrow' && styles.presetSubtextActive]}>
            {formatDisplay(tomorrowDate)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.preset, activePreset === 'custom' && styles.presetActive]}
          onPress={() => selectPreset('custom')}
        >
          <Text style={[styles.presetText, activePreset === 'custom' && styles.presetTextActive]}>
            Pick Dates
          </Text>
          <Text style={[styles.presetSubtext, activePreset === 'custom' && styles.presetSubtextActive]}>
            Custom
          </Text>
        </Pressable>
      </View>

      {showCustom && (
        <View style={styles.customRow}>
          <View style={styles.customField}>
            <Text style={styles.customLabel}>Check-in</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  onChangeCheckIn(e.target.value);
                  if (e.target.value >= checkOut) {
                    onChangeCheckOut(addDays(e.target.value, 1));
                  }
                }}
                style={inputStyle}
              />
            ) : (
              <Text style={styles.dateDisplay}>{formatDisplay(checkIn)}</Text>
            )}
          </View>
          <View style={styles.customArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.customField}>
            <Text style={styles.customLabel}>Check-out</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={checkOut}
                min={addDays(checkIn, 1)}
                onChange={(e) => onChangeCheckOut(e.target.value)}
                style={inputStyle}
              />
            ) : (
              <Text style={styles.dateDisplay}>{formatDisplay(checkOut)}</Text>
            )}
          </View>
        </View>
      )}

      {!showCustom && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {formatDisplay(checkIn)} → {formatDisplay(checkOut)} · 1 night
          </Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const inputStyle: React.CSSProperties = {
  background: Colors.bgElevatedHi,
  border: `1px solid ${Colors.border}`,
  borderRadius: '8px',
  padding: '8px 12px',
  color: Colors.textHi,
  fontSize: '14px',
  fontFamily: 'inherit',
  width: '100%',
  colorScheme: 'dark',
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textHi,
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.md,
  },
  presets: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  preset: {
    flex: 1,
    backgroundColor: Colors.bgElevatedHi,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  presetActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  presetText: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  presetTextActive: {
    color: Colors.accent,
  },
  presetSubtext: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginTop: 2,
  },
  presetSubtextActive: {
    color: Colors.accentHi,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customField: {
    flex: 1,
  },
  customLabel: {
    color: Colors.textMid,
    fontSize: FontSize.caption,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  customArrow: {
    paddingTop: Spacing.md,
  },
  arrowText: {
    color: Colors.textLo,
    fontSize: FontSize.lg,
  },
  dateDisplay: {
    color: Colors.textHi,
    fontSize: FontSize.body,
    backgroundColor: Colors.bgElevatedHi,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    overflow: 'hidden',
  },
  summaryRow: {
    backgroundColor: Colors.bgElevatedHi,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  summaryText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
  },
});
