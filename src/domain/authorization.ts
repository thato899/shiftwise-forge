import type { EmployeeRole } from './models';

/** Fields supplied by Forge's resolver runtime, never by resolver payload data. */
export interface ForgeInvocationContext {
  accountId?: unknown;
  cloudId?: unknown;
}

/** Server-side grant record. Load it by the trusted cloudId/accountId pair. */
export interface ActorGrant {
  tenantId: string;
  accountId: string;
  role: EmployeeRole;
  siteIds: string[];
  employeeId?: string;
  active: boolean;
  revision: number;
}

export type StaffingPermission =
  | 'read-own-profile'
  | 'request-leave'
  | 'respond-to-overtime'
  | 'read-site-roster'
  | 'manage-assignment'
  | 'decide-leave'
  | 'publish-overtime'
  | 'confirm-overtime-assignment'
  | 'manage-staffing-policy'
  | 'manage-employee-profile'
  | 'read-redacted-audit-history';

export interface AuthorizationRequest {
  permission: StaffingPermission;
  /** Site selector from the request; it grants no authority by itself. */
  siteId: string;
  /** Tenant ID from the server-loaded target record, never copied from payload. */
  resourceTenantId: string;
  /** Required for own-profile, leave-request and overtime-response operations. */
  employeeId?: string;
}

export interface AuthorizedActor {
  accountId: string;
  tenantId: string;
  role: EmployeeRole;
  siteId: string;
  permission: StaffingPermission;
  employeeId?: string;
  grantRevision: number;
}

export type AuthorizationFailureCode =
  | 'missing-forge-identity'
  | 'invalid-grant'
  | 'inactive-grant'
  | 'tenant-mismatch'
  | 'site-not-authorized'
  | 'permission-denied'
  | 'employee-mismatch';

export class AuthorizationError extends Error {
  constructor(readonly code: AuthorizationFailureCode) {
    super('Not authorized.');
    this.name = 'AuthorizationError';
  }
}

const ROLES: readonly EmployeeRole[] = ['employee', 'shift-manager', 'hr-admin', 'auditor'];

const PERMISSIONS_BY_ROLE: Record<EmployeeRole, readonly StaffingPermission[]> = {
  employee: ['read-own-profile', 'request-leave', 'respond-to-overtime'],
  'shift-manager': [
    'read-site-roster',
    'manage-assignment',
    'decide-leave',
    'publish-overtime',
    'confirm-overtime-assignment',
    'read-redacted-audit-history',
  ],
  'hr-admin': [
    'read-site-roster',
    'manage-staffing-policy',
    'manage-employee-profile',
    'read-redacted-audit-history',
  ],
  auditor: ['read-redacted-audit-history'],
};

const SELF_SERVICE_PERMISSIONS: readonly StaffingPermission[] = [
  'read-own-profile',
  'request-leave',
  'respond-to-overtime',
];

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Resolve identity from Forge's trusted invocation context; never from payload. */
export function resolveForgeIdentity(context: ForgeInvocationContext): { accountId: string; tenantId: string } {
  const accountId = nonEmptyString(context?.accountId);
  const tenantId = nonEmptyString(context?.cloudId);
  if (!accountId || !tenantId) throw new AuthorizationError('missing-forge-identity');
  return { accountId, tenantId };
}

/**
 * Check a server-loaded grant against trusted Forge identity and a record already
 * loaded inside that tenant. Callers must not build grants from client payloads.
 */
export function authorizeStaffingRequest(
  context: ForgeInvocationContext,
  grant: ActorGrant | null,
  request: AuthorizationRequest,
): AuthorizedActor {
  const identity = resolveForgeIdentity(context);
  if (!grant || !grant.active ||
      !nonEmptyString(grant.tenantId) || !nonEmptyString(grant.accountId) ||
      !ROLES.includes(grant.role) || !Array.isArray(grant.siteIds) ||
      !Number.isInteger(grant.revision) || grant.revision < 1 ||
      grant.siteIds.some(siteId => !nonEmptyString(siteId) || siteId.trim() === '*')) {
    throw new AuthorizationError(grant?.active === false ? 'inactive-grant' : 'invalid-grant');
  }

  if (grant.accountId !== identity.accountId || grant.tenantId !== identity.tenantId ||
      request.resourceTenantId !== identity.tenantId) {
    throw new AuthorizationError('tenant-mismatch');
  }

  const siteId = nonEmptyString(request.siteId);
  if (!siteId || siteId === '*' || !grant.siteIds.includes(siteId)) {
    throw new AuthorizationError('site-not-authorized');
  }
  const permissions = PERMISSIONS_BY_ROLE[grant.role];
  if (!permissions || !permissions.includes(request.permission)) {
    throw new AuthorizationError('permission-denied');
  }

  let employeeId: string | undefined;
  if (SELF_SERVICE_PERMISSIONS.includes(request.permission)) {
    employeeId = nonEmptyString(grant.employeeId) ?? undefined;
    if (grant.role !== 'employee' || !employeeId || request.employeeId !== employeeId) {
      throw new AuthorizationError('employee-mismatch');
    }
  }

  return {
    accountId: identity.accountId,
    tenantId: identity.tenantId,
    role: grant.role,
    siteId,
    permission: request.permission,
    ...(employeeId ? { employeeId } : {}),
    grantRevision: grant.revision,
  };
}
