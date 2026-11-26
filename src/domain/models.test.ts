import { credentialCovers, EmployeeProfile, PostPolicy, validatePostPolicy, validateWorkingTimePolicy, WorkingTimePolicy } from './models';

const policy: PostPolicy = {
  id: 'engine', tenantId: 'tenant-a', siteId: 'plant-a', name: 'Engine maintenance',
  minimumStaff: 3, critical: true, requiredSkillIds: ['engine'], eligibleGrades: ['technician'],
  maximumStaff: 5, revision: 1,
};
const working: WorkingTimePolicy = {
  id: 'hours', tenantId: 'tenant-a', siteId: 'plant-a', minimumRestHours: 11,
  maximumHoursInRollingPeriod: 48, rollingPeriodDays: 7, reviewedByHr: true, revision: 1,
};
const profile: EmployeeProfile = {
  id: 'worker-a', tenantId: 'tenant-a', siteIds: ['plant-a'], grade: 'technician',
  eligiblePostIds: ['engine'], skillIds: ['engine'], role: 'employee', active: true,
  credentials: [{ id: 'cert-a', skillId: 'engine', issuedAt: '2026-01-01T00:00:00Z', expiresAt: '2027-01-01T00:00:00Z', verifiedBy: 'hr-a' }],
};

describe('staffing policy validation', () => {
  it('accepts explicit, bounded post rules', () => expect(validatePostPolicy(policy)).toEqual([]));
  it('rejects empty skills and grade eligibility', () => {
    expect(validatePostPolicy({ ...policy, requiredSkillIds: [], eligibleGrades: [] })).toHaveLength(2);
  });
  it('requires HR review before working-time rules are used', () => {
    expect(validateWorkingTimePolicy({ ...working, reviewedByHr: false })).toContain('Working-time rules require HR review before overtime eligibility can be evaluated.');
  });
  it('only accepts valid credentials at the time of the shift', () => {
    expect(credentialCovers(profile, 'engine', '2026-11-25T12:00:00Z')).toBe(true);
    expect(credentialCovers(profile, 'engine', '2027-01-01T00:00:00Z')).toBe(false);
    expect(credentialCovers(profile, 'welding', '2026-11-25T12:00:00Z')).toBe(false);
  });
});
