import { describe, it, expect } from 'vitest';
import { parsePageParam, getPageRange, splitPage, DEFAULT_PAGE_SIZE } from './pagination';

describe('parsePageParam', () => {
  it('defaults to page 1 when undefined', () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it('parses a valid page number', () => {
    expect(parsePageParam('3')).toBe(3);
  });

  it('falls back to 1 for non-numeric or non-positive input', () => {
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-5')).toBe(1);
  });
});

describe('getPageRange', () => {
  it('computes a zero-indexed range with one lookahead row', () => {
    expect(getPageRange(1, 50)).toEqual([0, 50]);
    expect(getPageRange(2, 50)).toEqual([50, 100]);
    expect(getPageRange(3, 20)).toEqual([40, 60]);
  });
});

describe('splitPage', () => {
  it('reports no more pages when rows fit exactly within the page size', () => {
    const rows = Array.from({ length: 10 }, (_, i) => i);
    const result = splitPage(rows, 10);
    expect(result.rows).toHaveLength(10);
    expect(result.hasMore).toBe(false);
  });

  it('trims the lookahead row and reports hasMore when there are more rows than the page size', () => {
    const rows = Array.from({ length: 11 }, (_, i) => i);
    const result = splitPage(rows, 10);
    expect(result.rows).toHaveLength(10);
    expect(result.hasMore).toBe(true);
  });

  it('uses the default page size when none is passed', () => {
    const rows = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => i);
    const result = splitPage(rows);
    expect(result.hasMore).toBe(false);
  });
});
