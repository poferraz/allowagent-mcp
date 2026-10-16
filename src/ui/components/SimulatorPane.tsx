import React from 'react';
import type { ScenarioDefinition } from '../../simulator/scenarios';

export interface SimulatorPaneProps {
  scenarios: ScenarioDefinition[];
  activeScenario: ScenarioDefinition;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
}

export const SimulatorPane: React.FC<SimulatorPaneProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario
}) => {
  return (
    <section className="pane" aria-label="PayPal MCP Simulator & Attack Deck">
      <div className="pane-header">
        <h2 className="pane-title">2. PayPal MCP Agent & Red-Team Deck</h2>
        <span className="badge badge-info">@paypal/agent-toolkit</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {scenarios.map(scen => {
          const isSelected = scen.id === activeScenario.id;
          const badgeClass =
            scen.expectedVerdict === 'AUTO_EXECUTE'
              ? 'badge-green'
              : scen.expectedVerdict === 'PAUSE_FOR_APPROVAL'
              ? 'badge-amber'
              : 'badge-red';
          return (
            <button
              key={scen.id}
              type="button"
              className={`scenario-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectScenario(scen)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.86rem' }}>{scen.title}</strong>
                <span className={`badge ${badgeClass}`}>{scen.badge}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{scen.subtitle}</div>
            </button>
          );
        })}
      </div>

      <div className="stage-box">
        <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#38bdf8' }}>
          Intercepted MCP Write Tool Call: <code>{activeScenario.call.toolName}</code>
        </div>
        <pre
          style={{
            margin: 0,
            fontSize: '0.74rem',
            color: '#e2e8f0',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          {JSON.stringify(activeScenario.call.args, null, 2)}
        </pre>
        {activeScenario.call.untrustedContext && (
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#cbd5e1' }}>
            <strong>Untrusted Source ({activeScenario.call.untrustedSourceLabel}):</strong>
            <div
              style={{
                marginTop: '4px',
                padding: '8px',
                background: '#070b16',
                borderRadius: '6px',
                border: '1px solid #334155'
              }}
            >
              {activeScenario.call.untrustedContext}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
