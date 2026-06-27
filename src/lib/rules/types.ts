// Shared types for the deadline rules engine.

export type DeadlineType =
  | 'lease_renewal'
  | 'rent_increase_notice'
  | 'deposit_return'
  | 'inspection'
  | 'insurance_renewal'
  | 'license_renewal';

/**
 * The subset of lease fields the rules engine reads. Dates are ISO strings
 * (YYYY-MM-DD) as stored in Postgres `date` columns.
 */
export interface LeaseInput {
  lease_start: string | null;
  lease_end: string | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  move_out_date: string | null;
  rent_increase_notice_days: number | null;
  license_renewal_date: string | null;
  insurance_renewal_date: string | null;
  inspection_date: string | null;
}

/**
 * A deadline derived by the engine. `due_date` is the date the action is
 * legally/practically due. The daily reminder job fires lead-time reminders
 * counting back from this date.
 */
export interface DerivedDeadline {
  type: DeadlineType;
  due_date: string; // YYYY-MM-DD
  source: 'rule';
  /** Human-readable explanation shown in the UI / RULES.md. */
  basis: string;
}

/**
 * A single rule. `derive` returns zero or one deadline for the given lease.
 * Returning null means "this rule does not apply to this lease".
 */
export interface DeadlineRule {
  type: DeadlineType;
  label: string;
  derive: (lease: LeaseInput) => DerivedDeadline | null;
}

/**
 * Per-state configuration. Adding a new state = add one entry to the
 * STATE_RULES map in index.ts. No engine logic changes.
 */
export interface StateRuleSet {
  state: string; // two-letter code, e.g. 'CA'
  label: string;
  rules: DeadlineRule[];
}
