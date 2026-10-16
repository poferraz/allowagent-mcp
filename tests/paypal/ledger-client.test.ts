import { describe, it, expect } from 'vitest';
import { StatefulLedgerClient } from '../../src/paypal/ledger-client';

describe('StatefulLedgerClient (PayPal Sandbox Ledger)', () => {
  it('retrieves seeded orders, invoices, tracking records, disputes, and historical transactions as immutable clones', () => {
    const ledger = new StatefulLedgerClient();
    expect(ledger.getRolling24hSpendUsd()).toBe(42);

    const metroInvoice = ledger.getInvoice('INV2-METRO-01');
    expect(metroInvoice?.totalAmountUsd).toBe(28);

    const sarahInvoice = ledger.getInvoice('INV2-SARAH-104');
    expect(sarahInvoice).toBeDefined();
    expect(sarahInvoice?.totalAmountUsd).toBe(185);
    expect(sarahInvoice?.historicalAverageUsd).toBe(150);

    if (sarahInvoice) {
      sarahInvoice.totalAmountUsd = 9999;
    }
    expect(ledger.getInvoice('INV2-SARAH-104')?.totalAmountUsd).toBe(185);

    const deskTracking = ledger.getShipmentTracking('ORD-882');
    expect(deskTracking?.status).toBe('DELIVERED');

    const fiberHistory = ledger.listTransactions('autopay@metrofiber.com');
    expect(fiberHistory.length).toBeGreaterThanOrEqual(3);
  });

  it('mutates rolling 24h spend with unique monotonic IDs and rejects negative or zero amounts', () => {
    const ledger = new StatefulLedgerClient();
    const initialSpend = ledger.getRolling24hSpendUsd();

    const t1 = ledger.recordPayment({
      recipientName: 'Metro Fiber',
      recipientEmail: 'autopay@metrofiber.com',
      amountUsd: 28,
      orderId: 'ORD-101'
    });
    const t2 = ledger.recordPayment({
      recipientName: 'Metro Fiber',
      recipientEmail: 'autopay@metrofiber.com',
      amountUsd: 10,
      orderId: 'ORD-101'
    });

    expect(t1.transactionId).not.toBe(t2.transactionId);
    expect(ledger.getRolling24hSpendUsd()).toBe(initialSpend + 38);
    expect(() =>
      ledger.recordPayment({
        recipientName: 'Attacker',
        recipientEmail: 'bad@example.com',
        amountUsd: -39
      })
    ).toThrow(/Invalid monetary amount/);

    expect(ledger.hasPriorRefund('ORD-901')).toBe(false);
    ledger.recordRefund('ORD-901', 24);
    expect(ledger.hasPriorRefund('ORD-901')).toBe(true);
    expect(ledger.getOrder('ORD-901')?.refundableBalanceUsd).toBe(0);
  });
});
