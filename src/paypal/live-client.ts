import type { PayPalGateway } from './gateway';
import { StatefulLedgerClient } from './ledger-client';

export interface LivePayPalConfig {
  clientId?: string;
  clientSecret?: string;
}

export function createPayPalGateway(_config?: LivePayPalConfig): PayPalGateway {
  return new StatefulLedgerClient();
}
