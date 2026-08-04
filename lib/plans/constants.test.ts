import { describe, it, expect } from 'vitest';
import { isUnderLimit, hasFeature, PLAN_LIMITS, PLAN_FEATURES } from './constants';

describe('isUnderLimit', () => {
  it('treats -1 as unlimited', () => {
    expect(isUnderLimit(999999, -1)).toBe(true);
  });

  it('allows usage strictly below the limit', () => {
    expect(isUnderLimit(4, 5)).toBe(true);
  });

  it('blocks usage at or above the limit', () => {
    expect(isUnderLimit(5, 5)).toBe(false);
    expect(isUnderLimit(6, 5)).toBe(false);
  });
});

describe('hasFeature', () => {
  it('gates features correctly per the approved plan table', () => {
    expect(hasFeature('free', 'kanbanPipeline')).toBe(false);
    expect(hasFeature('starter', 'kanbanPipeline')).toBe(true);
    expect(hasFeature('free', 'csvImport')).toBe(false);
    expect(hasFeature('growth', 'csvImport')).toBe(true);
  });

  it('every plan defines every feature key (no silent undefined gate)', () => {
    const featureKeys = Object.keys(PLAN_FEATURES.pro);
    for (const plan of Object.keys(PLAN_LIMITS) as (keyof typeof PLAN_LIMITS)[]) {
      for (const key of featureKeys) {
        expect(typeof PLAN_FEATURES[plan][key as keyof typeof PLAN_FEATURES.pro]).toBe('boolean');
      }
    }
  });
});
