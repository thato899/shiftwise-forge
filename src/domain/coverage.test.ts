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

  it('reassigns a flexible worker so a specialist can fill their only eligible post', () => {
    const flexible = { ...workers[0], id: 'flexible', skills: ['engine-maintenance', 'inspection'] };
    const specialist = { ...workers[1], id: 'specialist', skills: ['engine-maintenance'] };
    const posts = [
      { ...post, id: 'engine', minimum: 1 },
      { ...post, id: 'inspection', name: 'Inspection', minimum: 1, requiredSkills: ['inspection'] },
    ];
    const result = evaluateCoverage({ workers: [flexible, specialist], posts });
    expect(result.feasible).toBe(true);
    expect(result.posts.find(item => item.postId === 'engine')?.assignedWorkerIds).toEqual(['specialist']);
    expect(result.posts.find(item => item.postId === 'inspection')?.assignedWorkerIds).toEqual(['flexible']);
  });

  it('does not assign one multi-skilled worker to two overlapping posts', () => {
    const only = [{ ...workers[0], skills: ['engine-maintenance', 'inspection'] }];
    const posts = [
      { ...post, id: 'engine', minimum: 1 },
      { ...post, id: 'inspection', name: 'Inspection', minimum: 1, requiredSkills: ['inspection'] },
    ];
    const result = evaluateCoverage({ workers: only, posts });
    expect(result.feasible).toBe(false);
    expect(result.posts.reduce((sum, item) => sum + item.assignedWorkerIds.length, 0)).toBe(1);
  });

  it('allows one worker to cover qualified posts in non-overlapping windows', () => {
    const only = [{ ...workers[0], skills: ['engine-maintenance', 'inspection'] }];
    const later = { start: '2026-11-25T14:00:00Z', end: '2026-11-25T22:00:00Z' };
    const posts = [
      { ...post, id: 'engine', minimum: 1 },
      { ...post, id: 'inspection', name: 'Inspection', minimum: 1, requiredSkills: ['inspection'], window: later },
    ];
    const result = evaluateCoverage({ workers: only, posts });
    expect(result.feasible).toBe(true);
    expect(result.posts.every(item => item.assignedWorkerIds.length === 1)).toBe(true);
  });

  it('excludes workers with invalid credentials or conflicting assignments', () => {
    const blocked = [{ ...workers[0], credentialValid: false, busyWindows: [window] }];
    const result = evaluateCoverage({ workers: blocked, posts: [{ ...post, minimum: 1 }] });
    expect(result.posts[0].deficit).toBe(1);
    expect(result.excludedCandidates[0].reasons).toContain('required credential invalid or expired');
    expect(result.excludedCandidates[0].reasons).toContain('already assigned in this time window');
  });

  it('does not confuse post IDs where one is a prefix of another', () => {
    const posts = [
      { ...post, id: 'engine', minimum: 1 },
      { ...post, id: 'engine:inspection', name: 'Inspection', minimum: 1 },
    ];
    const result = evaluateCoverage({ workers, posts });
    expect(result.feasible).toBe(true);
    expect(result.posts.find(item => item.postId === 'engine')?.assignedWorkerIds).toHaveLength(1);
    expect(result.posts.find(item => item.postId === 'engine:inspection')?.assignedWorkerIds).toHaveLength(1);
  });

  it('rejects duplicate IDs and invalid windows', () => {
    expect(() => evaluateCoverage({ workers, posts: [{ ...post, window: { start: 'bad', end: 'bad' } }] })).toThrow();
    expect(() => evaluateCoverage({ workers: [workers[0], workers[0]], posts: [post] })).toThrow('unique');
  });
});
