import {
  ActorGrant,
  AuthorizationError,
  authorizeStaffingRequest,
  ForgeInvocationContext,
} from './authorization';

const context: ForgeInvocationContext = { accountId: 'synthetic-account-hr', cloudId: 'synthetic-tenant-a' };
const managerGrant: ActorGrant = {
  tenantId: 'synthetic-tenant-a', accountId: 'synthetic-account-hr', role: 'shift-manager',
  siteIds: ['plant-a'], active: true, revision: 3,
};
const request = {
  permission: 'decide-leave' as const,
  siteId: 'plant-a',
  resourceTenantId: 'synthetic-tenant-a',
};

function failureCode(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof AuthorizationError) return error.code;
    throw error;
  }
  throw new Error('Expected authorization to fail.');
}

describe('server-side tenant and site authorization', () => {
  it('derives the actor from Forge context and permits a granted manager site action', () => {
    expect(authorizeStaffingRequest(context, managerGrant, request)).toEqual({
      accountId: 'synthetic-account-hr', tenantId: 'synthetic-tenant-a', role: 'shift-manager',
      siteId: 'plant-a', permission: 'decide-leave', grantRevision: 3,
    });
  });

  it('fails closed when Forge identity is missing', () => {
    expect(failureCode(() => authorizeStaffingRequest({ accountId: 'synthetic-account-hr' }, managerGrant, request)))
      .toBe('missing-forge-identity');
    expect(failureCode(() => authorizeStaffingRequest({ cloudId: 'synthetic-tenant-a' }, managerGrant, request)))
      .toBe('missing-forge-identity');
  });

  it('does not accept a client-selected account, tenant, or role in place of Forge context', () => {
    expect(failureCode(() => authorizeStaffingRequest(
      { ...context, accountId: 'synthetic-attacker' }, managerGrant, request,
    ))).toBe('tenant-mismatch');
    expect(failureCode(() => authorizeStaffingRequest(
      { ...context, cloudId: 'synthetic-tenant-b' }, managerGrant, request,
    ))).toBe('tenant-mismatch');
    expect(failureCode(() => authorizeStaffingRequest(context, managerGrant, {
      ...request, resourceTenantId: 'synthetic-tenant-b',
    }))).toBe('tenant-mismatch');
  });

  it('limits a manager to the explicit sites in the server-side grant', () => {
    expect(failureCode(() => authorizeStaffingRequest(context, managerGrant, {
      ...request, siteId: 'plant-b',
    }))).toBe('site-not-authorized');
  });

  it('limits employees to their own profile and self-service operations', () => {
    const employeeGrant: ActorGrant = {
      ...managerGrant, role: 'employee', employeeId: 'employee-a',
    };
    expect(authorizeStaffingRequest(context, employeeGrant, {
      ...request, permission: 'request-leave', employeeId: 'employee-a',
    }).employeeId).toBe('employee-a');
    expect(failureCode(() => authorizeStaffingRequest(context, employeeGrant, {
      ...request, permission: 'read-own-profile', employeeId: 'employee-b',
    }))).toBe('employee-mismatch');
    expect(failureCode(() => authorizeStaffingRequest(context, employeeGrant, {
      ...request, permission: 'manage-staffing-policy',
    }))).toBe('permission-denied');
  });

  it('restricts HR policy changes and preserves redacted audit access for auditors', () => {
    const hrGrant: ActorGrant = { ...managerGrant, role: 'hr-admin' };
    expect(authorizeStaffingRequest(context, hrGrant, {
      ...request, permission: 'manage-staffing-policy',
    }).role).toBe('hr-admin');
    expect(failureCode(() => authorizeStaffingRequest(context, managerGrant, {
      ...request, permission: 'manage-staffing-policy',
    }))).toBe('permission-denied');
    const auditorGrant: ActorGrant = { ...managerGrant, role: 'auditor' };
    expect(authorizeStaffingRequest(context, auditorGrant, {
      ...request, permission: 'read-redacted-audit-history',
    }).permission).toBe('read-redacted-audit-history');
    expect(failureCode(() => authorizeStaffingRequest(context, auditorGrant, request)))
      .toBe('permission-denied');
  });

  it('rejects inactive, absent, or malformed grants', () => {
    expect(failureCode(() => authorizeStaffingRequest(context, null, request))).toBe('invalid-grant');
    expect(failureCode(() => authorizeStaffingRequest(context, { ...managerGrant, active: false }, request)))
      .toBe('inactive-grant');
    expect(failureCode(() => authorizeStaffingRequest(context, { ...managerGrant, siteIds: [] }, request)))
      .toBe('site-not-authorized');
    expect(failureCode(() => authorizeStaffingRequest(context, { ...managerGrant, siteIds: ['*'] }, request)))
      .toBe('invalid-grant');
    expect(failureCode(() => authorizeStaffingRequest(context, { ...managerGrant, revision: 0 }, request)))
      .toBe('invalid-grant');
  });
});
