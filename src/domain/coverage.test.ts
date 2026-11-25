import { evaluateCoverage, PostRequirement, Worker } from './coverage';

const window = { start: '2026-11-25T06:00:00Z', end: '2026-11-25T14:00:00Z' };
const workers: Worker[] = ['a', 'b', 'c', 'd'].map(id => ({
  id, siteId: 'plant-1', skills: ['engine-maintenance'],
  grade: 'technician', eligibleGrades: ['technician'],
  available: true, credentialValid: true, busyWindows: [],
}));
const post: PostRequirement = {
  id: 'engine', name: 'Engine maintenance', siteId: 'plant-1',
  minimum: 3, critical: true, requiredSkills: ['engine-maintenance'],
  eligibleGrades: ['technician'], window,
};

describe('evaluateCoverage', () => {
  it('allows one absence from four when three qualified workers are required', () => {
    const result = evaluateCoverage({ workers, posts: [post], excludedWorkerIds: ['a'] });
    expect(result.feasible).toBe(true);
    expect(result.posts[0].assignedWorkerIds).toHaveLength(3);
  });

  it('reports a deficit when two people are absent', () => {
    const result = evaluateCoverage({ workers, posts: [post], excludedWorkerIds: ['a', 'b'] });
    expect(result.feasible).toBe(false);
    expect(result.posts[0].deficit).toBe(1);
    expect(result.excludedCandidates.find(item => item.workerId === 'a')?.reasons).toContain('excluded by proposed absence');
  });

  it('does not assign one multi-skilled worker to two simultaneous posts', () => {
    const only = workers.slice(0, 1);
    const posts = [
      { ...post, id: 'engine', minimum: 1 },
      { ...post, id: 'inspection', name: 'Inspection', minimum: 1, requiredSkills: ['engine-maintenance'] },
    ];
    const result = evaluateCoverage({ workers: only, posts });
    expect(result.feasible).toBe(false);
    expect(result.posts.reduce((sum, item) => sum + item.assignedWorkerIds.length, 0)).toBe(1);
  });

  it('excludes workers with invalid credentials or conflicting assignments', () => {
    const blocked = [{ ...workers[0], credentialValid: false, busyWindows: [window] }];
    const result = evaluateCoverage({ workers: blocked, posts: [{ ...post, minimum: 1 }] });
    expect(result.posts[0].deficit).toBe(1);
    expect(result.excludedCandidates[0].reasons).toContain('required credential invalid or expired');
    expect(result.excludedCandidates[0].reasons).toContain('already assigned in this time window');
  });

  it('rejects invalid windows', () => {
    expect(() => evaluateCoverage({ workers, posts: [{ ...post, window: { start: 'bad', end: 'bad' } }] })).toThrow();
  });
});
