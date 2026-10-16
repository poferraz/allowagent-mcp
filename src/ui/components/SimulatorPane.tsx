import React from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import type { ScenarioDefinition } from '../../simulator/scenarios';
import { EXAMPLES, money } from '../presentation';
import { HelpTip } from './HelpTip';

export interface SimulatorPaneProps {
  scenarios: ScenarioDefinition[];
  activeScenario: ScenarioDefinition;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
}

export const SimulatorPane: React.FC<SimulatorPaneProps> = ({ scenarios, activeScenario, onSelectScenario }) => (
  <section className="pane examples-pane" aria-labelledby="examples-title">
    <div className="pane-header"><div><h2 id="examples-title">Try a payment example</h2>
      <p>See how your settings handle everyday and unusual requests.</p></div>
      <HelpTip label="payment examples">Choose an example to check it against your current settings. Selecting one never moves money.</HelpTip>
    </div>
    <div className="scenario-list" role="group" aria-label="Payment examples">
      {scenarios.map(scenario => {
        const selected = activeScenario.id === scenario.id;
        const copy = EXAMPLES[scenario.id];
        return <button type="button" key={scenario.id} className={`scenario-card ${selected ? 'active' : ''}`}
          aria-pressed={selected} onClick={() => onSelectScenario(scenario)}
          title={`Preview ${copy.title.toLowerCase()} against your current payment settings. No money moves.`}>
          <span className="scenario-icon">{selected ? <Check size={18} /> : <ArrowUpRight size={18} />}</span>
          <span className="scenario-copy"><strong>{copy.title}</strong><span>{copy.description}</span></span>
          <span className="scenario-amount">{money(scenario.call.args.amountUsd)}<small>USD</small></span>
        </button>;
      })}
    </div>
  </section>
);
