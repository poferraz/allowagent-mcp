import React from 'react';
import { RefreshCw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { ConstitutionMode } from '../../types/constitution';
import { HelpTip } from './HelpTip';
import { money } from '../presentation';

export interface TopTelemetryBarProps {
  mode: ConstitutionMode;
  onSelectMode: (mode: ConstitutionMode) => void;
  rolling24hSpendUsd: number;
  dailyCapUsd: number;
  gatewayMode: 'SANDBOX_LEDGER' | 'LIVE_PAYPAL_SANDBOX';
  isFailClosed: boolean;
  onResetLedger: () => void;
  onOpenSettings?: () => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = props => {
  const { mode, onSelectMode, rolling24hSpendUsd, dailyCapUsd, gatewayMode, isFailClosed, onResetLedger, onOpenSettings } = props;
  return <>
    <header className="telemetry-bar">
      <div className="header-inner">
        <div className="brand-group">
          <svg viewBox="0 0 374 450" width="28" height="32" role="img" aria-label="PayPal" fill="none">
            <path fill="#FFFFFF" d="M318.58 103.5c0 55.74-51.44 121.5-129.27 121.5h-74.97l-3.68 23.22-17.49 111.78H0L56.05 0h150.95c50.83 0 90.82 28.33 105.55 67.7 4.25 11.45 6.29 23.59 6.03 35.8Z" />
            <path fill="#69C9F5" d="M372.28 207c-10.27 62.41-64.29 108.15-127.54 108h-52.06l-21.67 135h-92.67l14.83-90 17.5-111.78 3.67-23.22h74.97c77.73 0 129.27-65.76 129.27-121.5 38.25 19.74 60.55 59.63 53.7 103.5Z" />
            <path fill="#0070E0" d="M318.58 103.5c-16.04-8.39-35.49-13.5-56.66-13.5h-126.4l-21.18 135h74.97c77.73 0 129.27-65.76 129.27-121.5Z" />
          </svg>
          <span className="brand-title">PayPal</span><span className="brand-divider" />
          <span className="product-name">AllowAgent</span>
        </div>
        <nav className="mode-switch" aria-label="Account type">
          {(['PERSONAL', 'BUSINESS'] as const).map(value => <button type="button" key={value}
            aria-pressed={mode === value} className={mode === value ? 'active' : ''}
            title={`Use ${value.toLowerCase()} payment settings and examples`} onClick={() => onSelectMode(value)}>
            {value === 'PERSONAL' ? 'Personal' : 'Business'}
          </button>)}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="demo-indicator"><ShieldCheck size={17} /> {gatewayMode === 'SANDBOX_LEDGER' ? 'Demo account' : 'PayPal sandbox'}
            <HelpTip label="demo account">{gatewayMode === 'SANDBOX_LEDGER'
              ? 'Try sample payments using local demo records. No real money moves.'
              : 'This environment uses PayPal test accounts, not real money.'}</HelpTip>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              className="text-button"
              style={{ color: '#FFFFFF', opacity: 0.9, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(255,255,255,0.12)', padding: '4px 8px', borderRadius: '4px' }}
              onClick={onOpenSettings}
              title="Configure PayPal Sandbox credentials and AI model API keys"
            >
              <SlidersHorizontal size={13} /> Settings
            </button>
          )}
        </div>
      </div>
    </header>
    <div className="account-strip"><div className="account-strip-inner">
      <span>Demo spending in the last 24 hours <strong>{money(rolling24hSpendUsd)}</strong>
        <span className="muted"> of {money(dailyCapUsd)} limit</span></span>
      <button className="text-button" type="button" onClick={onResetLedger}
        title="Restore the sample account records and spending total. Your payment settings stay as they are.">
        <RefreshCw size={14} /> Reset demo
      </button>
    </div></div>
    {isFailClosed && <div className="policy-alert" role="alert">Automatic payments are paused. Check your payment rules below.</div>}
  </>;
};
