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

describe('leave decisions', () => {
  it('allows authorized manager approval when remaining staffing meets every minimum', () => {
    const preview = previewLeave(engineMaintenanceFixture, 'worker-a');
    const decision = decideLeave(request, preview, true, 1, 'approve', 'Coverage remains at minimum.');
    expect(decision.status).toBe('approved');
  });

  it('blocks approval if the proposed leave leaves a critical-post deficit', () => {
    const twoPersonMinimum = {
      ...engineMaintenanceFixture,
      posts: engineMaintenanceFixture.posts.map(post => ({ ...post, minimum: 4 })),
    };
    const preview = previewLeave(twoPersonMinimum, 'worker-a');
    expect(preview.feasible).toBe(false);
    expect(() => decideLeave(request, preview, true, 1, 'approve', 'Try anyway')).toThrow('below minimum');
  });

  it('requires manager authorization and current policy revision', () => {
    const preview = previewLeave(engineMaintenanceFixture, 'worker-a');
    expect(() => decideLeave(request, preview, false, 1, 'approve', 'No')).toThrow('authorization');
    expect(() => decideLeave(request, preview, true, 2, 'approve', 'Stale')).toThrow('Policy changed');
  });
});
