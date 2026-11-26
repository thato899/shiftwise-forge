import { TimeWindow } from './coverage';

export type EmployeeRole = 'employee' | 'shift-manager' | 'hr-admin' | 'auditor';

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  timezone: string;
  active: boolean;
}
export interface SkillDefinition {
  id: string;
  name: string;
  /** Whether a valid credential is mandatory to count this skill for staffing. */
  credentialRequired: boolean;
}
export interface Credential {
  id: string;
  skillId: string;
  issuedAt: string;
  expiresAt: string | null;
  verifiedBy: string;
}
export interface EmployeeProfile {
  id: string;
  tenantId: string;
  siteIds: string[];
  grade: string;
  eligiblePostIds: string[];
  skillIds: string[];
  credentials: Credential[];
  role: EmployeeRole;
  active: boolean;
  /** Do not add salary or personal contact data to this domain profile. */
}
export interface Shift {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  window: TimeWindow;
  status: 'draft' | 'published' | 'complete';
  revision: number;
}
export interface PostPolicy {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  minimumStaff: number;
  critical: boolean;
  requiredSkillIds: string[];
  eligibleGrades: string[];
  maximumStaff: number | null;
  revision: number;
}
export interface WorkingTimePolicy {
  id: string;
  tenantId: string;
  siteId: string;
  minimumRestHours: number;
  maximumHoursInRollingPeriod: number;
  rollingPeriodDays: number;
  reviewedByHr: boolean;
  revision: number;
}
export interface Assignment {
  id: string;
  tenantId: string;
  employeeId: string;
  shiftId: string;
  postId: string;
  window: TimeWindow;
  status: 'proposed' | 'confirmed' | 'cancelled';
  revision: number;
}

export function validatePostPolicy(policy: PostPolicy): string[] {
  const errors: string[] = [];
  if (!policy.id.trim() || !policy.tenantId.trim() || !policy.siteId.trim()) errors.push('Post policy must have an id, tenant and site.');
  if (!policy.name.trim()) errors.push('Post name is required.');
  if (!Number.isInteger(policy.minimumStaff) || policy.minimumStaff < 0) errors.push('Minimum staffing must be a non-negative integer.');
  if (policy.maximumStaff !== null && (!Number.isInteger(policy.maximumStaff) || policy.maximumStaff < policy.minimumStaff)) {
    errors.push('Maximum staffing must be null or an integer greater than or equal to the minimum.');
  }
  if (policy.requiredSkillIds.length === 0) errors.push('At least one required skill must be configured; otherwise staff cannot be verified.');
  if (policy.eligibleGrades.length === 0) errors.push('At least one explicitly eligible grade is required.');
  if (!Number.isInteger(policy.revision) || policy.revision < 1) errors.push('Policy revision must be a positive integer.');
  return errors;
}

export function validateWorkingTimePolicy(policy: WorkingTimePolicy): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(policy.minimumRestHours) || policy.minimumRestHours < 0) errors.push('Minimum rest hours must be non-negative.');
  if (!Number.isFinite(policy.maximumHoursInRollingPeriod) || policy.maximumHoursInRollingPeriod <= 0) errors.push('Maximum hours must be positive.');
  if (!Number.isInteger(policy.rollingPeriodDays) || policy.rollingPeriodDays <= 0) errors.push('Rolling period must be a positive number of days.');
  if (!policy.reviewedByHr) errors.push('Working-time rules require HR review before overtime eligibility can be evaluated.');
  return errors;
}

export function credentialCovers(
  profile: EmployeeProfile,
  skillId: string,
  at: string,
): boolean {
  if (!profile.skillIds.includes(skillId)) return false;
  const timestamp = Date.parse(at);
  if (!Number.isFinite(timestamp)) return false;
  const matching = profile.credentials.filter(credential => credential.skillId === skillId);
  return matching.some(credential => {
    const issued = Date.parse(credential.issuedAt);
    const expires = credential.expiresAt === null ? Number.POSITIVE_INFINITY : Date.parse(credential.expiresAt);
    return Number.isFinite(issued) && Number.isFinite(expires) && issued <= timestamp && timestamp < expires;
  });
}
