import { useState, useEffect } from 'react';
import { useCasesStore } from '../store/casesStore';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download,
  ShieldCheck
} from 'lucide-react';
import JudicialLoader from '../components/JudicialLoader';
import { clsx } from 'clsx';

export default function MemosEscalationsPage() {
  const { memos, fetchMemos, cases, fetchCases, isLoading, selectCase } = useCasesStore();
  const [activeTab, setActiveTab] = useState<'memos' | 'escalations'>('memos');

  useEffect(() => {
    fetchMemos();
    fetchCases();
  }, [fetchMemos, fetchCases]);

  const handleDownloadMemo = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Escalated = top escalation level from the Priority agent, or risk score 80+.
  const escalatedCases = cases.filter(c => c.escalation_level >= 3 || c.adj_risk_score >= 80);

  if (isLoading && memos.length === 0) {
    return <JudicialLoader />;
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-5xl font-serif font-bold tracking-tight text-primary">Memos & Escalations</h1>
            <p className="text-on-surface/40 font-sans font-medium uppercase tracking-[0.2em] text-[10px] font-black">
              Memos are drafted when priority or risk is above 65. Escalated: escalation level 3 or risk 80+.
            </p>
          </div>
          
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-sm w-fit ring-1 ring-outline-variant/5">
          <button 
            onClick={() => setActiveTab('memos')}
            className={clsx(
              "px-8 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'memos' ? "bg-surface-container-highest text-primary shadow-sm" : "text-on-surface/40 hover:text-primary"
            )}
          >
            Memos ({memos.length})
          </button>
          <button 
            onClick={() => setActiveTab('escalations')}
            className={clsx(
              "px-8 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'escalations' ? "bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100" : "text-on-surface/40 hover:text-red-500"
            )}
          >
            Escalations ({escalatedCases.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'memos' ? (
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-primary px-2">Drafted memos</h3>
            {memos.length === 0 ? (
              <div className="judicial-card p-12 text-center border-dashed border-2 border-outline-variant/20 bg-transparent">
                <p className="font-serif text-xl italic text-on-surface/30">No memos yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memos.map((memo) => (
                  <div key={memo.memo_id} className="judicial-card p-8 space-y-6 group hover:translate-y-[-4px] transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-surface-container-low flex items-center justify-center rounded-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface/30">Judicial Memo</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-serif text-xl font-bold text-primary group-hover:text-secondary-fixed transition-colors line-clamp-2">
                        {cases.find(c => c.case_internal_id === memo.case_internal_id)?.case_number || 'Unknown Record'}
                      </h4>
                      <p className="text-xs text-on-surface/60 line-clamp-3 italic font-serif leading-relaxed">
                        {memo.memo_text.length > 180 ? memo.memo_text.slice(0, 180) + '…' : memo.memo_text}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-sans font-bold text-on-surface/40 uppercase tracking-tight pt-2">
                        <Clock className="w-3 h-3" />
                        <span>Generated {new Date(memo.generated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-secondary-fixed" />
                        <span className="text-[10px] font-sans font-black text-on-surface/40 uppercase tracking-widest text-primary">Memo agent</span>
                      </div>
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDownloadMemo(`Judicial Memo\nCase: ${cases.find(c => c.case_internal_id === memo.case_internal_id)?.case_number || 'Unknown'}\nGenerated: ${new Date(memo.generated_at).toLocaleString()}\n\n${memo.memo_text}`, `Memo_${memo.memo_id.substring(0,6)}.txt`);
                         }}
                         className="p-2 hover:bg-surface-container-low rounded-full transition-colors group-hover:bg-primary/5">
                        <Download className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-serif text-2xl font-bold text-primary">Escalated cases</h3>
            </div>
            
            <div className="judicial-card border-none bg-surface-container-lowest/30 backdrop-blur-sm overflow-hidden ring-1 ring-red-100/30">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-red-50/50 border-b border-red-100/50">
                    <th className="px-8 py-5 text-[10px] font-black text-red-700/50 uppercase tracking-[0.2em] w-[140px]">Case ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-red-700/50 uppercase tracking-[0.2em]">Case and scores</th>
                    <th className="px-6 py-5 text-[10px] font-black text-red-700/50 uppercase tracking-[0.2em] w-[160px]">Status</th>
                    <th className="px-6 py-5 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100/20">
                  {escalatedCases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center italic font-serif text-on-surface/40">No critical escalations detected.</td>
                    </tr>
                  ) : (
                    escalatedCases.map((c) => (
                      <tr key={c.case_internal_id} onClick={() => selectCase(c.case_id)} className="group hover:bg-red-50/30 transition-all cursor-pointer">
                        <td className="px-8 py-6">
                          <span className="font-mono text-[11px] font-bold text-red-800/40 tracking-wider bg-red-100/50 px-2 py-1 rounded-sm uppercase">#{c.case_id}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-serif text-base font-bold text-primary group-hover:text-red-700 transition-colors line-clamp-1">{c.case_number}</span>
                            <span className="text-[10px] font-sans text-red-600/60 font-bold uppercase tracking-tight">
                              Priority: {c.priority_score.toFixed(0)} | Risk: {c.adj_risk_score.toFixed(0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-[10px] font-sans font-black uppercase text-red-600 tracking-widest">{c.adj_risk_score >= 80 ? 'Risk 80+' : `Level ${c.escalation_level}`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadMemo(`JudicAI escalation\nCase: ${c.case_number}\nID: ${c.case_id}\nPriority: ${c.priority_score.toFixed(0)}\nRisk: ${c.adj_risk_score.toFixed(0)}/100`, `Escalation_${c.case_id}.txt`);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-600 rounded-sm transition-all group/btn border border-red-200/50 hover:border-red-600 shadow-sm">
                            <Download className="w-3.5 h-3.5 text-red-500 group-hover/btn:text-white" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-600 group-hover/btn:text-red-50">Download .txt</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
