import { TimeWindow, Worker } from './coverage';

export interface OvertimePolicy {
  minimumRestHours: number;
  maximumHoursInRollingPeriod: number;
  rollingPeriodHours: number;
  reviewedByHr: boolean;
}
export interface OvertimeCandidate extends Worker {
  /** All worked/confirmed intervals inside the configured rolling period. */
  workedWindows: TimeWindow[];
}
export interface OvertimeEligibility {
  workerId: string;
  eligible: boolean;
  reasons: string[];
}
function time(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid timestamp: ${value}`);
  return parsed;
}
function overlap(a: TimeWindow, b: TimeWindow): boolean {
  return time(a.start) < time(b.end) && time(b.start) < time(a.end);
}
function durationHours(window: TimeWindow): number {
  return Math.max(0, time(window.end) - time(window.start)) / 3_600_000;
}
function gapHours(a: TimeWindow, b: TimeWindow): number {
  if (time(a.end) <= time(b.start)) return (time(b.start) - time(a.end)) / 3_600_000;
  if (time(b.end) <= time(a.start)) return (time(a.start) - time(b.end)) / 3_600_000;
  return 0;
}

/** Eligibility only: creating an offer never assigns a worker or approves leave. */
export function findOvertimeCandidates(
  candidates: OvertimeCandidate[],
  siteId: string,
  requiredSkills: string[],
  eligibleGrades: string[],
  opportunity: TimeWindow,
  policy: OvertimePolicy,
): OvertimeEligibility[] {
  const start = time(opportunity.start);
  const end = time(opportunity.end);
  if (start >= end) throw new Error('Overtime opportunity must have a positive duration.');
  return candidates.map(worker => {
    const reasons: string[] = [];
    if (!policy.reviewedByHr) reasons.push('working-time policy requires HR review');
    if (!Number.isFinite(policy.minimumRestHours) || policy.minimumRestHours < 0 ||
        !Number.isFinite(policy.maximumHoursInRollingPeriod) || policy.maximumHoursInRollingPeriod <= 0 ||
        !Number.isFinite(policy.rollingPeriodHours) || policy.rollingPeriodHours <= 0) {
      reasons.push('working-time policy is invalid');
    }
    if (worker.siteId !== siteId) reasons.push('different site');
    if (!worker.available) reasons.push('unavailable');
    if (!worker.credentialValid) reasons.push('required credential invalid or expired');
    if (!requiredSkills.every(skill => worker.skills.includes(skill))) reasons.push('missing required skill');
    if (!eligibleGrades.includes(worker.grade) || !worker.eligibleGrades.includes(worker.grade)) reasons.push('grade not eligible under HR policy');
    if (worker.busyWindows.some(window => overlap(window, opportunity))) reasons.push('conflicting assignment');

    if (worker.workedWindows.some(window => overlap(window, opportunity))) reasons.push('conflicting worked interval');
    const preceding = worker.workedWindows.filter(window => time(window.end) <= start);
    const following = worker.workedWindows.filter(window => time(window.start) >= end);
    if (preceding.some(window => gapHours(window, opportunity) < policy.minimumRestHours)) reasons.push('minimum rest before overtime would be breached');
    if (following.some(window => gapHours(opportunity, window) < policy.minimumRestHours)) reasons.push('minimum rest after overtime would be breached');
    const rollingStart = end - policy.rollingPeriodHours * 3_600_000;
    const alreadyWorked = worker.workedWindows
      .filter(window => time(window.end) > rollingStart && time(window.start) < end)
      .reduce((sum, window) => {
        const overlapStart = Math.max(time(window.start), rollingStart);
        const overlapEnd = Math.min(time(window.end), end);
        return sum + Math.max(0, overlapEnd - overlapStart) / 3_600_000;
      }, 0);
    if (alreadyWorked + durationHours(opportunity) > policy.maximumHoursInRollingPeriod) reasons.push('maximum hours in rolling period would be exceeded');

    return { workerId: worker.id, eligible: reasons.length === 0, reasons };
  });
}

export type OvertimeOfferStatus =
  | 'draft'
  | 'published'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'assigned';

export interface OvertimeOffer {
  id: string;
  tenantId: string;
  siteId: string;
  postId: string;
  shiftId: string;
  employeeId: string;
  window: TimeWindow;
  status: OvertimeOfferStatus;
  revision: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  decisionBy?: string;
  decisionAt?: string;
  assignmentId?: string;
}
export interface OvertimeAuditEvent {
  offerId: string;
  tenantId: string;
  actorId: string;
  action: 'published' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'assigned';
  at: string;
  revision: number;
  reason?: string;
}
export interface OvertimeTransition {
  offer: OvertimeOffer;
  event: OvertimeAuditEvent;
}

function requireRevision(offer: OvertimeOffer, expected: number): void {
  if (offer.revision !== expected) throw new Error('Offer changed; refresh before acting.');
}
function requireBeforeExpiry(offer: OvertimeOffer, now: string): void {
  if (time(now) >= time(offer.expiresAt)) throw new Error('Overtime offer has expired.');
}
function transition(
  offer: OvertimeOffer,
  actorId: string,
  now: string,
  action: OvertimeAuditEvent['action'],
  reason?: string,
  assignmentId?: string,
): OvertimeTransition {
  const revision = offer.revision + 1;
  const next: OvertimeOffer = {
    ...offer,
    status: action === 'published' ? 'published'
      : action === 'accepted' ? 'accepted'
      : action === 'declined' ? 'declined'
      : action === 'expired' ? 'expired'
      : action === 'cancelled' ? 'cancelled'
      : 'assigned',
    revision,
    decisionBy: actorId,
    decisionAt: now,
    ...(assignmentId ? { assignmentId } : {}),
  };
  return { offer: next, event: { offerId: offer.id, tenantId: offer.tenantId, actorId, action, at: now, revision, reason } };
}

/** Publish an invitation. Publication does not reserve a worker or alter coverage. */
export function publishOvertimeOffer(
  offer: OvertimeOffer,
  actorId: string,
  now: string,
  expectedRevision: number,
): OvertimeTransition {
  requireRevision(offer, expectedRevision);
  if (offer.status !== 'draft') throw new Error('Only a draft offer can be published.');
  if (!actorId.trim()) throw new Error('An authorized manager is required.');
  if (time(offer.expiresAt) <= time(now)) throw new Error('Offer expiry must be in the future.');
  return transition(offer, actorId, now, 'published');
}

/** Employee response is voluntary and never assigns the shift. */
export function respondToOvertimeOffer(
  offer: OvertimeOffer,
  employeeId: string,
  response: 'accept' | 'decline',
  now: string,
  expectedRevision: number,
): OvertimeTransition {
  requireRevision(offer, expectedRevision);
  if (offer.status !== 'published') throw new Error('Only a published offer can receive a response.');
  if (offer.employeeId !== employeeId) throw new Error('Only the invited employee can respond.');
  requireBeforeExpiry(offer, now);
  return transition(offer, employeeId, now, response === 'accept' ? 'accepted' : 'declined');
}

/** Manager confirmation is a separate, revision-checked act after the employee accepts. */
export function confirmOvertimeAssignment(
  offer: OvertimeOffer,
  managerId: string,
  assignmentId: string,
  now: string,
  expectedRevision: number,
): OvertimeTransition {
  requireRevision(offer, expectedRevision);
  if (offer.status !== 'accepted') throw new Error('Employee acceptance is required before assignment.');
  if (!managerId.trim()) throw new Error('An authorized manager is required.');
  if (!assignmentId.trim()) throw new Error('A confirmed assignment id is required.');
  return transition(offer, managerId, now, 'assigned', undefined, assignmentId);
}

export function cancelOvertimeOffer(
  offer: OvertimeOffer,
  managerId: string,
  reason: string,
  now: string,
  expectedRevision: number,
): OvertimeTransition {
  requireRevision(offer, expectedRevision);
  if (!['draft', 'published', 'accepted'].includes(offer.status)) throw new Error('This offer can no longer be cancelled.');
  if (!managerId.trim()) throw new Error('An authorized manager is required.');
  if (!reason.trim()) throw new Error('A cancellation reason is required.');
  return transition(offer, managerId, now, 'cancelled', reason);
}

export function expireOvertimeOffer(
  offer: OvertimeOffer,
  now: string,
  expectedRevision: number,
): OvertimeTransition {
  requireRevision(offer, expectedRevision);
  if (offer.status !== 'published') throw new Error('Only a published offer can expire.');
  if (time(now) < time(offer.expiresAt)) throw new Error('Offer expiry time has not been reached.');
  return transition(offer, 'system', now, 'expired');
}
