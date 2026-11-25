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
  feasible: boolean;
  coverage: CoverageResult;
  explanation: string[];
}
export function previewLeave(input: CoverageInput, employeeId: string): LeavePreview {
  if (!input.workers.some(worker => worker.id === employeeId)) {
    throw new Error('Leave requester is not present in the authorized roster.');
  }
  const coverage = evaluateCoverage({
    ...input,
    excludedWorkerIds: [...(input.excludedWorkerIds ?? []), employeeId],
  });
  return {
    feasible: coverage.feasible,
    coverage,
    explanation: coverage.posts
      .filter(post => post.deficit > 0)
      .map(post => `${post.name} requires ${post.minimum}; ${post.assignedWorkerIds.length} eligible and available after this leave; deficit ${post.deficit}.`),
  };
}

/** Pure policy decision only. Persistence, actor authorization and revision-checked writes belong to the service layer. */
export function decideLeave(
  request: LeaveRequest,
  preview: LeavePreview,
  actorAuthorized: boolean,
  currentPolicyRevision: number,
  decision: 'approve' | 'decline',
  reason: string,
): LeaveRequest {
  if (!actorAuthorized) throw new Error('Manager authorization required.');
  if (request.status !== 'pending') throw new Error('Only pending requests can be decided.');
  if (request.policyRevision !== currentPolicyRevision) throw new Error('Policy changed; refresh coverage preview before deciding.');
  if (decision === 'approve' && !preview.feasible) throw new Error('Cannot approve leave while required posts are below minimum.');
  if (!reason.trim()) throw new Error('A decision reason is required.');
  return { ...request, status: decision === 'approve' ? 'approved' : 'declined', reason };
}
