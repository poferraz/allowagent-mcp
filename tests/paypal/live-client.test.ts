import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LivePayPalClient } from '../../src/paypal/live-client';

describe('LivePayPalClient — Real PayPal Sandbox REST Client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('obtains an OAuth2 bearer token from PayPal Sandbox endpoint', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'test-sandbox-token-12345',
        token_type: 'Bearer',
        expires_in: 32400,
        scope: 'https://uri.paypal.com/services/invoicing'
      })
    });

    const client = new LivePayPalClient({
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret'
    });

    const status = await client.testConnection();
    expect(status.ok).toBe(true);
    expect(status.message).toContain('Connected to PayPal Sandbox');

    const token = await client.getAccessToken();
    expect(token).toBe('test-sandbox-token-12345');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      })
    );
  });

  it('fails closed when credentials are invalid or missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ error: 'invalid_client' })
    });

    const client = new LivePayPalClient({
      clientId: 'bad-id',
      clientSecret: 'bad-secret'
    });

    const status = await client.testConnection();
    expect(status.ok).toBe(false);
    expect(status.message).toContain('PayPal Sandbox authentication failed');

    await expect(client.getAccessToken()).rejects.toThrow(/PayPal Sandbox authentication failed/);
  });

  it('fetches and maps an invoice from PayPal Sandbox Invoicing v2 API', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'INV2-LIVE-101',
          status: 'UNPAID',
          detail: {
            currency_code: 'USD',
            metadata: { create_time: '2026-10-15T12:00:00Z' }
          },
          invoicer: {
            name: { given_name: 'Metro', surname: 'Fiber' },
            email_address: 'autopay@metrofiber.com'
          },
          amount: {
            currency_code: 'USD',
            value: '28.00'
          },
          items: [
            {
              name: 'Fiber Internet 1Gbps',
              quantity: '1',
              unit_amount: { currency_code: 'USD', value: '28.00' }
            }
          ]
        })
      });

    const client = new LivePayPalClient({
      clientId: 'valid-id',
      clientSecret: 'valid-secret'
    });

    const inv = await client.fetchLiveInvoice('INV2-LIVE-101');
    expect(inv).toBeDefined();
    expect(inv?.invoiceId).toBe('INV2-LIVE-101');
    expect(inv?.totalAmountUsd).toBe(28);
    expect(inv?.vendorName).toBe('Metro Fiber');
    expect(inv?.vendorEmail).toBe('autopay@metrofiber.com');
  });

  it('records live payment on an invoice in PayPal Sandbox', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          payment_id: 'PAY-SANDBOX-991',
          type: 'EXTERNAL'
        })
      });

    const client = new LivePayPalClient({
      clientId: 'valid-id',
      clientSecret: 'valid-secret'
    });

    const tx = await client.executeLiveInvoicePayment('INV2-LIVE-101', 28);
    expect(tx.ok).toBe(true);
    expect(tx.paymentId).toBe('PAY-SANDBOX-991');
  });
});
