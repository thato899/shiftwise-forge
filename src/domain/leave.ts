import type { AuthorizedActor } from './authorization';
import { CoverageInput, CoverageResult, evaluateCoverage } from './coverage';

export type LeaveStatus = 'pending' | 'approved' | 'declined' | 'needs-coverage';
export interface LeaveRequest {
  id: string;
  employeeId: string;
  start: string;
  end: string;
  status: LeaveStatus;
  reason?: string;
  policyRevision: number;
}
export interface LeavePreview {
  requestId: string;
  employeeId: string;
  start: string;
  end: string;
  policyRevision: number;
  feasible: boolean;
  coverage: CoverageResult;
  explanation: string[];
}

/** Build a preview tied to the exact request and HR policy revision being evaluated. */
export function previewLeave(
  input: CoverageInput,
  request: LeaveRequest,
  policyRevision: number,
): LeavePreview {
  if (request.status !== 'pending') throw new Error('Only pending requests can be previewed.');
  const start = Date.parse(request.start);
  const end = Date.parse(request.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw new Error('Leave request must have a valid, increasing time window.');
  }
  if (!Number.isInteger(policyRevision) || policyRevision < 1) {
    throw new Error('A valid HR policy revision is required for the preview.');
  }
  if (!input.workers.some(worker => worker.id === request.employeeId)) {
    throw new Error('Leave requester is not present in the authorized roster.');
  }
  const coverage = evaluateCoverage({
    ...input,
    excludedWorkerIds: [...(input.excludedWorkerIds ?? []), request.employeeId],
  });
  return {
    requestId: request.id,
    employeeId: request.employeeId,
    start: request.start,
    end: request.end,
    policyRevision,
    feasible: coverage.feasible,
    coverage,
    explanation: coverage.posts
      .filter(post => post.deficit > 0)
      .map(post => `${post.name} requires ${post.minimum}; ${post.assignedWorkerIds.length} eligible and available after this leave; deficit ${post.deficit}.`),
  };
}

/** Pure policy decision only; persistence, resolver authorization and atomic writes belong to the service layer. */
export function decideLeave(
  request: LeaveRequest,
  preview: LeavePreview,
  actor: AuthorizedActor,
  currentPolicyRevision: number,
  decision: 'approve' | 'decline',
  reason: string,
): LeaveRequest {
  if (actor.role !== 'shift-manager' || actor.permission !== 'decide-leave') {
    throw new Error('Manager leave-decision authorization required.');
  }
  if (request.status !== 'pending') throw new Error('Only pending requests can be decided.');
  if (preview.requestId !== request.id || preview.employeeId !== request.employeeId ||
      preview.start !== request.start || preview.end !== request.end) {
    throw new Error('Coverage preview does not match this leave request; refresh it before deciding.');
  }
  if (!Number.isInteger(currentPolicyRevision) || currentPolicyRevision < 1 ||
      request.policyRevision !== currentPolicyRevision || preview.policyRevision !== currentPolicyRevision) {
    throw new Error('Policy or preview changed; refresh coverage preview before deciding.');
  }
  if (decision === 'approve' && !preview.feasible) throw new Error('Cannot approve leave while required posts are below minimum.');
  if (!reason.trim()) throw new Error('A decision reason is required.');
  return { ...request, status: decision === 'approve' ? 'approved' : 'declined', reason: reason.trim() };
}
