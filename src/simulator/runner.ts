import { compileConstitution } from '../constitution/parser';
import { evaluateToolCall } from '../firewall/policy-evaluator';
import type { PayPalGateway } from '../paypal/gateway';
import type { SpendPolicy } from '../types/constitution';
import type { FirewallEvaluation } from '../types/firewall';
import { getScenarioById, type ScenarioDefinition } from './scenarios';

export interface ScenarioRunResult {
  scenario: ScenarioDefinition;
  policy: SpendPolicy;
  evaluation: FirewallEvaluation;
}

export function runScenarioById(
  scenarioId: string,
  constitutionMarkdown: string,
  gateway: PayPalGateway
): ScenarioRunResult {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario ID: ${scenarioId}`);
  }
  const policy = compileConstitution(constitutionMarkdown, scenario.mode);
  const evaluation = evaluateToolCall(scenario.call, policy, gateway);
  return { scenario, policy, evaluation };
}
