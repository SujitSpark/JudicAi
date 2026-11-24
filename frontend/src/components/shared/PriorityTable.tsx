import { clsx } from 'clsx';

interface Case {
  case_id: string;
  case_number: string;
  case_type: string;
  adj_risk_score: number;
  priority_score: number;
}

interface PriorityTableProps {
  cases: Case[];
  onSelectCase: (caseId: string) => void;
  limit?: number;
}

export default function PriorityTable({ cases, onSelectCase, limit = 5 }: PriorityTableProps) {
  const displayCases = cases.slice(0, limit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-sans">
        <thead>
          <tr className="border-b border-outline-variant/10 text-[10px] uppercase font-black tracking-widest text-on-surface/30">
            <th className="pb-4 pt-2 px-1">Case ID</th>
            <th className="pb-4 pt-2">Case Title</th>
            <th className="pb-4 pt-2">Category</th>
            <th className="pb-4 pt-2 text-right">Priority</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {displayCases.map((c) => (
            <tr 
              key={c.case_id} 
              className="group hover:bg-surface-container-low transition-colors cursor-pointer" 
              onClick={() => onSelectCase(c.case_id)}
            >
              <td className="py-4 px-1 text-xs font-mono text-on-surface/40 group-hover:text-primary">#{c.case_id}</td>
              <td className="py-4 font-serif text-sm font-bold text-primary">{c.case_number}</td>
              <td className="py-4">
                <span className="text-[10px] uppercase font-bold tracking-tight text-on-surface/60 px-2 py-1 bg-surface-container-neutral rounded-sm">
                  {c.case_type}
                </span>
              </td>
              <td className="py-4 flex items-center justify-end gap-3">
                <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden hidden md:block">
                  <div 
                    className={clsx(
                      "h-full transition-all duration-1000", 
                      c.priority_score >= 80 ? "bg-red-600" : c.priority_score > 60 ? "bg-yellow-500" : "bg-green-500"
                    )} 
                    style={{ width: `${Math.min(c.priority_score, 100)}%` }} 
                  />
                </div>
                <span className="font-mono text-sm font-bold text-primary w-8">{c.priority_score.toFixed(0)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {cases.length === 0 && (
        <div className="py-12 text-center italic text-on-surface/30 text-sm font-serif">
          No cases matching priority criteria.
        </div>
      )}
    </div>
  );
}
