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

    const preceding = worker.workedWindows.filter(window => time(window.end) <= start);
    const following = worker.workedWindows.filter(window => time(window.start) >= end);
    if (preceding.some(window => gapHours(window, opportunity) < policy.minimumRestHours)) reasons.push('minimum rest before overtime would be breached');
    if (following.some(window => gapHours(opportunity, window) < policy.minimumRestHours)) reasons.push('minimum rest after overtime would be breached');
    const rollingStart = end - policy.rollingPeriodHours * 3_600_000;
    const alreadyWorked = worker.workedWindows
      .filter(window => time(window.end) > rollingStart && time(window.start) < end)
      .reduce((sum, window) => sum + durationHours(window), 0);
    if (alreadyWorked + durationHours(opportunity) > policy.maximumHoursInRollingPeriod) reasons.push('maximum hours in rolling period would be exceeded');

    return { workerId: worker.id, eligible: reasons.length === 0, reasons };
  });
}
