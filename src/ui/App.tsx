import { useState, useEffect } from 'react';
import { MockPayPalClient } from '../paypal/mock-client';
import { deriveCaseReadiness } from '../domain/dispute-machine';
import { detectContradictions } from '../domain/contradiction';
import { assembleDraftResponse, generateApprovalDiff, ApprovalDiff } from '../domain/response-draft';
import { CaseHeader } from './components/CaseHeader';
import { ChecklistMatrix } from './components/ChecklistMatrix';
import { ApprovalModal } from './components/ApprovalModal';
import { GroundedFact, CaseReadiness } from '../types/dispute';

export function App() {
  const [client] = useState(() => new MockPayPalClient());
  const [caseId, setCaseId] = useState('PP-D-1001');
  const [readiness, setReadiness] = useState<CaseReadiness | null>(null);
  const [facts, setFacts] = useState<GroundedFact[]>([]);
  const [draftText, setDraftText] = useState('');
  const [activeDiff, setActiveDiff] = useState<ApprovalDiff | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  useEffect(() => {
    client.getDispute(caseId).then(data => {
      const initial = deriveCaseReadiness(data);
      setReadiness(initial);

      // Seed initial extracted facts from demo files
      const demoFacts: GroundedFact[] = [
        {
          id: 'f-order',
          tier: 'EXTRACTED_EVIDENCE',
          label: 'Order Date',
          value: 'October 1, 2026',
          sourceDocName: 'order-confirmation.txt',
          verbatimQuote: 'Date: October 1, 2026',
          verified: true
        },
        {
          id: 'f-tracking',
          tier: 'EXTRACTED_EVIDENCE',
          label: 'Carrier Scan',
          value: 'LABEL_CREATED (no delivery scan)',
          sourceDocName: 'tracking-label-only.txt',
          verbatimQuote: 'Status: Shipping Label Created, USPS Awaiting Item',
          verified: true
        },
        {
          id: 'f-merchant',
          tier: 'EXTRACTED_EVIDENCE',
          label: 'Merchant Delivery Claim',
          value: 'Delivered',
          sourceDocName: 'merchant-chat-promise.txt',
          verbatimQuote: 'The carrier lost the package. We will issue a full refund of $120',
          verified: true
        }
      ];
      setFacts(demoFacts);

      const draft = assembleDraftResponse(demoFacts);
      setDraftText(draft.text);
    });
  }, [caseId, client]);

  if (!readiness) return <div className="p-8 text-slate-400">Loading CaseReady companion...</div>;

  const alerts = detectContradictions(facts);

  const handleOpenApproval = () => {
    const diff = generateApprovalDiff(assembleDraftResponse(facts).text, draftText);
    setActiveDiff(diff);
  };

  const handleConfirmSubmit = async () => {
    if (!activeDiff) return;
    const editedText = activeDiff.edited;
    setActiveDiff(null);
    if (readiness?.nextAction?.apiAction === 'provide-evidence') {
      await client.provideEvidence(caseId, { notes: editedText });
      setSubmittedStatus('Evidence submitted to PayPal Disputes API. Case updated.');
    } else {
      await client.sendMessage(caseId, editedText);
      setSubmittedStatus('Message sent to seller via PayPal Disputes API. Case updated.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 max-w-4xl mx-auto font-sans">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <span className="text-teal-400 font-extrabold tracking-tight text-xl">CaseReady</span>
          <span className="text-slate-500 text-xs ml-2">PayPal AI Dispute Companion</span>
        </div>
        <select 
          value={caseId} 
          onChange={e => setCaseId(e.target.value)}
          className="bg-slate-900 text-xs text-slate-300 border border-slate-800 rounded-lg p-2"
        >
          <option value="PP-D-1001">Demo Case 1 (Inquiry - Buyer Action)</option>
          <option value="PP-D-1003">Demo Case 2 (Claim - Evidence Due)</option>
          <option value="PP-D-1004">Demo Case 3 (Resolved - Buyer Favor)</option>
        </select>
      </header>

      <CaseHeader action={readiness.nextAction} caseId={caseId} />

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ChecklistMatrix items={readiness.checklist} alerts={alerts} />

        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Factual Response Draft</h3>
            <p className="text-xs text-slate-400 mb-3">
              Built exclusively from verified files. Edit any sentence before submission.
            </p>
            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              className="w-full h-40 bg-slate-950 text-slate-200 text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-teal-500 leading-relaxed font-mono resize-none"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
            <span className="text-[11px] text-slate-500">Dual mode: API Submit or Copy to Resolution Center</span>
            <button
              onClick={handleOpenApproval}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-teal-950/40"
            >
              Review & Approve
            </button>
          </div>
        </div>
      </main>

      {submittedStatus && (
        <div className="mt-6 p-4 bg-emerald-950/60 border border-emerald-600/50 rounded-xl text-emerald-300 text-xs flex justify-between items-center">
          <span>✅ {submittedStatus}</span>
          <button onClick={() => setSubmittedStatus(null)} className="text-emerald-400 font-bold ml-4">✕</button>
        </div>
      )}

      {activeDiff && (
        <ApprovalModal 
          diff={activeDiff} 
          onConfirm={handleConfirmSubmit} 
          onCancel={() => setActiveDiff(null)} 
        />
      )}
    </div>
  );
}
