import React from 'react';
import { PlainLanguageAction } from '../../types/dispute';

interface Props {
  action: PlainLanguageAction;
  caseId: string;
}

export const CaseHeader: React.FC<Props> = ({ action, caseId }) => {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs uppercase tracking-wider text-teal-400 font-semibold">Case {caseId}</span>
          <h1 className="text-2xl font-bold mt-1 text-slate-100">{action.stageDescription}</h1>
        </div>
        <div className="text-right">
          <span className="inline-block bg-teal-900/60 text-teal-300 text-xs px-2.5 py-1 rounded-full border border-teal-700/50">
            {action.actionOwner === 'YOU' ? 'Action required from you' : 'Waiting on ' + action.actionOwner}
          </span>
          <div className="text-sm text-slate-400 mt-1.5 font-medium">{action.deadlineText}</div>
        </div>
      </div>
      <p className="mt-4 text-slate-300 text-sm leading-relaxed bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/40">
        {action.guidanceText}
      </p>
    </div>
  );
};
