import { describe, it, expect } from 'vitest';
import { validateIraqiPhone } from './phone';

describe('validateIraqiPhone', () => {
  it('accepts a standard local number with leading 0', () => {
    const result = validateIraqiPhone('07712345678');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+9647712345678');
  });

  it('accepts a number without the leading 0', () => {
    const result = validateIraqiPhone('7712345678');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+9647712345678');
  });

  it('accepts a fully-qualified +964 number', () => {
    const result = validateIraqiPhone('+9647712345678');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+9647712345678');
  });

  it('accepts a 00964-prefixed number', () => {
    const result = validateIraqiPhone('009647712345678');
    expect(result.valid).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(validateIraqiPhone('').reason).toBe('empty');
    expect(validateIraqiPhone('   ').reason).toBe('empty');
  });

  it('rejects letters', () => {
    expect(validateIraqiPhone('077abc45678').reason).toBe('invalid_chars');
  });

  it('rejects a number not starting with 7', () => {
    expect(validateIraqiPhone('0812345678').reason).toBe('invalid_prefix');
  });

  it('rejects a too-short number', () => {
    expect(validateIraqiPhone('07712345').reason).toBe('too_short');
  });

  it('rejects a too-long number', () => {
    expect(validateIraqiPhone('077123456789').reason).toBe('too_long');
  });

  it('rejects a non-Iraqi country code', () => {
    expect(validateIraqiPhone('+19995551234').reason).toBe('invalid_prefix');
  });
});
