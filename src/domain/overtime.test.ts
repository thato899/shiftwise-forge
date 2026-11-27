import {
  cancelOvertimeOffer, confirmOvertimeAssignment, expireOvertimeOffer,
  OvertimeOffer, publishOvertimeOffer, respondToOvertimeOffer,
} from './overtime';

const draft: OvertimeOffer = {
  id: 'offer-a', tenantId: 'tenant-demo', siteId: 'plant-demo', postId: 'engine',
  shiftId: 'night-shift', employeeId: 'worker-a',
  window: { start: '2026-11-27T18:00:00Z', end: '2026-11-28T02:00:00Z' },
  status: 'draft', revision: 1, createdBy: 'manager-a',
  createdAt: '2026-11-27T10:00:00Z', expiresAt: '2026-11-27T16:00:00Z',
};
const now = '2026-11-27T11:00:00Z';

describe('voluntary overtime offer lifecycle', () => {
  it('requires publication, employee acceptance, then manager confirmation', () => {
    const published = publishOvertimeOffer(draft, 'manager-a', now, 1);
    expect(published.offer.status).toBe('published');
    expect(() => confirmOvertimeAssignment(published.offer, 'manager-a', 'assignment-a', now, 2)).toThrow('Employee acceptance');
    const accepted = respondToOvertimeOffer(published.offer, 'worker-a', 'accept', now, 2);
    expect(accepted.offer.status).toBe('accepted');
    expect(accepted.offer.assignmentId).toBeUndefined();
    const assigned = confirmOvertimeAssignment(accepted.offer, 'manager-a', 'assignment-a', now, 3);
    expect(assigned.offer.status).toBe('assigned');
    expect(assigned.offer.assignmentId).toBe('assignment-a');
    expect(assigned.event.action).toBe('assigned');
  });

  it('rejects responses by anyone except the invited employee', () => {
    const published = publishOvertimeOffer(draft, 'manager-a', now, 1);
    expect(() => respondToOvertimeOffer(published.offer, 'worker-b', 'accept', now, 2)).toThrow('invited employee');
  });

  it('prevents a stale competing response from consuming the offer twice', () => {
    const published = publishOvertimeOffer(draft, 'manager-a', now, 1);
    const accepted = respondToOvertimeOffer(published.offer, 'worker-a', 'accept', now, 2);
    expect(() => respondToOvertimeOffer(published.offer, 'worker-a', 'decline', now, 2)).toThrow('Offer changed');
    expect(() => confirmOvertimeAssignment(accepted.offer, 'manager-a', 'assignment-b', now, 2)).toThrow('Offer changed');
  });

  it('requires a reason for cancellation and tracks expiry', () => {
    const published = publishOvertimeOffer(draft, 'manager-a', now, 1);
    expect(() => cancelOvertimeOffer(published.offer, 'manager-a', '', now, 2)).toThrow('reason');
    const expired = expireOvertimeOffer(published.offer, '2026-11-27T17:00:00Z', 2);
    expect(expired.offer.status).toBe('expired');
  });

  it('records a decline without creating an assignment', () => {
    const published = publishOvertimeOffer(draft, 'manager-a', now, 1);
    const declined = respondToOvertimeOffer(published.offer, 'worker-a', 'decline', now, 2);
    expect(declined.offer.status).toBe('declined');
    expect(declined.offer.assignmentId).toBeUndefined();
  });
});
