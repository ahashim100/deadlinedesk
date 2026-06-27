// Deadline rules engine.
//
// Pure, config-driven, NO AI. Given a lease and a state, it returns the set of
// deadlines that state's rules derive. Adding a state = add one entry to
// STATE_RULES below.

import type { DerivedDeadline, LeaseInput, StateRuleSet } from './types';
import { CA_RULES } from './states/ca';

export type { DerivedDeadline, LeaseInput, DeadlineType } from './types';

/**
 * Registry of supported states. v1 ships California only. To add a state,
 * create `states/<xx>.ts` exporting a StateRuleSet and register it here.
 */
const STATE_RULES: Record<string, StateRuleSet> = {
  CA: CA_RULES,
};

export const SUPPORTED_STATES = Object.values(STATE_RULES).map((s) => ({
  code: s.state,
  label: s.label,
}));

export function isStateSupported(state: string): boolean {
  return state.toUpperCase() in STATE_RULES;
}

/**
 * Derive all deadlines for a lease under the given state's rules.
 * Unknown states fall back to CA (the only v1 ruleset) so nothing silently
 * disappears; the UI restricts selection to SUPPORTED_STATES.
 */
export function deriveDeadlines(
  lease: LeaseInput,
  state: string,
): DerivedDeadline[] {
  const ruleSet = STATE_RULES[state?.toUpperCase()] ?? CA_RULES;
  return ruleSet.rules
    .map((rule) => rule.derive(lease))
    .filter((d): d is DerivedDeadline => d !== null);
}
