import { AuthorizedActor } from './authorization';
import { decideLeave, LeaveRequest, previewLeave } from './leave';
import { engineMaintenanceFixture } from './coverage.fixtures';

const request: LeaveRequest = {
  id: 'request-1',
  employeeId: 'worker-a',
  start: '2026-11-25T06:00:00Z',
  end: '2026-11-25T14:00:00Z',
  status: 'pending',
  policyRevision: 1,
};
const manager: AuthorizedActor = {
  accountId: 'synthetic-manager',
  tenantId: 'synthetic-tenant',
  role: 'shift-manager',
  siteId: 'plant-1',
  permission: 'decide-leave',
  grantRevision: 2,
};

describe('leave decisions', () => {
  it('allows an authorized manager when the matching preview meets every minimum', () => {
    const preview = previewLeave(engineMaintenanceFixture, request, 1);
    const decision = decideLeave(request, preview, manager, 1, 'approve', 'Coverage remains at minimum.');
    expect(decision.status).toBe('approved');
    expect(decision.reason).toBe('Coverage remains at minimum.');
  });

  it('blocks approval if the proposed leave leaves a critical-post deficit', () => {
    const twoPersonMinimum = {
      ...engineMaintenanceFixture,
      posts: engineMaintenanceFixture.posts.map(post => ({ ...post, minimum: 4 })),
    };
    const preview = previewLeave(twoPersonMinimum, request, 1);
    expect(preview.feasible).toBe(false);
    expect(preview.explanation[0]).toContain('deficit 1');
    expect(() => decideLeave(request, preview, manager, 1, 'approve', 'Try anyway')).toThrow('below minimum');
  });

  it('requires a manager decision permission and rejects other authorized roles', () => {
    const preview = previewLeave(engineMaintenanceFixture, request, 1);
    expect(() => decideLeave(request, preview, {
      ...manager, role: 'hr-admin', permission: 'manage-staffing-policy',
    }, 1, 'approve', 'No')).toThrow('authorization');
    expect(() => decideLeave(request, preview, {
      ...manager, permission: 'read-site-roster',
    }, 1, 'approve', 'No')).toThrow('authorization');
  });

  it('rejects a preview for another employee, request, or time window', () => {
    const preview = previewLeave(engineMaintenanceFixture, request, 1);
    expect(() => decideLeave({ ...request, employeeId: 'worker-b' }, preview, manager, 1, 'approve', 'Mismatch'))
      .toThrow('does not match');
    expect(() => decideLeave({ ...request, id: 'request-2' }, preview, manager, 1, 'approve', 'Mismatch'))
      .toThrow('does not match');
    expect(() => decideLeave({ ...request, end: '2026-11-25T15:00:00Z' }, preview, manager, 1, 'approve', 'Mismatch'))
      .toThrow('does not match');
  });

  it('rejects stale request policy and stale preview revisions', () => {
    const preview = previewLeave(engineMaintenanceFixture, request, 1);
    expect(() => decideLeave(request, preview, manager, 2, 'approve', 'Stale')).toThrow('Policy or preview changed');
    const stalePreview = previewLeave(engineMaintenanceFixture, request, 2);
    expect(() => decideLeave(request, stalePreview, manager, 1, 'approve', 'Stale')).toThrow('Policy or preview changed');
  });

  it('only previews valid pending requests and known policy revisions', () => {
    expect(() => previewLeave(engineMaintenanceFixture, { ...request, status: 'approved' }, 1)).toThrow('pending');
    expect(() => previewLeave(engineMaintenanceFixture, { ...request, start: 'bad' }, 1)).toThrow('valid, increasing');
    expect(() => previewLeave(engineMaintenanceFixture, request, 0)).toThrow('policy revision');
  });

  it('requires a decision reason and prevents a second decision', () => {
    const preview = previewLeave(engineMaintenanceFixture, request, 1);
    expect(() => decideLeave(request, preview, manager, 1, 'decline', '   ')).toThrow('reason');
    const declined = decideLeave(request, preview, manager, 1, 'decline', 'Operational conflict');
    expect(declined.status).toBe('declined');
    expect(() => decideLeave(declined, preview, manager, 1, 'approve', 'Again')).toThrow('Only pending');
  });
});
