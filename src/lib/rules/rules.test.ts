import { describe, it, expect } from 'vitest';
import { deriveDeadlines, isStateSupported } from './index';
import type { LeaseInput } from './types';

const emptyLease: LeaseInput = {
  lease_start: null,
  lease_end: null,
  monthly_rent: null,
  deposit_amount: null,
  move_out_date: null,
  rent_increase_notice_days: null,
  license_renewal_date: null,
  insurance_renewal_date: null,
  inspection_date: null,
};

function byType(lease: LeaseInput) {
  return Object.fromEntries(
    deriveDeadlines(lease, 'CA').map((d) => [d.type, d.due_date]),
  );
}

describe('CA rules engine', () => {
  it('derives nothing from an empty lease', () => {
    expect(deriveDeadlines(emptyLease, 'CA')).toEqual([]);
  });

  it('creates a deposit return 21 days after move-out', () => {
    const out = byType({ ...emptyLease, move_out_date: '2026-06-10' });
    expect(out.deposit_return).toBe('2026-07-01');
  });

  it('creates a lease-renewal deadline at lease end', () => {
    const out = byType({ ...emptyLease, lease_end: '2026-12-31' });
    expect(out.lease_renewal).toBe('2026-12-31');
  });

  it('places the rent-increase notice the notice-days before lease end', () => {
    const out = byType({
      ...emptyLease,
      lease_end: '2026-12-31',
      rent_increase_notice_days: 30,
    });
    expect(out.rent_increase_notice).toBe('2026-12-01');
  });

  it('omits the rent-increase notice when lease_end is missing', () => {
    const out = byType({ ...emptyLease, rent_increase_notice_days: 30 });
    expect(out.rent_increase_notice).toBeUndefined();
  });

  it('passes through inspection, insurance and license dates', () => {
    const out = byType({
      ...emptyLease,
      inspection_date: '2026-08-01',
      insurance_renewal_date: '2026-09-15',
      license_renewal_date: '2026-10-20',
    });
    expect(out.inspection).toBe('2026-08-01');
    expect(out.insurance_renewal).toBe('2026-09-15');
    expect(out.license_renewal).toBe('2026-10-20');
  });

  it('derives several deadlines from a fully populated lease', () => {
    const out = deriveDeadlines(
      {
        ...emptyLease,
        lease_end: '2026-12-31',
        move_out_date: '2026-06-10',
        rent_increase_notice_days: 90,
        inspection_date: '2026-08-01',
      },
      'CA',
    );
    expect(out).toHaveLength(4);
  });

  it('falls back to CA for unknown states (v1)', () => {
    const out = byType({ ...emptyLease, move_out_date: '2026-06-10' });
    const ny = Object.fromEntries(
      deriveDeadlines({ ...emptyLease, move_out_date: '2026-06-10' }, 'NY').map(
        (d) => [d.type, d.due_date],
      ),
    );
    expect(ny.deposit_return).toBe(out.deposit_return);
  });

  it('reports supported states', () => {
    expect(isStateSupported('CA')).toBe(true);
    expect(isStateSupported('ca')).toBe(true);
    expect(isStateSupported('NY')).toBe(false);
  });
});
