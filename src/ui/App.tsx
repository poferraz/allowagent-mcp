import React, { useState } from 'react';
import { compileConstitution, serializeConstitution } from '../constitution/parser';
import { DEFAULT_CONSTITUTIONS, STRICT_VAULT_CONSTITUTION_MD } from '../constitution/presets';
import {
  executeAutonomousCall,
  resolveApprovalDecision,
  type ApprovalAction
} from '../firewall/approval-gate';
import { evaluateToolCall } from '../firewall/policy-evaluator';
import { StatefulLedgerClient } from '../paypal/ledger-client';
import { getScenariosByMode, SCENARIO_DECK, type ScenarioDefinition } from '../simulator/scenarios';
import type { ConstitutionMode, SpendPolicy } from '../types/constitution';
import type { FirewallEvaluation } from '../types/firewall';
import { ApprovalDiffModal } from './components/ApprovalDiffModal';
import { ConstitutionPane } from './components/ConstitutionPane';
import { FirewallTracePane } from './components/FirewallTracePane';
import { SimulatorPane } from './components/SimulatorPane';
import { TopTelemetryBar } from './components/TopTelemetryBar';

export const App: React.FC = () => {
  const [ledger] = useState(() => new StatefulLedgerClient());
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
    evaluateToolCall(SCENARIO_DECK[0].call, policy, ledger)
  );

  const runEvaluation = (
    scen: ScenarioDefinition,
    md: string,
    nextMode: ConstitutionMode,
    openModalOnPause = false
  ) => {
    const compiled = compileConstitution(md, nextMode);
    const nextEval = evaluateToolCall(scen.call, compiled, ledger);
    setEvaluation(nextEval);
    setIsModalOpen(openModalOnPause && nextEval.verdict === 'PAUSE_FOR_APPROVAL');
    setLedgerTick(t => t + 1);
  };

  const handleSelectMode = (nextMode: ConstitutionMode) => {
    setMode(nextMode);
    const firstScenario = getScenariosByMode(nextMode)[0];
    setActiveScenario(firstScenario);
    runEvaluation(firstScenario, markdownByMode[nextMode], nextMode, false);
  };

  const handleSelectScenario = (scen: ScenarioDefinition) => {
    setActiveScenario(scen);
    runEvaluation(scen, currentMarkdown, mode, false);
  };

  const handleMarkdownChange = (nextMd: string) => {
    setMarkdownByMode(prev => ({ ...prev, [mode]: nextMd }));
    runEvaluation(activeScenario, nextMd, mode, false);
  };

  const handleUpdatePolicy = (nextPolicy: SpendPolicy) => {
    handleMarkdownChange(serializeConstitution(nextPolicy));
  };

  const handleRestorePreset = () => {
    const preset = DEFAULT_CONSTITUTIONS[mode];
    setMarkdownByMode(prev => ({ ...prev, [mode]: preset }));
    runEvaluation(activeScenario, preset, mode, false);
  };

  const handleApplyStrictVault = () => {
    const firstPersonal = SCENARIO_DECK[0];
    setMode('PERSONAL');
    setActiveScenario(firstPersonal);
    setMarkdownByMode(prev => ({ ...prev, PERSONAL: STRICT_VAULT_CONSTITUTION_MD }));
    runEvaluation(firstPersonal, STRICT_VAULT_CONSTITUTION_MD, 'PERSONAL', false);
  };

  const handleResetLedger = () => {
    ledger.resetLedger();
    runEvaluation(activeScenario, currentMarkdown, mode, false);
  };

  const handleExecuteAuto = () => {
    const executed = executeAutonomousCall(evaluation, ledger);
    setEvaluation(executed);
    setLedgerTick(t => t + 1);
  };

  const handleApprovalDecision = (action: ApprovalAction) => {
    const resolved = resolveApprovalDecision(evaluation, action, ledger, evaluation.payloadHash);
    setEvaluation(resolved);
    setIsModalOpen(false);
    setLedgerTick(t => t + 1);
  };

  return (
    <div className="app-shell" data-ledger-tick={ledgerTick}>
      <TopTelemetryBar
        mode={mode}
        onSelectMode={handleSelectMode}
        rolling24hSpendUsd={ledger.getRolling24hSpendUsd()}
        dailyCapUsd={policy.dailySpendCapUsd}
        gatewayMode={ledger.gatewayMode}
        isFailClosed={policy.isFailClosed}
        onResetLedger={handleResetLedger}
      />

      <div className="page-intro">
        <div><h1>Your payments. Your rules.</h1>
          <p>Give your AI assistant clear limits. Stay in control of every payment.</p></div>
        <span className="intro-note">Explore with sample payments.<br />No real money moves.</span>
      </div>

      <main className="command-grid">
        <SimulatorPane
          scenarios={getScenariosByMode(mode)}
          activeScenario={activeScenario}
          onSelectScenario={handleSelectScenario}
        />

        <FirewallTracePane
          evaluation={evaluation}
          policy={policy}
          onExecuteAuto={handleExecuteAuto}
          onOpenApprovalModal={() => setIsModalOpen(true)}
        />
        <ConstitutionPane
          markdown={currentMarkdown}
          onChangeMarkdown={handleMarkdownChange}
          onUpdatePolicy={handleUpdatePolicy}
          onRestoreDefault={handleRestorePreset}
          onApplyStrictVault={handleApplyStrictVault}
          policy={policy}
        />

      </main>
      <footer className="page-footer"><span>AllowAgent MCP</span><span>An independent demo built with PayPal tools.</span></footer>

      {isModalOpen && evaluation.verdict === 'PAUSE_FOR_APPROVAL' && (
        <ApprovalDiffModal
          evaluation={evaluation}
          onDecision={handleApprovalDecision}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
