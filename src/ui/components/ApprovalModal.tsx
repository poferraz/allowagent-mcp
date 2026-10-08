import React from 'react';
import { ApprovalDiff } from '../../domain/response-draft';

interface Props {
  diff: ApprovalDiff;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApprovalModal: React.FC<Props> = ({ diff, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-lg w-full text-slate-200 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-100">Review & Approve Response</h3>
        <p className="text-xs text-slate-400 mt-1">
          CaseReady never submits anything automatically. Verify the exact message to be sent to PayPal.
        </p>
        <div className="mt-4 p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
          {diff.edited}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            Back to Edit
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-xs rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-white shadow-lg shadow-teal-900/40">
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
};
