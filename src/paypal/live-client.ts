import type {
  PayPalDisputeRecord,
  PayPalInvoiceRecord,
  PayPalOrderRecord,
  PayPalSubscriptionRecord,
  PayPalTrackingRecord,
  PayPalTransactionRecord
} from '../types/paypal';
import type { PayPalGateway } from './gateway';
import { StatefulLedgerClient } from './ledger-client';

export interface LivePayPalConfig {
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export class LivePayPalClient implements PayPalGateway {
  public readonly gatewayMode = 'LIVE_PAYPAL_SANDBOX' as const;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly backingLedger: StatefulLedgerClient;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(config?: LivePayPalConfig) {
    this.clientId = config?.clientId?.trim() ?? '';
    this.clientSecret = config?.clientSecret?.trim() ?? '';
    this.baseUrl = (config?.baseUrl ?? 'https://api-m.sandbox.paypal.com').replace(/\/+$/, '');
    this.backingLedger = new StatefulLedgerClient();
  }

  async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal Sandbox authentication failed: Missing Client ID or Client Secret.');
    }
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 60000) {
      return this.cachedToken.token;
    }
    const creds = btoa(`${this.clientId}:${this.clientSecret}`);
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`PayPal Sandbox authentication failed (${res.status}): ${errText || res.statusText}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) * 1000 };
    return data.access_token;
  }

  async testConnection(): Promise<{ ok: boolean; message: string; scope?: string }> {
    try {
      const token = await this.getAccessToken();
      return { ok: Boolean(token), message: 'Connected to PayPal Sandbox API (OAuth 2.0 verified)' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: msg };
    }
  }

  async fetchLiveInvoice(invoiceId: string): Promise<PayPalInvoiceRecord | undefined> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) return undefined;
    const raw = await res.json() as {
      id: string;
      status: string;
      invoicer?: { name?: { given_name?: string; surname?: string }; email_address?: string };
      amount?: { value?: string };
      items?: Array<{ name: string; quantity: string; unit_amount?: { value?: string } }>;
    };
    const inv: PayPalInvoiceRecord = {
      invoiceId: raw.id,
      vendorName: [raw.invoicer?.name?.given_name, raw.invoicer?.name?.surname].filter(Boolean).join(' ') || 'PayPal Merchant',
      vendorEmail: raw.invoicer?.email_address ?? '',
      totalAmountUsd: Number(raw.amount?.value ?? '0'),
      historicalAverageUsd: Number(raw.amount?.value ?? '0'),
      lineItems: (raw.items ?? []).map(item => ({
        name: item.name,
        amountUsd: Number(item.unit_amount?.value ?? '0'),
        approvedBaseline: true
      }))
    };
    return inv;
  }

  async executeLiveInvoicePayment(invoiceId: string, amountUsd: number): Promise<{ ok: boolean; paymentId: string }> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'OTHER',
        payment_type: 'EXTERNAL',
        amount: { currency_code: 'USD', value: amountUsd.toFixed(2) },
        note: 'Recorded via AllowAgent MCP Spend Firewall'
      })
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Live invoice payment failed (${res.status}): ${err || res.statusText}`);
    }
    const data = await res.json() as { payment_id?: string };
    return { ok: true, paymentId: data.payment_id ?? `PAY-LIVE-${Date.now()}` };
  }

  getRolling24hSpendUsd(): number { return this.backingLedger.getRolling24hSpendUsd(); }
  getOrder(orderId: string): PayPalOrderRecord | undefined { return this.backingLedger.getOrder(orderId); }
  getInvoice(invoiceId: string): PayPalInvoiceRecord | undefined { return this.backingLedger.getInvoice(invoiceId); }
  listTransactions(recipientEmail?: string): PayPalTransactionRecord[] { return this.backingLedger.listTransactions(recipientEmail); }
  getShipmentTracking(orderId: string): PayPalTrackingRecord | undefined { return this.backingLedger.getShipmentTracking(orderId); }
  getDispute(disputeId: string): PayPalDisputeRecord | undefined { return this.backingLedger.getDispute(disputeId); }
  getSubscription(subscriptionId: string): PayPalSubscriptionRecord | undefined { return this.backingLedger.getSubscription(subscriptionId); }
  hasPriorRefund(orderId: string): boolean { return this.backingLedger.hasPriorRefund(orderId); }

  recordPayment(params: { recipientName: string; recipientEmail: string; amountUsd: number; orderId?: string }): PayPalTransactionRecord {
    return this.backingLedger.recordPayment(params);
  }

  recordRefund(orderId: string, amountUsd: number): PayPalTransactionRecord {
    return this.backingLedger.recordRefund(orderId, amountUsd);
  }

  resetLedger(): void { this.backingLedger.resetLedger(); }
}

export function createPayPalGateway(config?: LivePayPalConfig): PayPalGateway {
  if (config?.clientId && config?.clientSecret) {
    return new LivePayPalClient(config);
  }
  return new StatefulLedgerClient();
}
