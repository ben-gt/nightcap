import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { UserProfile } from '@/types';

type StatusVariant = 'success' | 'warning' | 'error' | 'muted';

const identityLabels: Record<UserProfile['identityStatus'], { label: string; variant: StatusVariant }> = {
  unverified: { label: 'Not Verified', variant: 'error' },
  pending: { label: 'Pending Review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
};

const paymentLabels: Record<UserProfile['paymentStatus'], { label: string; variant: StatusVariant }> = {
  none: { label: 'No Payment Method', variant: 'error' },
  pending: { label: 'Setup In Progress', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
};

const badgeColors: Record<StatusVariant, string> = {
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.danger,
  muted: Colors.textLo,
};

function StatusBadge({ label, variant }: { label: string; variant: StatusVariant }) {
  return (
    <View style={[styles.badge, { backgroundColor: Colors.accentMuted, borderColor: Colors.accentMuted }]}>
      <View style={[styles.badgeDot, { backgroundColor: badgeColors[variant] }]} />
      <Text style={[styles.badgeText, { color: badgeColors[variant] }]}>{label}</Text>
    </View>
  );
}

function NavRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.navRow,
        pressed && { backgroundColor: Colors.bgElevatedHi },
      ]}
      onPress={onPress}
    >
      <View style={styles.navRowLeft}>
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? Colors.danger : Colors.textMid}
        />
        <Text style={[styles.navRowLabel, danger && { color: Colors.danger }]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLo} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const user = useStore((s) => s.user);
  const updateUser = useStore((s) => s.updateUser);
  const bookings = useStore((s) => s.bookings);
  const { login, logout, isLoading, authError } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  // ── Signed-out state ──────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Ionicons name="moon" size={36} color={Colors.accent} />
        </View>

        <Text style={styles.signedOutTitle}>Roadside Rooms</Text>
        <Text style={styles.signedOutCopy}>
          Save favourites, manage bookings,{'\n'}unlock rooms.
        </Text>

        <Button
          title="Sign In"
          onPress={login}
          loading={isLoading}
          size="lg"
          style={{ marginTop: Spacing.xl, alignSelf: 'stretch' }}
        />

        {authError && (
          <Text style={styles.authError}>{authError}</Text>
        )}

        <Pressable
          onPress={login}
          disabled={isLoading}
          style={{ marginTop: Spacing.md }}
        >
          <Text style={styles.createAccountLink}>Create account</Text>
        </Pressable>
      </View>
    );
  }

  // ── Signed-in helpers ─────────────────────────────────────────────
  const identity = identityLabels[user.identityStatus];
  const payment = paymentLabels[user.paymentStatus];
  const userEmail = user.email.toLowerCase();
  const myBookingsCount = bookings.filter(
    (b) =>
      b.status !== 'cancelled' &&
      b.guestEmail.toLowerCase() === userEmail,
  ).length;

  function handleSave() {
    updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    setEditing(false);
  }

  function handleCancel() {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
    setEditing(false);
  }

  function confirmAction(title: string, message: string, onConfirm: () => void) {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${message}`)) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: onConfirm },
      ]);
    }
  }

  // ── Signed-in state ───────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        {!editing && (
          <>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.memberSince}>
              Member since{' '}
              {new Date(user.createdAt).toLocaleDateString('en-AU', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </>
        )}
      </View>

      {/* Account details */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          {!editing && (
            <Pressable onPress={() => setEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          )}
        </View>

        {editing ? (
          <View style={styles.card}>
            <Input label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <View style={styles.editActions}>
              <Button title="Cancel" variant="ghost" size="sm" onPress={handleCancel} />
              <Button title="Save" size="sm" onPress={handleSave} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <DetailRow icon="person-outline" label="Name" value={user.name} />
            <DetailRow icon="mail-outline" label="Email" value={user.email} />
            <DetailRow icon="call-outline" label="Phone" value={user.phone} />
          </View>
        )}
      </View>

      {/* Identity verification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity Verification</Text>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Ionicons name="shield-checkmark-outline" size={22} color={badgeColors[identity.variant]} />
              <Text style={styles.statusLabel}>ID Check</Text>
            </View>
            <StatusBadge label={identity.label} variant={identity.variant} />
          </View>
          {user.identityStatus === 'unverified' && (
            <Button
              title="Verify Identity"
              variant="outline"
              size="sm"
              onPress={() =>
                confirmAction('Verify Identity', 'This will start the identity verification process.', () =>
                  updateUser({ identityStatus: 'pending' }),
                )
              }
              style={{ marginTop: Spacing.md }}
            />
          )}
          {user.identityStatus === 'pending' && (
            <Text style={styles.hint}>
              Your documents are being reviewed. This usually takes 1-2 business days.
            </Text>
          )}
        </View>
      </View>

      {/* Payment method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Ionicons name="card-outline" size={22} color={badgeColors[payment.variant]} />
              <Text style={styles.statusLabel}>
                {user.paymentStatus === 'active' && user.paymentLast4
                  ? `Visa ending ${user.paymentLast4}`
                  : 'Payment Method'}
              </Text>
            </View>
            <StatusBadge label={payment.label} variant={payment.variant} />
          </View>
          {user.paymentStatus === 'none' && (
            <Button
              title="Add Payment Method"
              variant="outline"
              size="sm"
              onPress={() =>
                confirmAction('Add Payment', 'This will open the Airwallex payment setup.', () =>
                  updateUser({ paymentStatus: 'pending' }),
                )
              }
              style={{ marginTop: Spacing.md }}
            />
          )}
          {user.paymentStatus === 'active' && (
            <Pressable
              style={{ marginTop: Spacing.sm }}
              onPress={() =>
                confirmAction(
                  'Remove Card',
                  'Remove your payment method? You can add a new one later.',
                  () => updateUser({ paymentStatus: 'none', paymentLast4: undefined }),
                )
              }
            >
              <Text style={styles.dangerLink}>Remove card</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Activity stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myBookingsCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {user.identityStatus === 'verified' && user.paymentStatus === 'active'
                ? 'Ready'
                : 'Incomplete'}
            </Text>
            <Text style={styles.statLabel}>Account</Text>
          </View>
        </View>
      </View>

      {/* Admin shortcut (admin-only) */}
      {user.isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin</Text>
          <View style={styles.navCard}>
            <NavRow
              icon="shield-checkmark-outline"
              label="Admin dashboard"
              onPress={() => router.push('/admin')}
            />
            <View style={styles.navDivider} />
            <NavRow
              icon="people-outline"
              label="Users & roles"
              onPress={() => router.push('/admin/users')}
            />
          </View>
        </View>
      )}

      {/* Navigation rows */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.navCard}>
          <NavRow
            icon="card-outline"
            label="Payment methods"
            onPress={() =>
              confirmAction('Payment Methods', 'Payment management coming soon.', () => {})
            }
          />
          <View style={styles.navDivider} />
          <NavRow
            icon="heart-outline"
            label="Saved places"
            onPress={() =>
              confirmAction('Saved Places', 'Saved places coming soon.', () => {})
            }
          />
          <View style={styles.navDivider} />
          <NavRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() =>
              confirmAction('Notifications', 'Notification settings coming soon.', () => {})
            }
          />
          <View style={styles.navDivider} />
          <NavRow
            icon="help-circle-outline"
            label="Help"
            onPress={() =>
              confirmAction('Help', 'Help centre coming soon.', () => {})
            }
          />
          <View style={styles.navDivider} />
          <NavRow
            icon="document-text-outline"
            label="Terms"
            onPress={() =>
              confirmAction('Terms', 'Terms and conditions coming soon.', () => {})
            }
          />
          <View style={styles.navDivider} />
          <NavRow
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={() =>
              confirmAction('Sign Out', 'Are you sure you want to sign out?', logout)
            }
          />
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={18} color={Colors.textLo} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // ── Logo mark (signed-out) ──────────────────────────────────────
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  signedOutTitle: {
    color: Colors.textHi,
    fontSize: FontSize.h1,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
  },
  signedOutCopy: {
    color: Colors.textMid,
    fontSize: FontSize.body,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.sm,
  },
  createAccountLink: {
    color: Colors.accent,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  authError: {
    color: Colors.danger,
    fontSize: FontSize.label,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // ── Avatar header ───────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitials: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
  },
  userName: {
    color: Colors.textHi,
    fontSize: FontSize.xl,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
  },
  userEmail: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    marginTop: Spacing.xxs,
  },
  memberSince: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
  },

  // ── Sections ────────────────────────────────────────────────────
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textHi,
    fontSize: FontSize.h2,
    fontFamily: 'Fraunces-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  editLink: {
    color: Colors.accent,
    fontSize: FontSize.label,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  // ── Card ────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },

  // ── Detail rows ─────────────────────────────────────────────────
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  detailLabel: {
    color: Colors.textLo,
    fontSize: FontSize.label,
    width: 52,
  },
  detailValue: {
    color: Colors.textHi,
    fontSize: FontSize.body,
    flex: 1,
  },

  // ── Edit form ───────────────────────────────────────────────────
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },

  // ── Status ──────────────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusLabel: {
    color: Colors.textHi,
    fontSize: FontSize.body,
  },
  hint: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginTop: Spacing.sm,
  },

  // ── Badge ───────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },

  // ── Stats ───────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Nav rows ────────────────────────────────────────────────────
  navCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navRowLabel: {
    color: Colors.textHi,
    fontSize: FontSize.body,
  },
  navDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  // ── Danger ──────────────────────────────────────────────────────
  dangerLink: {
    color: Colors.danger,
    fontSize: FontSize.label,
  },
});
