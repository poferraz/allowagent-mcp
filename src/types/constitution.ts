import type { PayPalMcpWriteTool } from './mcp';

export type ConstitutionMode = 'PERSONAL' | 'BUSINESS';
export type UnknownVendorPolicy = 'PAUSE_FOR_APPROVAL' | 'HARD_BLOCK';

export interface TrustedVendor {
  name: string;
  email: string;
}

export interface SpendPolicy {
  mode: ConstitutionMode;
  maxAutoPayUsd: number;
  dailySpendCapUsd: number;
  maxAutoRefundUsd: number;
  priceCreepTolerancePercent: number;
  requireHistoricalInvoiceCheck: boolean;
  unknownVendorPolicy: UnknownVendorPolicy;
  requireNonDeliveryForRefundOrDispute: boolean;
  blockPromptInjection: 'STRICT' | 'WARN';
  allowedTools: PayPalMcpWriteTool[];
  trustedVendors: TrustedVendor[];
  parseWarnings: string[];
  isFailClosed: boolean;
}
