import { describe, it, expect } from 'vitest';
import { currentBucket } from './reminders';

const LEADS = [60, 30, 7, 1];

describe('currentBucket', () => {
  it('returns null when further out than the largest lead time', () => {
    expect(currentBucket(90, LEADS)).toBeNull();
  });

  it('picks the largest bucket just inside the window', () => {
    expect(currentBucket(60, LEADS)).toBe(60);
    expect(currentBucket(45, LEADS)).toBe(60);
  });

  it('advances to the next milestone as the deadline nears', () => {
    expect(currentBucket(30, LEADS)).toBe(30);
    expect(currentBucket(20, LEADS)).toBe(30);
    expect(currentBucket(7, LEADS)).toBe(7);
    expect(currentBucket(5, LEADS)).toBe(7);
    expect(currentBucket(1, LEADS)).toBe(1);
  });

  it('uses the smallest bucket for due-today and overdue', () => {
    expect(currentBucket(0, LEADS)).toBe(1);
    expect(currentBucket(-3, LEADS)).toBe(1);
  });

  it('works with an unsorted custom lead-time list', () => {
    expect(currentBucket(10, [14, 3, 1])).toBe(14);
    expect(currentBucket(2, [14, 3, 1])).toBe(3);
  });
});
