import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../../src/firewall/sha256';

describe('FIPS 180-4 SHA-256 Cryptographic Digest', () => {
  it('correctly digests empty string', () => {
    // NIST test vector for empty string
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('correctly digests "abc"', () => {
    // NIST standard test vector for "abc"
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('correctly digests "The quick brown fox jumps over the lazy dog"', () => {
    expect(sha256Hex('The quick brown fox jumps over the lazy dog')).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
    );
  });

  it('handles multi-block UTF-8 payloads', () => {
    const text = 'AllowAgent MCP: Constitutional Spend Firewall for PayPal AI Agents (2026)'.repeat(5);
    const hex = sha256Hex(text);
    expect(hex).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hex)).toBe(true);
  });
});
