import { describe, expect, it } from 'vitest';
import { formatExample } from '../index';

describe('example package', () => {
  it('exposes its internal behavior through the entry point', () => {
    expect(formatExample('mindtap')).toBe('Example: mindtap');
  });
});
