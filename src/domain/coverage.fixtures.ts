import { CoverageInput } from './coverage';

const shift = { start: '2026-11-25T06:00:00Z', end: '2026-11-25T14:00:00Z' };
export const engineMaintenanceFixture: CoverageInput = {
  workers: ['worker-a', 'worker-b', 'worker-c', 'worker-d'].map(id => ({
    id,
    siteId: 'synthetic-plant',
    skills: ['engine-maintenance'],
    eligibleGrades: ['technician'],
    grade: 'technician',
    available: true,
    credentialValid: true,
    busyWindows: [],
  })),
  posts: [{
    id: 'engine-maintenance',
    name: 'Engine maintenance',
    siteId: 'synthetic-plant',
    minimum: 3,
    critical: true,
    requiredSkills: ['engine-maintenance'],
    eligibleGrades: ['technician'],
    window: shift,
  }],
};
