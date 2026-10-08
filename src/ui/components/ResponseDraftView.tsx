import React from 'react';

interface Props {
  draftText: string;
  onChange: (text: string) => void;
  onReview: () => void;
}

export const ResponseDraftView: React.FC<Props> = ({ draftText, onChange, onReview }) => {
  return (
    <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Factual Response Draft</h3>
        <p className="text-xs text-slate-400 mb-3">
          Built exclusively from verified files. Edit any sentence before submission.
        </p>
        <textarea
          value={draftText}
          onChange={e => onChange(e.target.value)}
          aria-label="Response draft"
          className="w-full h-40 bg-slate-950 text-slate-200 text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 leading-relaxed font-mono resize-none"
        />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
        <span className="text-[11px] text-slate-500">Dual mode: API Submit or Copy to Resolution Center</span>
        <button
          onClick={onReview}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-teal-950/40"
        >
          Review & Approve
        </button>
      </div>
    </div>
  );
};
