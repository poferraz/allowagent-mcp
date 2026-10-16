import type { McpToolCall, PayPalMcpReadTool } from './mcp';

export type InjectionVectorType =
  | 'ROLE_OVERRIDE'
  | 'TOOL_SMUGGLING'
  | 'AUTHORITY_COERCION';

export interface InjectionScanResult {
  detected: boolean;
  vectors: InjectionVectorType[];
  flaggedQuotes: string[];
  explanation: string;
}

export type ContradictionCode =
  | 'INVALID_TOOL_ARGUMENTS'
  | 'MISSING_OR_INVALID_RESOURCE'
  | 'TOOL_NOT_IN_CONSTITUTION'
  | 'SPOOFED_VENDOR_DOMAIN'
  | 'NEW_UNVERIFIED_VENDOR'
  | 'PRICE_CREEP_DETECTED'
  | 'MAX_AUTOPAY_EXCEEDED'
  | 'DAILY_CAP_EXCEEDED'
  | 'DOUBLE_REFUND_DETECTED'
  | 'DELIVERED_REFUND_CONFLICT'
  | 'DELIVERED_DISPUTE_SURRENDER'
  | 'SUBSCRIPTION_PRICE_SPIKE';

export interface LedgerFinding {
  code: ContradictionCode;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  agentClaim: string;
  ledgerFact: string;
  readToolUsed: PayPalMcpReadTool;
}

export interface CrossExamResult {
  readToolsInvoked: PayPalMcpReadTool[];
  findings: LedgerFinding[];
  verifiedFactsComplete: boolean;
  ledgerUntrustedText?: string;
  verifiedBaselineUsd?: number;
  priceCreepPercent?: number;
  addedLineItems: string[];
  ledgerCitations: string[];
}

export type FirewallVerdictType =
  | 'AUTO_EXECUTE'
  | 'PAUSE_FOR_APPROVAL'
  | 'HARD_BLOCK';

export interface EvidenceDiffCard {
  callId: string;
  toolName: string;
  proposedAmountUsd: number;
  verifiedBaselineUsd?: number;
  canAmendToBaseline: boolean;
  addedLineItems: string[];
  ledgerCitations: string[];
  summary: string;
  payloadHash: string;
}

export interface FirewallEvaluation {
  call: McpToolCall;
  injectionScan: InjectionScanResult;
  crossExam: CrossExamResult;
  verdict: FirewallVerdictType;
  triggeredRule: string;
  payloadHash: string;
  diffCard?: EvidenceDiffCard;
  executionStatus:
    | 'NOT_EXECUTED'
    | 'EXECUTED_FULL'
    | 'EXECUTED_BASELINE_AMENDED'
    | 'PAUSED'
    | 'BLOCKED'
    | 'REJECTED_BY_HUMAN';
  executedAmountUsd?: number;
  timestampIso: string;
}
