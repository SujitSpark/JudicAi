import { useEffect, useState } from 'react';
import { IS_DEMO } from '../lib/api';

// Shown on every app page in demo builds so nobody mistakes the snapshot for live court data.
export default function DemoBanner() {
  const [exportedAt, setExportedAt] = useState<string | null>(null);
  useEffect(() => {
    if (!IS_DEMO) return;
    fetch(`${import.meta.env.BASE_URL}demo/meta.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => m && setExportedAt(m.exported_at.slice(0, 10)))
      .catch(() => {});
  }, []);
  if (!IS_DEMO) return null;
  return (
    <div className="bg-secondary-container text-on-secondary-container text-xs font-sans px-6 py-2 text-center">
      <strong>Demo:</strong> a read-only snapshot of the JudicAI pipeline run on 100 <strong>synthetic</strong> cases
      {exportedAt ? ` (exported ${exportedAt})` : ''}. No real court data. Memos come from the fallback template, not the LLM.
    </div>
  );
}
