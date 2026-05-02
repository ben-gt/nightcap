import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  ALL_ROLES,
  listManagedUsers,
  setUserRoles,
  upsertAssignment,
  type Role,
  type RoleAssignment,
} from '@/lib/roles';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AdminUsersScreen() {
  const currentUser = useStore((s) => s.user);
  const { refreshRoles } = useAuth();
  const [users, setUsers] = useState<RoleAssignment[]>(() => listManagedUsers());

  // Add-user form state
  const [newSub, setNewSub] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const reload = useCallback(() => setUsers(listManagedUsers()), []);

  const confirm = useCallback((title: string, message: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) onYes();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: onYes },
      ]);
    }
  }, []);

  function toggleRole(target: RoleAssignment, role: Role, next: boolean) {
    // Guard: don't let an admin remove their own admin role if they're the
    // only remaining admin.
    if (
      role === 'admin' &&
      !next &&
      target.sub === currentUser?.id &&
      users.filter((u) => u.roles.includes('admin')).length <= 1
    ) {
      const msg = "You're the only admin. Promote someone else first before removing your own admin role.";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Cannot remove', msg);
      return;
    }

    const apply = () => {
      const updatedRoles = next
        ? Array.from(new Set([...target.roles, role]))
        : target.roles.filter((r) => r !== role);

      setUserRoles(target.sub, updatedRoles);
      reload();

      // If we just changed our own roles, refresh the auth context so the
      // UI updates (admin tab visibility, etc.)
      if (target.sub === currentUser?.id) {
        refreshRoles();
      }
    };

    if (role === 'admin' && !next) {
      confirm('Remove admin role?', `${target.email || target.sub} will lose admin access.`, apply);
    } else {
      apply();
    }
  }

  function addUserManually() {
    const sub = newSub.trim();
    const email = newEmail.trim();
    const name = newName.trim();
    if (!sub) {
      const msg = 'Auth0 user id (sub) is required. You can copy it from the Auth0 dashboard.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing user id', msg);
      return;
    }
    upsertAssignment({ sub, email, name, roles: [] });
    setNewSub('');
    setNewEmail('');
    setNewName('');
    reload();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Users & Roles</Text>
      <Text style={styles.intro}>
        Grant or revoke roles for users who have signed in. The first user to sign in is automatically promoted to admin.
        Roles are stored locally in this browser; for cross-device persistence, configure an Auth0 Post-Login Action (see FLY_DEPLOY.md).
      </Text>

      {users.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={28} color={Colors.textLo} />
          <Text style={styles.emptyText}>No users yet. Once someone signs in they'll show up here.</Text>
        </View>
      )}

      {users.map((u) => {
        const isSelf = u.sub === currentUser?.id;
        return (
          <View key={u.sub} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>
                  {u.name || u.email || 'Unnamed user'}
                  {isSelf && <Text style={styles.youTag}>  (you)</Text>}
                </Text>
                {u.email && <Text style={styles.userEmail}>{u.email}</Text>}
                <Text style={styles.userSub}>{u.sub}</Text>
              </View>
            </View>

            <View style={styles.rolesRow}>
              {ALL_ROLES.map((role) => {
                const enabled = u.roles.includes(role);
                return (
                  <Pressable
                    key={role}
                    onPress={() => toggleRole(u, role, !enabled)}
                    style={({ pressed }) => [
                      styles.roleChip,
                      enabled && styles.roleChipOn,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons
                      name={enabled ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={enabled ? Colors.bg : Colors.textMid}
                    />
                    <Text style={[styles.roleChipLabel, enabled && styles.roleChipLabelOn]}>
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {u.updatedAt && (
              <Text style={styles.updatedAt}>
                Updated {new Date(u.updatedAt).toLocaleString()}
              </Text>
            )}
          </View>
        );
      })}

      <Text style={[styles.heading, { marginTop: Spacing.xl }]}>Add a user manually</Text>
      <Text style={styles.intro}>
        Use this to pre-grant a role before someone signs in. Paste their Auth0 user id (e.g. <Text style={styles.mono}>auth0|abc123</Text>).
      </Text>
      <View style={styles.formCard}>
        <Input label="Auth0 user id (sub)" value={newSub} onChangeText={setNewSub} autoCapitalize="none" />
        <Input label="Email (optional)" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Name (optional)" value={newName} onChangeText={setNewName} autoCapitalize="words" />
        <Button title="Add user" onPress={addUserManually} style={{ marginTop: Spacing.sm }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  heading: {
    color: Colors.textHi,
    fontSize: FontSize.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  intro: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  userName: {
    color: Colors.textHi,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  youTag: {
    color: Colors.accent,
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
  userEmail: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    marginTop: 2,
  },
  userSub: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  roleChipOn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  roleChipLabel: {
    color: Colors.textMid,
    fontSize: FontSize.label,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  roleChipLabelOn: {
    color: Colors.bg,
  },
  updatedAt: {
    color: Colors.textLo,
    fontSize: FontSize.caption,
    marginTop: Spacing.sm,
  },
  formCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mono: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: Colors.textHi,
  },
});
