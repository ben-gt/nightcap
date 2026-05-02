// Role management for the client.
//
// Source of truth, in priority order:
//   1. Auth0 custom claim (if a Post-Login Action sets it). This wins so a
//      backend can override local state.
//   2. localStorage `rr_role_assignments` map keyed by Auth0 `sub`.
//   3. Bootstrap rule: if no admins exist anywhere yet, the first user to
//      sign in is auto-promoted to admin.
//
// All role state is mirrored into localStorage so admins can manage it via
// the in-app UI even without a backend. When you add a backend / Auth0
// Action later, the custom-claim path takes over and the local store
// becomes a (slightly stale) cache.

import { Platform } from 'react-native';

export type Role = 'admin' | 'vendor';
export const ALL_ROLES: Role[] = ['admin', 'vendor'];

// Auth0 namespaced claim — must be a URL.
// Configure your Post-Login Action to set this to an array of role strings.
export const ROLES_CLAIM = 'https://api.roadsiderooms.com/roles';

const STORAGE_KEY = 'rr_role_assignments';
const KNOWN_USERS_KEY = 'rr_known_users';

export interface RoleAssignment {
  sub: string;       // Auth0 user id
  email: string;
  name: string;
  roles: Role[];
  updatedAt: string; // ISO
}

type AssignmentMap = Record<string, RoleAssignment>;

// ── Storage helpers (web + native) ────────────────────────────────────

function readJSON<T>(key: string, fallback: T): T {
  if (Platform.OS !== 'web') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────

/** Read full assignment map. */
export function getAssignments(): AssignmentMap {
  return readJSON<AssignmentMap>(STORAGE_KEY, {});
}

/** Write full assignment map. */
export function setAssignments(map: AssignmentMap): void {
  writeJSON(STORAGE_KEY, map);
}

/** Returns true if any user in localStorage has the admin role. */
export function hasAnyAdmin(): boolean {
  const map = getAssignments();
  return Object.values(map).some((a) => a.roles.includes('admin'));
}

/**
 * Resolve effective roles for a user. Custom claim wins if present.
 * If no admin exists anywhere yet, this user is bootstrapped as admin.
 */
export function resolveRoles(profile: {
  sub: string;
  email?: string;
  name?: string;
  claimRoles?: unknown;
}): Role[] {
  // 1. Custom claim from Auth0 wins
  const claimRoles = sanitiseRoles(profile.claimRoles);
  if (claimRoles.length > 0) {
    return claimRoles;
  }

  // 2. Local assignments
  const map = getAssignments();
  const existing = map[profile.sub];
  if (existing) return existing.roles;

  // 3. Bootstrap: first user becomes admin
  if (!hasAnyAdmin()) {
    const seeded: Role[] = ['admin'];
    upsertAssignment({
      sub: profile.sub,
      email: profile.email ?? '',
      name: profile.name ?? '',
      roles: seeded,
    });
    return seeded;
  }

  // Default: no roles
  return [];
}

/** Record/refresh a user we've seen so admins can grant roles to them later. */
export function rememberUser(profile: {
  sub: string;
  email?: string;
  name?: string;
}): void {
  if (Platform.OS !== 'web') return;
  const known = readJSON<Record<string, { sub: string; email: string; name: string; lastSeen: string }>>(
    KNOWN_USERS_KEY,
    {},
  );
  known[profile.sub] = {
    sub: profile.sub,
    email: profile.email ?? '',
    name: profile.name ?? '',
    lastSeen: new Date().toISOString(),
  };
  writeJSON(KNOWN_USERS_KEY, known);
}

/** Return all users an admin can manage (assigned + known). */
export function listManagedUsers(): RoleAssignment[] {
  const map = getAssignments();
  const known = readJSON<Record<string, { sub: string; email: string; name: string; lastSeen: string }>>(
    KNOWN_USERS_KEY,
    {},
  );

  // Merge: ensure every known user appears even with empty roles
  const merged: AssignmentMap = { ...map };
  for (const k of Object.values(known)) {
    if (!merged[k.sub]) {
      merged[k.sub] = {
        sub: k.sub,
        email: k.email,
        name: k.name,
        roles: [],
        updatedAt: k.lastSeen,
      };
    }
  }

  return Object.values(merged).sort((a, b) =>
    (a.email || a.name || a.sub).localeCompare(b.email || b.name || b.sub),
  );
}

/** Create or update an assignment. */
export function upsertAssignment(input: {
  sub: string;
  email: string;
  name: string;
  roles: Role[];
}): RoleAssignment {
  const map = getAssignments();
  const next: RoleAssignment = {
    sub: input.sub,
    email: input.email,
    name: input.name,
    roles: dedupeRoles(input.roles),
    updatedAt: new Date().toISOString(),
  };
  map[input.sub] = next;
  setAssignments(map);
  return next;
}

/** Replace roles for a user. */
export function setUserRoles(sub: string, roles: Role[]): RoleAssignment | null {
  const map = getAssignments();
  const existing = map[sub];
  if (!existing) return null;
  existing.roles = dedupeRoles(roles);
  existing.updatedAt = new Date().toISOString();
  map[sub] = existing;
  setAssignments(map);
  return existing;
}

// ── Helpers ───────────────────────────────────────────────────────────

function sanitiseRoles(input: unknown): Role[] {
  if (!Array.isArray(input)) return [];
  const out: Role[] = [];
  for (const v of input) {
    if (typeof v === 'string' && (ALL_ROLES as string[]).includes(v)) {
      out.push(v as Role);
    }
  }
  return dedupeRoles(out);
}

function dedupeRoles(roles: Role[]): Role[] {
  return Array.from(new Set(roles));
}
