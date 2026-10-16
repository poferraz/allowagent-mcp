import React from 'react';
import type { ConstitutionMode } from '../../types/constitution';

export interface TopTelemetryBarProps {
  mode: ConstitutionMode;
  onSelectMode: (mode: ConstitutionMode) => void;
  rolling24hSpendUsd: number;
  dailyCapUsd: number;
  gatewayMode: 'SANDBOX_LEDGER' | 'LIVE_PAYPAL_SANDBOX';
  isFailClosed: boolean;
  onResetLedger: () => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  mode,
  onSelectMode,
  rolling24hSpendUsd,
  dailyCapUsd,
  gatewayMode,
  isFailClosed,
  onResetLedger
}) => {
  return (
    <header className="telemetry-bar">
      <div className="brand-group">
        <span className="brand-title">AllowAgent MCP</span>
        <span className="badge badge-info">PayPal Constitutional Spend Firewall</span>
        <span className="badge badge-green">
          {gatewayMode === 'SANDBOX_LEDGER'
            ? 'Deterministic PayPal Ledger'
            : 'Live PayPal Sandbox'}
        </span>
        {isFailClosed && (
          <span className="badge badge-red">FAIL-CLOSED: PAYPAL.MD LIMIT ERROR</span>
        )}
      </div>

      <div className="brand-group">
        <button
          type="button"
          className={`btn ${mode === 'PERSONAL' ? '' : 'btn-secondary'}`}
          onClick={() => onSelectMode('PERSONAL')}
        >
          Personal Wallet Mode
        </button>
        <button
          type="button"
          className={`btn ${mode === 'BUSINESS' ? '' : 'btn-secondary'}`}
          onClick={() => onSelectMode('BUSINESS')}
        >
          Business Back-Office Mode
        </button>
      </div>

      <div className="brand-group">
        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
          24h PayPal Spend: <strong>${rolling24hSpendUsd.toFixed(2)}</strong> / $
          {dailyCapUsd.toFixed(2)} USD
        </span>
        <button type="button" className="btn btn-secondary" onClick={onResetLedger}>
          Reset Sandbox Ledger
        </button>
      </div>
    </header>
  );
};
