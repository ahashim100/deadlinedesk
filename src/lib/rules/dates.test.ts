import { describe, it, expect } from 'vitest';
import { addDays, subDays, parseDate, formatDate } from './dates';

describe('date helpers', () => {
  it('adds days across a month boundary', () => {
    expect(addDays('2026-01-30', 5)).toBe('2026-02-04');
  });

  it('subtracts days across a year boundary', () => {
    expect(subDays('2026-01-02', 5)).toBe('2025-12-28');
  });

  it('adds the CA deposit-return window correctly', () => {
    expect(addDays('2026-06-10', 21)).toBe('2026-07-01');
  });

  it('handles leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('round-trips parse/format in UTC', () => {
    expect(formatDate(parseDate('2026-06-26'))).toBe('2026-06-26');
  });
});
