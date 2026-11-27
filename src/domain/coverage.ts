export interface Worker {
  id: string;
  siteId: string;
  skills: string[];
  /** Only explicit, HR-configured grade eligibility is considered. */
  eligibleGrades: string[];
  grade: string;
  available: boolean;
  credentialValid: boolean;
  /** Existing assigned work and required rest windows. */
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

const MAX_SEARCH_NODES = 100_000;

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
 * Finds the largest feasible set of assignments within a bounded search budget.
 * A worker can cover multiple non-overlapping slots, but never two overlapping
 * posts. Inputs exceeding the budget fail explicitly for manager review.
 */
export function evaluateCoverage(input: CoverageInput): CoverageResult {
  const workerIds = new Set<string>();
  for (const worker of input.workers) {
    if (!worker.id.trim() || workerIds.has(worker.id)) throw new Error('Worker IDs must be non-empty and unique.');
    workerIds.add(worker.id);
  }
  const postIds = new Set<string>();
  for (const post of input.posts) {
    if (!post.id.trim() || postIds.has(post.id)) throw new Error('Post IDs must be non-empty and unique.');
    postIds.add(post.id);
    if (!Number.isInteger(post.minimum) || post.minimum < 0) throw new Error(`Invalid minimum for ${post.id}`);
    const start = toMillis(post.window.start);
    const end = toMillis(post.window.end);
    if (start >= end) throw new Error(`Invalid window for ${post.id}`);
  }

  const excludedCandidates: CoverageResult['excludedCandidates'] = [];
  const candidatesFor = new Map<string, Worker[]>();
  for (const post of input.posts) {
    const eligibleWorkers: Worker[] = [];
    for (const worker of input.workers) {
      const reasons = eligible(worker, post);
      if (input.excludedWorkerIds?.includes(worker.id)) reasons.push('excluded by proposed absence');
      if (reasons.length) excludedCandidates.push({ workerId: worker.id, postId: post.id, reasons });
      else eligibleWorkers.push(worker);
    }
    candidatesFor.set(post.id, eligibleWorkers.sort((a, b) => a.id.localeCompare(b.id)));
  }

  const slots = input.posts.flatMap(post =>
    Array.from({ length: post.minimum }, (_, index) => ({ key: `${post.id}:${index}`, post }))
  ).sort((a, b) =>
    candidatesFor.get(a.post.id)!.length - candidatesFor.get(b.post.id)!.length ||
    Number(b.post.critical) - Number(a.post.critical) ||
    a.post.id.localeCompare(b.post.id) ||
    a.key.localeCompare(b.key)
  );

  const assigned = new Map<string, Worker>();
  let best = new Map<string, Worker>();
  let searchNodes = 0;
  let bestCount = 0;

  const search = (slotIndex: number): void => {
    searchNodes += 1;
    if (searchNodes > MAX_SEARCH_NODES) {
      throw new Error('Coverage search limit reached; manager review is required.');
    }
    if (assigned.size > bestCount) {
      best = new Map(assigned);
      bestCount = assigned.size;
      if (bestCount === slots.length) return;
    }
    if (slotIndex >= slots.length || assigned.size + slots.length - slotIndex <= bestCount) return;

    const slot = slots[slotIndex];
    const candidates = candidatesFor.get(slot.post.id)!;
    for (const worker of candidates) {
      const conflicts = [...assigned.entries()].filter(([, otherSlotWorker]) => otherSlotWorker.id === worker.id);
      const conflictsWithWindow = conflicts.some(([assignedKey]) => {
        const existingSlot = slots.find(item => item.key === assignedKey)!;
        return overlaps(existingSlot.post.window, slot.post.window);
      });
      if (conflictsWithWindow) continue;

      assigned.set(slot.key, worker);
      search(slotIndex + 1);
      assigned.delete(slot.key);
      if (bestCount === slots.length) return;
    }
    search(slotIndex + 1);
  };

  search(0);

  const results = input.posts.map(post => {
    const assignedWorkerIds = [...best.entries()]
      .filter(([key]) => key.startsWith(`${post.id}:`))
      .map(([, worker]) => worker.id)
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
