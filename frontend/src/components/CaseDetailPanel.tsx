import { useCasesStore } from '../store/casesStore';
import { 
  X, 
  Clock, 
  Gavel, 
  Calendar, 
  Scale,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { riskBand } from '../lib/risk';

export default function CaseDetailPanel() {
  const selectedCase = useCasesStore((s) => s.selectedCase);
  const selectCase = useCasesStore((s) => s.selectCase);
  const memos = useCasesStore((s) => s.memos);
  const fetchMemos = useCasesStore((s) => s.fetchMemos);
  useEffect(() => { if (selectedCase && memos.length === 0) fetchMemos(); }, [selectedCase, memos.length, fetchMemos]);

  useEffect(() => {
    if (selectedCase) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedCase]);

  if (!selectedCase) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-fade-in"
        onClick={() => selectCase(null)}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-surface h-full shadow-2xl animate-slide-left border-l border-outline-variant/10 overflow-y-auto">
        <div className="sticky top-0 bg-surface/90 backdrop-blur-md z-10 p-8 flex items-center justify-between border-b border-outline-variant/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-secondary-fixed rounded-sm shadow-lg">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-primary leading-none uppercase tracking-tight">Case Details</h2>
            </div>
          </div>
          <button 
            onClick={() => selectCase(null)}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-on-surface/40 group-hover:text-primary transition-colors" />
          </button>
        </div>

        <div className="p-10 space-y-12">
          {/* Header Stats */}
          <div className="flex items-start justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <span className="font-mono text-xs font-bold text-primary/30 uppercase tracking-widest">{selectedCase.case_id}</span>
                <h1 className="text-4xl font-serif font-bold text-primary leading-tight">Case No: {selectedCase.case_number}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container-neutral rounded-sm text-[10px] font-black uppercase tracking-widest text-[#00003c]/60">{selectedCase.case_type}</span>
                <span className={clsx(
                  "px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest ring-1 ring-inset",
                  selectedCase.adj_risk_score >= 80 ? "bg-red-50 text-red-600 ring-red-100" : "bg-primary text-secondary-fixed ring-primary/20"
                )}>
                  {riskBand(selectedCase.adj_risk_score)} risk · {selectedCase.adj_risk_score.toFixed(0)}
                </span>
                <span className="px-3 py-1 bg-secondary-container text-secondary rounded-sm text-[10px] font-black uppercase tracking-widest ring-1 ring-secondary/10">Priority: {selectedCase.priority_score.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Key Intelligence Grid - Expanded for the new schema */}
          <div className="grid grid-cols-2 gap-8 py-8 border-y border-outline-variant/10">
            <div className="space-y-1">
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-on-surface/30 flex items-center gap-2">
                <Gavel className="w-3.5 h-3.5" />
                Court & Bench
              </span>
              <p className="font-serif text-lg font-bold text-primary">{selectedCase.court_name_level || selectedCase.court_name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-on-surface/30 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Filing Date
              </span>
              <p className="font-serif text-lg font-bold text-primary">
                {new Date(selectedCase.filing_date).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-on-surface/30 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Jurisdiction
              </span>
              <p className="font-serif text-lg font-bold text-primary uppercase text-sm">
                {selectedCase.district}, {selectedCase.state}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-on-surface/30 flex items-center gap-2">
                <Scale className="w-3.5 h-3.5" />
                Resolution Status
              </span>
              <p className="font-serif text-lg font-bold text-primary">{selectedCase.status}</p>
            </div>
          </div>

          {/* Facts the scores are based on, and the memo if one was drafted */}
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="space-y-1 px-4 border-r border-outline-variant/10">
                <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#00003c]/30">Adjournments</span>
                <p className="text-xl font-serif font-black text-primary">{selectedCase.adjournments_count}</p>
              </div>
              <div className="space-y-1 px-4 border-r border-outline-variant/10">
                <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#00003c]/30">Case age</span>
                <p className="text-xl font-serif font-black text-primary">{(selectedCase.age_days / 365).toFixed(1)} yrs</p>
              </div>
              <div className="space-y-1 px-4">
                <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#00003c]/30">Next hearing</span>
                <p className="text-xl font-serif font-black text-primary">{selectedCase.next_hearing_date ? new Date(selectedCase.next_hearing_date).toLocaleDateString() : '—'}</p>
              </div>
            </div>
            <h3 className="font-serif text-2xl font-bold text-primary">Memo</h3>
            {(() => {
              const memo = memos.find((m) => m.case_internal_id === selectedCase.case_internal_id);
              return memo ? (
                <p className="judicial-card p-6 bg-surface-container-low border-none font-sans text-sm text-on-surface/70 leading-relaxed border-l-2 border-primary/20">{memo.memo_text}</p>
              ) : (
                <p className="text-sm text-on-surface/40 italic">No memo. Memos are drafted only when priority or risk is above 65.</p>
              );
            })()}
          </div>
          </div>
      </div>
    </div>
  );
}
