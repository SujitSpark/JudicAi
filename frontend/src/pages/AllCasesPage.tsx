import { useMemo, useState, useEffect } from 'react';
import { useCasesStore } from '../store/casesStore';
import { clsx } from 'clsx';
import { 
  Filter, 
  Download, 
  ChevronDown, 
  User,
  Gavel,
  X,
  SearchX
} from 'lucide-react';
import JudicialLoader from '../components/JudicialLoader';
import { toast } from 'sonner';

export default function AllCasesPage() {
  const { 
    cases, 
    searchQuery, 
    typeFilter, 
    statusFilter, 
    setTypeFilter,
    setStatusFilter,
    selectCase,
    resetFilters,
    fetchCases,
    isLoading
  } = useCasesStore();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Filter Logic
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = searchQuery === '' || 
        c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.district.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !typeFilter || c.case_type === typeFilter;
      const matchesStatus = !statusFilter || c.status === statusFilter;
      const matchesDistrict = !districtFilter || c.district === districtFilter;

      return matchesSearch && matchesType && matchesStatus && matchesDistrict;
    });
  }, [cases, searchQuery, typeFilter, statusFilter, districtFilter]);

  // Derived filter options
  const uniqueDistricts = useMemo(() => Array.from(new Set(cases.map(c => c.district))), [cases]);
  const uniqueTypes = useMemo(() => Array.from(new Set(cases.map(c => c.case_type))), [cases]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(cases.map(c => c.status))), [cases]);


  // Exports the cases currently shown (after filters) as CSV.
  const handleExport = () => {
    if (filteredCases.length === 0) return;
    const cols = ['case_id', 'case_number', 'case_type', 'status', 'filing_date', 'last_hearing_date', 'next_hearing_date', 'adjournments_count', 'age_days', 'priority_score', 'adj_risk_score', 'district', 'state'] as const;
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...filteredCases.map(c => cols.map(k => esc(c[k])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `judicai_cases_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredCases.length} cases`);
  };

  if (isLoading) return <JudicialLoader />;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">

      <div className="flex flex-col gap-6 border-b border-outline-variant/10 pb-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-5xl font-serif font-bold tracking-tight text-primary">All Cases</h1>
            <p className="text-on-surface/40 font-sans font-medium uppercase tracking-[0.2em] text-[10px] font-black">
              {filteredCases.length} of {cases.length} cases · click a row for details
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2 py-2"
            >
              <Download className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-surface-container-low/50 p-4 rounded-sm ring-1 ring-outline-variant/5">
          <div className="flex items-center gap-6">
            {/* Category Filter */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-sm transition-colors group",
                  typeFilter ? "bg-primary text-secondary-fixed" : "hover:bg-surface-container-neutral"
                )}
              >
                <Gavel className={clsx("w-3.5 h-3.5", typeFilter ? "text-secondary-fixed" : "text-on-surface/30 group-hover:text-primary")} />
                <span className={clsx("text-[10px] font-black uppercase tracking-widest", !typeFilter && "text-on-surface/60 group-hover:text-primary")}>
                  {typeFilter || 'Category'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-40" />
              </button>
              {activeDropdown === 'type' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-surface-container-lowest shadow-judicial-ambient ring-1 ring-outline-variant/10 rounded-sm z-50 p-2 animate-slide-up">
                  {uniqueTypes.map(type => (
                    <button 
                      key={type}
                      onClick={() => { setTypeFilter(type); setActiveDropdown(null); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low rounded-sm text-on-surface/70 hover:text-primary"
                    >
                      {type}
                    </button>
                  ))}
                  <button 
                    onClick={() => { setTypeFilter(null); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-sm mt-1 pt-2 border-t border-outline-variant/5"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-sm transition-colors group",
                  statusFilter ? "bg-primary text-secondary-fixed" : "hover:bg-surface-container-neutral"
                )}
              >
                <Filter className={clsx("w-3.5 h-3.5", statusFilter ? "text-secondary-fixed" : "text-on-surface/30 group-hover:text-primary")} />
                <span className={clsx("text-[10px] font-black uppercase tracking-widest", !statusFilter && "text-on-surface/60 group-hover:text-primary")}>
                  {statusFilter || 'Status'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-40" />
              </button>
              {activeDropdown === 'status' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-surface-container-lowest shadow-judicial-ambient ring-1 ring-outline-variant/10 rounded-sm z-50 p-2 animate-slide-up">
                  {uniqueStatuses.map(status => (
                    <button 
                      key={status}
                      onClick={() => { setStatusFilter(status); setActiveDropdown(null); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low rounded-sm text-on-surface/70 hover:text-primary"
                    >
                      {status}
                    </button>
                  ))}
                  <button 
                    onClick={() => { setStatusFilter(null); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-sm mt-1 pt-2 border-t border-outline-variant/5"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* District Filter */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'district' ? null : 'district')}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-sm transition-colors group",
                  districtFilter ? "bg-primary text-secondary-fixed" : "hover:bg-surface-container-neutral"
                )}
              >
                <User className={clsx("w-3.5 h-3.5", districtFilter ? "text-secondary-fixed" : "text-on-surface/30 group-hover:text-primary")} />
                <span className={clsx("text-[10px] font-black uppercase tracking-widest", !districtFilter && "text-on-surface/60 group-hover:text-primary")}>
                  {districtFilter || 'District'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-40" />
              </button>
              {activeDropdown === 'district' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-surface-container-lowest shadow-judicial-ambient ring-1 ring-outline-variant/10 rounded-sm z-50 p-2 animate-slide-up">
                  {uniqueDistricts.map(dist => (
                    <button 
                      key={dist}
                      onClick={() => { setDistrictFilter(dist); setActiveDropdown(null); }}
                      className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low rounded-sm text-on-surface/70 hover:text-primary"
                    >
                      {dist}
                    </button>
                  ))}
                  <button 
                    onClick={() => { setDistrictFilter(null); setActiveDropdown(null); }}
                    className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-sm mt-1 pt-2 border-t border-outline-variant/5"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            
          </div>

          {(searchQuery || typeFilter || statusFilter || districtFilter) && (
            <button 
              onClick={() => { resetFilters(); setDistrictFilter(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-container/30 hover:bg-secondary-container transition-colors rounded-sm group"
            >
              <X className="w-3.5 h-3.5 text-secondary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Clear filters</span>
            </button>
          )}

        </div>
      </div>

      <div className="judicial-card border-none bg-surface-container-lowest/30 backdrop-blur-sm overflow-hidden ring-1 ring-outline-variant/5 relative min-h-[400px]">
        {filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Ref No.</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Matter / Parties</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Filing Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Last Hearing</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] border-b border-outline-variant/10">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filteredCases.map((c) => (
                  <tr 
                    key={c.case_id} 
                    className={clsx(
                      "group transition-all duration-300 cursor-pointer border-l-2",
                      c.adj_risk_score >= 80 ? "border-red-600 bg-red-50/20 hover:bg-red-50/40" : "border-transparent hover:bg-surface-container-low"
                    )} 
                    onClick={() => selectCase(c.case_id)}
                  >
                    <td className="px-6 py-5 align-top">
                      <span className="font-mono text-[10px] font-bold text-on-surface/40 bg-surface-container-neutral px-1.5 py-0.5 rounded-sm">{c.case_id}</span>
                    </td>
                    <td className="px-6 py-5 align-top max-w-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-serif text-sm font-bold text-primary group-hover:text-secondary tracking-tight transition-colors">{c.case_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-[11px] font-sans font-bold text-on-surface/60">{c.case_type}</td>
                    <td className="px-6 py-5 align-top text-[11px] font-sans font-bold text-on-surface/50">{new Date(c.filing_date).toLocaleDateString()}</td>
                    <td className="px-6 py-5 align-top text-[11px] font-sans font-bold text-on-surface/50">
                      {c.last_hearing_date ? new Date(c.last_hearing_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5 align-top text-[11px] font-sans font-bold text-primary/70">{c.district}, {c.state}</td>
                    <td className="px-6 py-5 align-top">
                      <span className={clsx(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ring-1 ring-inset",
                        c.status?.toUpperCase() === 'PENDING' ? "bg-amber-50 text-amber-700 ring-amber-100" :
                        c.status?.toUpperCase() === 'ADJOURNED' ? "bg-red-50 text-red-700 ring-red-100" :
                        "bg-blue-50 text-blue-700 ring-blue-100"
                      )}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-fade-in">
            <div className="p-6 bg-surface-container-low rounded-full">
              <SearchX className="w-12 h-12 text-on-surface/20" />
            </div>
            <div className="text-center">
              <h3 className="font-serif text-xl font-bold text-primary">No Records Found</h3>
              <p className="text-on-surface/40 text-xs font-sans font-bold uppercase tracking-widest mt-2 px-12 max-w-md">No cases matching your current criteria are indexed in the central registry.</p>
            </div>
            <button 
              onClick={resetFilters}
              className="btn-primary mt-6 flex items-center gap-2"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
