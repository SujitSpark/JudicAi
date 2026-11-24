import { useEffect, useMemo, useState } from 'react';
import { riskBand, benchLabel } from '../lib/risk';
import { useCasesStore } from '../store/casesStore';
import { clsx } from 'clsx';
import { X, Download } from 'lucide-react';

export default function PriorityPage() {
  const allCases = useCasesStore((s) => s.cases);
  const fetchCases = useCasesStore((s) => s.fetchCases);
  useEffect(() => { if (allCases.length === 0) fetchCases(); }, [allCases.length, fetchCases]);
  // Ranked by the Priority agent's score, highest first.
  const cases = useMemo(() => [...allCases].sort((a, b) => b.priority_score - a.priority_score), [allCases]);
  const selectCase = useCasesStore((s) => s.selectCase);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cases.map(c => c.case_id));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      <div className="flex items-end justify-between border-b border-outline-variant/10 pb-8">
        <div className="space-y-1">
          <h1 className="text-5xl font-serif font-bold tracking-tight text-primary">Priority Queue</h1>
          <p className="text-on-surface/40 font-sans font-medium uppercase tracking-[0.2em] text-[10px] font-black">
            All cases ranked by priority score (0-100), highest first
          </p>
        </div>
        
      </div>

      <div className="judicial-card border-none bg-surface-container-lowest/50 backdrop-blur-sm overflow-hidden ring-1 ring-outline-variant/5">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-surface-container-low/50 border-b border-outline-variant/10">
            <tr>
              <th className="px-6 py-4 w-[60px] text-center border-b border-outline-variant/10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === cases.length && cases.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-primary rounded-sm cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] w-[140px] border-b border-outline-variant/10">Case ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Petitioner / Matter</th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] w-[120px] border-b border-outline-variant/10">Case Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] w-[160px] border-b border-outline-variant/10">Bench</th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] w-[100px] text-center border-b border-outline-variant/10">Priority</th>
              <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] w-[120px] text-center border-b border-outline-variant/10">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {cases.map((c) => (
              <tr 
                key={c.case_id} 
                className={clsx(
                  "group transition-all duration-300 hover:bg-surface-container-low/80 cursor-pointer border-l-2",
                  selectedIds.includes(c.case_id) ? "bg-secondary-container/10" : 
                  c.adj_risk_score >= 80 ? "border-red-600 bg-red-50/20" : "border-transparent"
                )}
                onClick={() => selectCase(c.case_id)}
              >
                <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(c.case_id)}
                    onChange={() => toggleSelect(c.case_id)}
                    className="w-4 h-4 accent-primary rounded-sm cursor-pointer"
                  />
                </td>
                <td className="px-6 py-5">
                  <span className="font-mono text-[11px] font-bold text-primary/50 tracking-wider bg-surface-container-neutral/50 px-2 py-1 rounded-sm uppercase">{c.case_id}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="font-serif text-[15px] font-bold text-primary group-hover:text-secondary tracking-tight transition-colors">{c.case_number}</span>
                    <span className="text-[10px] font-sans text-on-surface/40 font-bold uppercase tracking-tight">Filed: {new Date(c.filing_date).toLocaleDateString()} • Adjournments: {c.adjournments_count}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-sans font-black uppercase text-on-surface/60 bg-surface-container-low px-2 py-1 rounded-sm">{c.case_type}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[11px] font-sans font-bold text-primary/70">{benchLabel(c.assigned_user_id)}</span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="font-mono text-[13px] font-bold text-primary">{c.priority_score.toFixed(0)}</span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={clsx(
                    "text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-sm border",
                    c.adj_risk_score >= 80 ? "bg-red-50 text-red-600 border-red-100" :
                    c.adj_risk_score >= 60 ? "bg-secondary-container text-secondary border-secondary/20" :
                    "bg-surface-container-neutral text-on-surface/50 border-outline-variant/10"
                  )}>
                    {riskBand(c.adj_risk_score)} · {c.adj_risk_score.toFixed(0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-4 rounded-sm shadow-2xl flex items-center gap-8 animate-slide-up z-50 ring-1 ring-white/10">
          <div className="flex items-center gap-3 border-r border-white/10 pr-8">
            <div className="w-6 h-6 bg-secondary-fixed text-primary rounded-full flex items-center justify-center text-[10px] font-black">
              {selectedIds.length}
            </div>
            <span className="text-[11px] font-sans font-black uppercase tracking-widest text-white/80">Cases Selected</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                const selectedCases = cases.filter(c => selectedIds.includes(c.case_id));
                if (selectedCases.length === 0) return;
                const header = Object.keys(selectedCases[0]).join(',') + '\n';
                const csvData = selectedCases.map(c => Object.values(c).join(',')).join('\n');
                const blob = new Blob([header + csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `priority_export_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 hover:text-secondary-fixed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] font-sans font-black uppercase tracking-widest">Batch Export</span>
            </button>
          </div>

          <button 
            onClick={() => setSelectedIds([])}
            className="ml-4 hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
