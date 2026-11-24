import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { apiGet, API_BASE, IS_DEMO } from '../lib/api';

export interface CourtCase {
  case_internal_id: number;
  case_id: string;
  case_number: string;
  filing_date: string;
  registration_date?: string;
  last_hearing_date?: string;
  next_hearing_date?: string;
  case_type: string;
  nature_of_case?: string;
  status: string;
  court_name: string;
  court_name_level?: string;
  district: string;
  state: string;
  petitioner_count: number;
  respondent_count: number;
  adjournments_count: number;
  age_days: number;
  priority_score: number;
  adj_risk_score: number;
  risk_level: string;
  escalation_level: number;
  assigned_user_id?: string;
}

interface CasesState {
  cases: CourtCase[];
  selectedCase: CourtCase | null;
  searchQuery: string;
  typeFilter: string | null;
  statusFilter: string | null;
  isLoading: boolean;
  error: string | null;
  kpis: {
    total_cases: number;
    high_risk_cases: number;
    avg_priority: number;
    memos_ready: number;
    trends: {
      total: string;
      risk: string;
      priority: string;
      memos: string;
    };
  } | null;
  insights: any[];
  preventionSuggestions: any[];
  topCriticalCase: CourtCase | null;
  memos: any[];
  schedules: any[];
  agentLogs: any[];
  
  fetchCases: () => Promise<void>;
  fetchKPIs: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchMemos: () => Promise<void>;
  fetchSchedules: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  runAnalysis: () => Promise<void>;
  selectCase: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  resetFilters: () => void;
}

export const useCasesStore = create<CasesState>((set, get) => ({

  cases: [],
  selectedCase: null,
  searchQuery: '',
  typeFilter: null,
  statusFilter: null,
  isLoading: false,
  error: null,
  kpis: null,
  insights: [],
  preventionSuggestions: [],
  topCriticalCase: null,
  memos: [],
  schedules: [],
  agentLogs: [],

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<CourtCase[]>('/cases?limit=1000');
      set({ cases: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchKPIs: async () => {
    try { set({ kpis: await apiGet('/dashboard/kpis') }); }
    catch (err) { console.error('Failed to fetch KPIs:', err); }
  },

  fetchInsights: async () => {
    try {
      const data = await apiGet('/dashboard/insights');
      set({
        insights: data.insights,
        preventionSuggestions: data.prevention_suggestions,
        topCriticalCase: data.top_critical_case,
      });
    } catch (err) { console.error('Failed to fetch insights:', err); }
  },

  fetchMemos: async () => {
    try { set({ memos: await apiGet('/cases/support/memos') }); }
    catch (err) { console.error('Failed to fetch memos:', err); }
  },

  fetchSchedules: async () => {
    try { set({ schedules: await apiGet('/cases/support/hearings') }); }
    catch (err) { console.error('Failed to fetch schedules:', err); }
  },

  fetchLogs: async () => {
    try { set({ agentLogs: await apiGet('/dashboard/logs') }); }
    catch (err) { console.error('Failed to fetch logs:', err); }
  },

  runAnalysis: async () => {
    if (IS_DEMO) return;
    set({ isLoading: true });
    try {
      const { accessToken } = useAuthStore.getState();
      const response = await fetch(`${API_BASE}/cases/run-full-analysis`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        await Promise.all([get().fetchCases(), get().fetchKPIs(), get().fetchInsights(), get().fetchLogs()]);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  selectCase: (id) => set((s) => ({ selectedCase: s.cases.find(c => c.case_id === id) || null })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  resetFilters: () => set({ searchQuery: '', typeFilter: null, statusFilter: null }),
}));
