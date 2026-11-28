import { findOvertimeCandidates, OvertimeCandidate, OvertimePolicy } from './overtime';

const opportunity = { start: '2026-11-28T14:00:00Z', end: '2026-11-28T22:00:00Z' };
const policy: OvertimePolicy = {
  minimumRestHours: 8,
  maximumHoursInRollingPeriod: 16,
  rollingPeriodHours: 24,
  reviewedByHr: true,
};
const candidate: OvertimeCandidate = {
  id: 'synthetic-prior-shift-worker',
  siteId: 'plant-a',
  skills: ['engine-maintenance'],
  eligibleGrades: ['technician'],
  grade: 'technician',
  available: true,
  credentialValid: true,
  busyWindows: [],
  workedWindows: [{ start: '2026-11-28T22:00:00Z', end: '2026-11-29T06:00:00Z' }],
};

function evaluate(
  worker: OvertimeCandidate = candidate,
  configuredPolicy: OvertimePolicy = policy,
) {
  return findOvertimeCandidates(
    [worker], 'plant-a', ['engine-maintenance'], ['technician'], opportunity, configuredPolicy,
  )[0];
}

describe('overtime eligibility', () => {
  it('allows a qualified prior-shift worker when HR-reviewed rest and hour limits permit', () => {
    const priorShift = {
      ...candidate,
      workedWindows: [{ start: '2026-11-27T22:00:00Z', end: '2026-11-28T06:00:00Z' }],
    };
    expect(evaluate(priorShift).eligible).toBe(true);
  });

  it('rejects prior- and following-shift work that would breach minimum rest', () => {
    const shortRestBefore = {
      ...candidate,
      workedWindows: [{ start: '2026-11-28T06:00:00Z', end: '2026-11-28T08:00:00Z' }],
    };
    expect(evaluate(shortRestBefore).reasons).toContain('minimum rest before overtime would be breached');

    const shortRestAfter = {
      ...candidate,
      workedWindows: [{ start: '2026-11-29T04:00:00Z', end: '2026-11-29T12:00:00Z' }],
    };
    expect(evaluate(shortRestAfter).reasons).toContain('minimum rest after overtime would be breached');
  });

  it('clips earlier work to the configured rolling window instead of overcounting it', () => {
    const partlyOutsideWindow = {
      ...candidate,
      workedWindows: [{ start: '2026-11-27T20:00:00Z', end: '2026-11-28T06:00:00Z' }],
    };
    expect(evaluate(partlyOutsideWindow).eligible).toBe(true);
  });

  it('rejects overlapping work and hour totals above the HR limit', () => {
    const overlappingWork = {
      ...candidate,
      workedWindows: [{ start: '2026-11-28T12:00:00Z', end: '2026-11-28T16:00:00Z' }],
    };
    expect(evaluate(overlappingWork).reasons).toContain('conflicting worked interval');

    const overLimit = {
      ...candidate,
      workedWindows: [
        { start: '2026-11-27T22:00:00Z', end: '2026-11-28T06:00:00Z' },
        { start: '2026-11-28T06:00:00Z', end: '2026-11-28T14:00:00Z' },
      ],
    };
    expect(evaluate(overLimit).reasons).toContain('maximum hours in rolling period would be exceeded');
  });

  it('fails closed when HR review or eligibility requirements are missing', () => {
    expect(evaluate(candidate, { ...policy, reviewedByHr: false }).reasons)
      .toContain('working-time policy requires HR review');
    expect(evaluate({
      ...candidate, siteId: 'plant-b', credentialValid: false, skills: [], grade: 'unapproved',
    }).reasons).toEqual(expect.arrayContaining([
      'different site',
      'required credential invalid or expired',
      'missing required skill',
      'grade not eligible under HR policy',
    ]));
  });
});
