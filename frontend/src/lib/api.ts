import { useAuthStore } from '../store/authStore';

// Demo mode serves a static snapshot of the pipeline's output (synthetic data),
// so the frontend can be hosted without the FastAPI backend.
export const IS_DEMO = import.meta.env.VITE_DEMO === 'true';
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

const DEMO_FILES: Record<string, string> = {
  '/cases': 'cases',
  '/dashboard/kpis': 'kpis',
  '/dashboard/insights': 'insights',
  '/cases/support/memos': 'memos',
  '/cases/support/hearings': 'hearings',
  '/dashboard/logs': 'logs',
};

export async function apiGet<T = any>(path: string): Promise<T> {
  if (IS_DEMO) {
    const file = DEMO_FILES[path.split('?')[0]];
    if (!file) throw new Error(`Not available in demo: ${path}`);
    const res = await fetch(`${import.meta.env.BASE_URL}demo/${file}.json`);
    if (!res.ok) throw new Error(`Demo data missing: ${file}`);
    return res.json();
  }
  const { accessToken } = useAuthStore.getState();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json();
}
