import React, { useState } from 'react';
import { compileConstitution, serializeConstitution } from '../constitution/parser';
import { DEFAULT_CONSTITUTIONS, STRICT_VAULT_CONSTITUTION_MD } from '../constitution/presets';
import { executeAutonomousCall, resolveApprovalDecision, type ApprovalAction } from '../firewall/approval-gate';
import { evaluateToolCall } from '../firewall/policy-evaluator';
import { createPayPalGateway } from '../paypal/live-client';
import type { PayPalGateway } from '../paypal/gateway';
import { getScenariosByMode, SCENARIO_DECK, type ScenarioDefinition } from '../simulator/scenarios';
import type { ConstitutionMode, SpendPolicy } from '../types/constitution';
import type { FirewallEvaluation } from '../types/firewall';
import type { McpToolCall } from '../types/mcp';
import type { AgentProposal } from '../agent/agent-client';
import { AgentPromptBar } from './components/AgentPromptBar';
import { ApprovalDiffModal } from './components/ApprovalDiffModal';
import { ConnectionModal, type ConnectionSettings } from './components/ConnectionModal';
import { ConstitutionPane } from './components/ConstitutionPane';
import { FirewallTracePane } from './components/FirewallTracePane';
import { SimulatorPane } from './components/SimulatorPane';
import { TopTelemetryBar } from './components/TopTelemetryBar';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<ConnectionSettings>({
    paypalClientId: '', paypalClientSecret: '', aiProvider: 'local', aiApiKey: ''
  });
  const [gateway, setGateway] = useState<PayPalGateway>(() => createPayPalGateway());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mode, setMode] = useState<ConstitutionMode>('PERSONAL');
  const [markdownByMode, setMarkdownByMode] = useState<Record<ConstitutionMode, string>>({
    PERSONAL: DEFAULT_CONSTITUTIONS.PERSONAL,
    BUSINESS: DEFAULT_CONSTITUTIONS.BUSINESS
  });
  const [activeScenario, setActiveScenario] = useState<ScenarioDefinition>(SCENARIO_DECK[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ledgerTick, setLedgerTick] = useState(0);

  const currentMarkdown = markdownByMode[mode];
  const policy = compileConstitution(currentMarkdown, mode);
  const [evaluation, setEvaluation] = useState<FirewallEvaluation>(() =>
    evaluateToolCall(SCENARIO_DECK[0].call, policy, gateway)
  );

  const runEvaluation = (scen: ScenarioDefinition, md: string, nextMode: ConstitutionMode, openModal = false) => {
    const nextEval = evaluateToolCall(scen.call, compileConstitution(md, nextMode), gateway);
    setEvaluation(nextEval);
    setIsModalOpen(openModal && nextEval.verdict === 'PAUSE_FOR_APPROVAL');
    setLedgerTick(t => t + 1);
  };

  const handleSelectMode = (nextMode: ConstitutionMode) => {
    setMode(nextMode);
    const first = getScenariosByMode(nextMode)[0];
    setActiveScenario(first);
    runEvaluation(first, markdownByMode[nextMode], nextMode, false);
  };

  const handleSelectScenario = (scen: ScenarioDefinition) => {
    setActiveScenario(scen);
    runEvaluation(scen, currentMarkdown, mode, false);
  };

  const handleMarkdownChange = (nextMd: string) => {
    setMarkdownByMode(prev => ({ ...prev, [mode]: nextMd }));
    runEvaluation(activeScenario, nextMd, mode, false);
  };

  const handleUpdatePolicy = (nextPolicy: SpendPolicy) => handleMarkdownChange(serializeConstitution(nextPolicy));

  const handleRestorePreset = () => {
    const preset = DEFAULT_CONSTITUTIONS[mode];
    setMarkdownByMode(prev => ({ ...prev, [mode]: preset }));
    runEvaluation(activeScenario, preset, mode, false);
  };

  const handleApplyStrictVault = () => {
    setMode('PERSONAL');
    setActiveScenario(SCENARIO_DECK[0]);
    setMarkdownByMode(prev => ({ ...prev, PERSONAL: STRICT_VAULT_CONSTITUTION_MD }));
    runEvaluation(SCENARIO_DECK[0], STRICT_VAULT_CONSTITUTION_MD, 'PERSONAL', false);
  };

  const handleResetLedger = () => {
    gateway.resetLedger();
    runEvaluation(activeScenario, currentMarkdown, mode, false);
  };

  const handleSaveSettings = (nextSettings: ConnectionSettings) => {
    setSettings(nextSettings);
    const nextGateway = createPayPalGateway({
      clientId: nextSettings.paypalClientId, clientSecret: nextSettings.paypalClientSecret
    });
    setGateway(nextGateway);
    setEvaluation(evaluateToolCall(activeScenario.call, policy, nextGateway));
    setLedgerTick(t => t + 1);
  };

  const handleProposeToolCall = (call: McpToolCall, proposal: AgentProposal) => {
    const customScenario: ScenarioDefinition = {
      id: 'P1', mode,
      badge: `AI: ${proposal.modelUsed.split('-')[0]}`,
      title: proposal.toolCall.agentSummary,
      subtitle: proposal.rationale,
      expectedVerdict: 'AUTO_EXECUTE',
      call
    };
    setActiveScenario(customScenario);
    const nextEval = evaluateToolCall(call, policy, gateway);
    setEvaluation(nextEval);
    setIsModalOpen(nextEval.verdict === 'PAUSE_FOR_APPROVAL');
    setLedgerTick(t => t + 1);
  };

  const handleExecuteAuto = () => {
    setEvaluation(executeAutonomousCall(evaluation, gateway));
    setLedgerTick(t => t + 1);
  };

  const handleApprovalDecision = (action: ApprovalAction) => {
    setEvaluation(resolveApprovalDecision(evaluation, action, gateway, evaluation.payloadHash));
    setIsModalOpen(false);
    setLedgerTick(t => t + 1);
  };

  return (
    <div className="app-shell" data-ledger-tick={ledgerTick}>
      <TopTelemetryBar
        mode={mode} onSelectMode={handleSelectMode}
        rolling24hSpendUsd={gateway.getRolling24hSpendUsd()}
        dailyCapUsd={policy.dailySpendCapUsd}
        gatewayMode={gateway.gatewayMode}
        isFailClosed={policy.isFailClosed}
        onResetLedger={handleResetLedger}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <div className="page-intro">
        <div>
          <h1>Your payments. Your rules.</h1>
          <p>Autonomous AI Agent with strict spend controls & live PayPal Sandbox verification.</p>
        </div>
        <span className="intro-note">
          {gateway.gatewayMode === 'LIVE_PAYPAL_SANDBOX' ? 'Connected to PayPal Sandbox' : 'Local Demo Sandbox'}<br />
          No real money moves.
        </span>
      </div>
      <AgentPromptBar
        onProposeToolCall={handleProposeToolCall}
        agentConfig={{ provider: settings.aiProvider, apiKey: settings.aiApiKey }}
      />
      <main className="command-grid">
        <SimulatorPane scenarios={getScenariosByMode(mode)} activeScenario={activeScenario} onSelectScenario={handleSelectScenario} />
        <FirewallTracePane evaluation={evaluation} policy={policy} onExecuteAuto={handleExecuteAuto} onOpenApprovalModal={() => setIsModalOpen(true)} />
        <ConstitutionPane markdown={currentMarkdown} onChangeMarkdown={handleMarkdownChange} onUpdatePolicy={handleUpdatePolicy} onRestoreDefault={handleRestorePreset} onApplyStrictVault={handleApplyStrictVault} policy={policy} />
      </main>
      <footer className="page-footer"><span>AllowAgent MCP</span><span>Autonomous AI Agent spend firewall for PayPal.</span></footer>
      {isModalOpen && evaluation.verdict === 'PAUSE_FOR_APPROVAL' && (
        <ApprovalDiffModal evaluation={evaluation} onDecision={handleApprovalDecision} onClose={() => setIsModalOpen(false)} />
      )}
      {isSettingsOpen && (
        <ConnectionModal settings={settings} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

export default App;
