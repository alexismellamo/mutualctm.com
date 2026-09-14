import { describe, expect, test } from 'bun:test';
import { getVigenciaStatus } from './dateUtils';

describe('getVigenciaStatus', () => {
  const today = new Date(2026, 8, 13);

  test('separates expired, expiring and active vigencias', () => {
    expect(getVigenciaStatus(undefined, today)).toBe('expired');
    expect(getVigenciaStatus('2026-09-12T00:00:00.000Z', today)).toBe('expired');
    expect(getVigenciaStatus('2026-09-13T00:00:00.000Z', today)).toBe('expiring');
    expect(getVigenciaStatus('2026-10-13T00:00:00.000Z', today)).toBe('expiring');
    expect(getVigenciaStatus('2026-10-14T00:00:00.000Z', today)).toBe('active');
  });
});
