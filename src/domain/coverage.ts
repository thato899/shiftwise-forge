export interface Worker {
  id: string;
  siteId: string;
  skills: string[];
  /** Only explicit, HR-configured grade eligibility is considered. */
  eligibleGrades: string[];
  grade: string;
  available: boolean;
  credentialValid: boolean;
  /** ISO timestamps for assigned work and required rest windows. */
  busyWindows: TimeWindow[];
}
export interface TimeWindow {
  start: string;
  end: string;
}
export interface PostRequirement {
  id: string;
  name: string;
  siteId: string;
  minimum: number;
  critical: boolean;
  requiredSkills: string[];
  eligibleGrades: string[];
  window: TimeWindow;
}
export interface CoverageInput {
  workers: Worker[];
  posts: PostRequirement[];
  excludedWorkerIds?: string[];
}
export interface PostResult {
  postId: string;
  name: string;
  minimum: number;
  assignedWorkerIds: string[];
  deficit: number;
  critical: boolean;
}
export interface CoverageResult {
  feasible: boolean;
  posts: PostResult[];
  excludedCandidates: Array<{ workerId: string; postId: string; reasons: string[] }>;
}

function toMillis(value: string): number {
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new Error(`Invalid timestamp: ${value}`);
  return result;
}
function overlaps(a: TimeWindow, b: TimeWindow): boolean {
  return toMillis(a.start) < toMillis(b.end) && toMillis(b.start) < toMillis(a.end);
}

function eligible(worker: Worker, post: PostRequirement): string[] {
  const reasons: string[] = [];
  if (worker.siteId !== post.siteId) reasons.push('different site');
  if (!worker.available) reasons.push('unavailable');
  if (!worker.credentialValid) reasons.push('required credential invalid or expired');
  if (!post.requiredSkills.every(skill => worker.skills.includes(skill))) reasons.push('missing required skill');
  if (!post.eligibleGrades.includes(worker.grade) || !worker.eligibleGrades.includes(worker.grade)) {
    reasons.push('grade not eligible under HR policy');
  }
  if (worker.busyWindows.some(window => overlaps(window, post.window))) reasons.push('already assigned in this time window');
  return reasons;
}

/**
 * Deterministic capacity-one bipartite matching. Each required slot is distinct;
 * each worker can cover one overlapping slot, including across different posts.
 */
export function evaluateCoverage(input: CoverageInput): CoverageResult {
  for (const post of input.posts) {
    if (!Number.isInteger(post.minimum) || post.minimum < 0) throw new Error(`Invalid minimum for ${post.id}`);
    toMillis(post.window.start);
    toMillis(post.window.end);
    if (toMillis(post.window.start) >= toMillis(post.window.end)) throw new Error(`Invalid window for ${post.id}`);
  }

  const posts = [...input.posts].sort((a, b) => {
    const eligibilityCount = (post: PostRequirement) =>
      input.workers.filter(worker => eligible(worker, post).length === 0 && !input.excludedWorkerIds?.includes(worker.id)).length;
    return eligibilityCount(a) - eligibilityCount(b) || a.id.localeCompare(b.id);
  });
  const slots = posts.flatMap(post => Array.from({ length: post.minimum }, (_, index) => ({ post, index })));
  const assigned = new Map<string, { post: PostRequirement; slotIndex: number }>();
  const excludedCandidates: CoverageResult['excludedCandidates'] = [];

  const candidatesFor = (post: PostRequirement): Worker[] => {
    const candidates = input.workers.filter(worker => {
      const reasons = eligible(worker, post);
      if (input.excludedWorkerIds?.includes(worker.id)) reasons.push('excluded by proposed absence');
      if (reasons.length) {
        excludedCandidates.push({ workerId: worker.id, postId: post.id, reasons });
        return false;
      }
      return true;
    });
    return candidates.sort((a, b) => a.id.localeCompare(b.id));
  };
  const candidateMap = new Map(posts.map(post => [post.id, candidatesFor(post)]));

  const canMoveWorker = (worker: Worker, visitedWorkers: Set<string>, visitedSlots: Set<string>): boolean => {
    if (visitedWorkers.has(worker.id)) return false;
    visitedWorkers.add(worker.id);
    for (const slot of slots) {
      const key = `${slot.post.id}:${slot.index}`;
      if (visitedSlots.has(key) || !overlaps(workerWindow(slot.post), slot.post.window)) continue;
      if (!candidateMap.get(slot.post.id)?.some(candidate => candidate.id === worker.id)) continue;
      visitedSlots.add(key);
      const current = [...assigned.entries()].find(([, value]) => value.post.id === slot.post.id && value.slotIndex === slot.index);
      if (!current || canMoveWorker(input.workers.find(item => item.id === current[0])!, visitedWorkers, visitedSlots)) {
        assigned.set(worker.id, slot);
        if (current) assigned.delete(current[0]);
        return true;
      }
    }
    return false;
  };

  for (const slot of slots) {
    const placed = candidateMap.get(slot.post.id)!.some(worker =>
      canMoveWorker(worker, new Set(), new Set())
    );
    if (!placed) continue;
  }

  const results = input.posts.map(post => {
    const assignedWorkerIds = [...assigned.entries()]
      .filter(([, slot]) => slot.post.id === post.id)
      .map(([workerId]) => workerId)
      .sort();
    return {
      postId: post.id,
      name: post.name,
      minimum: post.minimum,
      assignedWorkerIds,
      deficit: Math.max(0, post.minimum - assignedWorkerIds.length),
      critical: post.critical,
    };
  });
  return { feasible: results.every(post => post.deficit === 0), posts: results, excludedCandidates };
}

function workerWindow(post: PostRequirement): TimeWindow {
  return post.window;
}
