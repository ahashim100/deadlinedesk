// California deadline rules (v1).
//
// IMPORTANT: These encode legal timeframes. They are a best-effort starting
// point and MUST be verified against the current statute before launch — see
// the `// TODO: verify against current CA statute` markers and RULES.md.

import type { StateRuleSet, DeadlineRule } from '../types';
import { addDays, subDays } from '../dates';

// ---------------------------------------------------------------------------
// Configurable legal constants (California)
// ---------------------------------------------------------------------------

/** Days after move-out by which the deposit (and itemization) must be returned. */
export const CA_DEPOSIT_RETURN_DAYS = 21; // TODO: verify against current CA statute (Civ. Code §1950.5)

/** Rent-increase written-notice requirements. */
export const CA_RENT_INCREASE = {
  // Threshold percentage that splits "small" vs "large" increases.
  thresholdPercent: 10, // TODO: verify against current CA statute (Civ. Code §827)
  // Required days of advance written notice.
  smallIncreaseNoticeDays: 30, // increase of <= thresholdPercent
  largeIncreaseNoticeDays: 90, // increase of >  thresholdPercent
};

/**
 * Helper the UI can use to recommend the correct notice window for a planned
 * increase percentage. Exposed so the same constants drive copy and logic.
 */
export function requiredRentIncreaseNoticeDays(increasePercent: number): number {
  return increasePercent > CA_RENT_INCREASE.thresholdPercent
    ? CA_RENT_INCREASE.largeIncreaseNoticeDays
    : CA_RENT_INCREASE.smallIncreaseNoticeDays;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const depositReturnRule: DeadlineRule = {
  type: 'deposit_return',
  label: 'Security deposit return',
  derive: (lease) => {
    if (!lease.move_out_date) return null;
    return {
      type: 'deposit_return',
      due_date: addDays(lease.move_out_date, CA_DEPOSIT_RETURN_DAYS),
      source: 'rule',
      basis: `${CA_DEPOSIT_RETURN_DAYS} days after move-out (CA Civ. Code §1950.5)`,
    };
  },
};

const leaseRenewalRule: DeadlineRule = {
  type: 'lease_renewal',
  label: 'Lease renewal',
  derive: (lease) => {
    if (!lease.lease_end) return null;
    return {
      type: 'lease_renewal',
      due_date: lease.lease_end,
      source: 'rule',
      basis: 'Lease end date — decide on renewal / non-renewal',
    };
  },
};

const rentIncreaseNoticeRule: DeadlineRule = {
  type: 'rent_increase_notice',
  label: 'Rent-increase notice',
  // The landlord opts in by setting `rent_increase_notice_days` (the notice
  // window they must give). Notice must be delivered that many days before the
  // increase takes effect; absent a separate target date, we anchor to
  // lease_end (the common renewal-time increase). The 30/90-day split is
  // configurable above.
  derive: (lease) => {
    if (lease.rent_increase_notice_days == null || !lease.lease_end) return null;
    return {
      type: 'rent_increase_notice',
      due_date: subDays(lease.lease_end, lease.rent_increase_notice_days),
      source: 'rule',
      basis:
        `Deliver written notice ${lease.rent_increase_notice_days} days before the ` +
        `increase takes effect (CA Civ. Code §827: ${CA_RENT_INCREASE.smallIncreaseNoticeDays}d ` +
        `for increases ≤${CA_RENT_INCREASE.thresholdPercent}%, ` +
        `${CA_RENT_INCREASE.largeIncreaseNoticeDays}d for larger)`,
    };
  },
};

const inspectionRule: DeadlineRule = {
  type: 'inspection',
  label: 'Inspection',
  derive: (lease) =>
    lease.inspection_date
      ? {
          type: 'inspection',
          due_date: lease.inspection_date,
          source: 'rule',
          basis: 'Scheduled inspection date',
        }
      : null,
};

const insuranceRenewalRule: DeadlineRule = {
  type: 'insurance_renewal',
  label: 'Insurance renewal',
  derive: (lease) =>
    lease.insurance_renewal_date
      ? {
          type: 'insurance_renewal',
          due_date: lease.insurance_renewal_date,
          source: 'rule',
          basis: 'Property insurance renewal date',
        }
      : null,
};

const licenseRenewalRule: DeadlineRule = {
  type: 'license_renewal',
  label: 'License / registration renewal',
  derive: (lease) =>
    lease.license_renewal_date
      ? {
          type: 'license_renewal',
          due_date: lease.license_renewal_date,
          source: 'rule',
          basis: 'Rental license / registration renewal date',
        }
      : null,
};

export const CA_RULES: StateRuleSet = {
  state: 'CA',
  label: 'California',
  rules: [
    depositReturnRule,
    leaseRenewalRule,
    rentIncreaseNoticeRule,
    inspectionRule,
    insuranceRenewalRule,
    licenseRenewalRule,
  ],
};
