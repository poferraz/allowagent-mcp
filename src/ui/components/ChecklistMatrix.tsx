import React from 'react';
import { ChecklistItem } from '../../types/dispute';
import { ContradictionAlert } from '../../types/ai';

interface Props {
  items: ChecklistItem[];
  alerts: ContradictionAlert[];
}

export const ChecklistMatrix: React.FC<Props> = ({ items, alerts }) => {
  return (
    <div className="space-y-4">
      {alerts.map(a => (
        <div key={a.id} className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-xl text-amber-200 text-sm">
          <div className="font-semibold text-amber-300 flex items-center gap-2">
            <span>⚠️</span> {a.title}
          </div>
          <p className="mt-1.5 text-amber-200/90 text-xs leading-relaxed">{a.customerExplanation}</p>
          <div className="mt-2 text-xs font-mono text-amber-400/80 bg-amber-900/30 p-2 rounded border border-amber-800/40">
            Advice: {a.suggestedCorrection}
          </div>
        </div>
      ))}

      <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Evidence Readiness Checklist</h3>
        <ul className="space-y-2.5">
          {items.map(it => (
            <li key={it.id} className="flex items-start gap-3 text-xs text-slate-300 p-2.5 rounded-lg bg-slate-800/40">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${it.satisfied ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                {it.requiredParty}
              </span>
              <span className="flex-1">{it.description}</span>
              <span className="font-semibold">{it.satisfied ? '✅ Ready' : '⏳ Pending'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
