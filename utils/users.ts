/**
 * Row model for the admin Users page.
 *
 * Dex users (`GET /users`) and Kubeflow Profiles with their quota
 * (`GET /quotas`) are independent lists; this merges them on email so the
 * page shows one row per person, whichever list they appear in.
 */

import type { QuotaStatus, UserListItem } from '~/types/api.types';

/** One table row: a user, their Profile (if any) and quota (if any). */
export interface UserRow {
  email: string;
  username: string;
  department: string | null;
  namespace: string | null;
  quota: QuotaStatus | null;
  /** The user has a Kubeflow Profile, so a quota can be set. */
  hasProfile: boolean;
  /** The email is a Dex account (not only a Profile owner). */
  hasAccount: boolean;
}

/** `GET /users` answers `{ passwords: [...] }`; fixtures may be a bare array. */
export type UsersPayload = { passwords?: UserListItem[] } | UserListItem[];

export const usersFromPayload = (payload: unknown): UserListItem[] => {
  if (Array.isArray(payload)) return payload as UserListItem[];
  const wrapped = (payload ?? {}) as { passwords?: UserListItem[] };
  return wrapped.passwords ?? [];
};

/** Merge Dex users and Profiles into rows, one per email, sorted by email. */
export const mergeUsersAndQuotas = (
  users: UserListItem[],
  quotas: QuotaStatus[],
): UserRow[] => {
  const byEmail = new Map<string, UserRow>();
  for (const user of users) {
    if (!user?.email) continue;
    byEmail.set(user.email, {
      email: user.email,
      username: user.username || user.email,
      department: user.department ?? null,
      namespace: null,
      quota: null,
      hasProfile: false,
      hasAccount: true,
    });
  }
  for (const quota of quotas) {
    const email = quota.user_id || quota.namespace;
    const row = byEmail.get(email) ?? {
      email,
      username: email,
      department: null,
      namespace: null,
      quota: null,
      hasProfile: false,
      hasAccount: false,
    };
    row.namespace = quota.namespace;
    row.quota = quota;
    row.hasProfile = true;
    byEmail.set(email, row);
  }
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
};

/** Rows whose email, username, department or namespace contain ``search``. */
export const filterRows = (rows: UserRow[], search: string): UserRow[] => {
  const needle = search.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    [row.email, row.username, row.department ?? '', row.namespace ?? '']
      .join(' ')
      .toLowerCase()
      .includes(needle),
  );
};
