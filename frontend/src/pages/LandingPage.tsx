import { useNavigate } from 'react-router-dom';
import { IS_DEMO } from '../lib/api';
import judicaiIcon from '../assets/judicai-icon.svg';

const REPO_URL = 'https://github.com/SujitSpark/JudicAi';

// Each step is a node in the LangGraph pipeline (backend/app/core/supervisor.py).
const STEPS = [
  { n: '01', title: 'Intake', body: 'Reads a CSV of case records, cleans and validates them, and works out case age.' },
  { n: '02', title: 'Priority', body: 'Weighted rule score (0-100) from case age, adjournments, case type and parties.' },
  { n: '03', title: 'Adjournment risk', body: 'Rule engine blended with an XGBoost model. Scores of 80 or more are flagged critical.' },
  { n: '04', title: 'Scheduling', body: 'A genetic algorithm (DEAP) assigns hearing slots, balancing judge load.' },
  { n: '05', title: 'Memos', body: 'Drafts a short listing memo for cases above 65 priority or risk, using Gemma 3 run locally through Ollama.' },
];

// From benchmarks/results.json: 1,200 synthetic cases, 10 train/test splits.
const RESULTS = [
  { label: 'Manual, oldest first', auc: '0.51', saved: '—' },
  { label: 'Priority agent', auc: '0.56', saved: '8.5%' },
  { label: 'Risk agent (rule engine)', auc: '0.60', saved: '9.4%' },
  { label: 'Supervised classifier (proposal, not shipped)', auc: '0.65', saved: '14.7%' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const openApp = () => navigate(IS_DEMO ? '/dashboard' : '/login');

  return (
    <div className="scroll-smooth bg-background text-on-surface font-body relative h-screen overflow-y-auto">
      <header className="fixed top-0 w-full z-50 bg-[#fcf9f4]/85 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(28,28,25,0.06)]">
        <nav className="flex justify-between items-center max-w-6xl mx-auto px-8 h-20">
          <div className="flex items-center gap-2 font-serif text-2xl font-bold text-[#00003c] tracking-tighter"><img src={judicaiIcon} alt="" className="w-[22px] h-[22px]" />JudicAI</div>
          <div className="hidden md:flex items-center space-x-10">
            <a className="font-serif text-lg text-[#1c1c19]/70 hover:text-[#00003c]" href="#how">How it works</a>
            <a className="font-serif text-lg text-[#1c1c19]/70 hover:text-[#00003c]" href="#results">Results</a>
            <a className="font-serif text-lg text-[#1c1c19]/70 hover:text-[#00003c]" href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <button onClick={openApp} className="bg-primary text-secondary-fixed px-6 py-2.5 rounded-sm font-semibold text-sm hover:opacity-90">
            {IS_DEMO ? 'Open demo' : 'Sign in'}
          </button>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-surface py-28 px-8">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block text-xs tracking-[0.2em] uppercase text-secondary font-bold mb-6">Hackathon prototype · built in 8 hours</span>
            <h1 className="font-headline text-5xl lg:text-7xl text-primary leading-tight mb-8 tracking-tighter">
              Which pending cases need attention first?
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed font-light">
              India has over 50 million pending court cases. JudicAI ranks a registry by priority and by the risk that the next
              hearing gets adjourned, suggests hearing slots, and drafts listing memos for the most urgent cases.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={openApp} className="bg-primary text-secondary-fixed px-8 py-4 rounded-sm font-bold text-lg hover:opacity-90 shadow-xl">
                {IS_DEMO ? 'Open the demo dashboard' : 'Open the dashboard'}
              </button>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="border border-outline-variant text-primary px-8 py-4 rounded-sm font-bold text-lg hover:bg-surface-container-low">
                View the code
              </a>
            </div>
            <p className="mt-8 text-sm text-on-surface/50">
              All data is synthetic: 100 generated cases, with no real court records.
            </p>
          </div>
        </section>

        {/* How it works: one section, one list */}
        <section id="how" className="py-24 bg-surface-container-low px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-headline text-4xl text-primary mb-4">How it works</h2>
            <p className="text-on-surface-variant text-lg mb-14 max-w-2xl">
              Five steps run in a fixed order as a LangGraph pipeline. Only the memo step uses a language model.
            </p>
            <ol className="grid md:grid-cols-5 gap-6">
              {STEPS.map((s) => (
                <li key={s.n} className="p-6 bg-surface-container-lowest rounded-sm shadow-sm">
                  <div className="font-mono text-sm text-secondary mb-3">{s.n}</div>
                  <h3 className="font-headline text-2xl text-primary mb-3">{s.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Results */}
        <section id="results" className="py-24 px-8 bg-surface">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-4xl text-primary mb-4">Benchmark</h2>
            <p className="text-on-surface-variant text-lg mb-10">
              How well each method finds cases whose next hearing will be adjourned, compared with sorting by age.
              Measured on 1,200 synthetic cases over 10 train/test splits. These numbers are not a claim about real courts.
            </p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 text-xs uppercase tracking-widest text-on-surface/50">
                  <th className="py-3">Ranking</th>
                  <th className="py-3 text-right">ROC-AUC</th>
                  <th className="py-3 text-right">Review effort saved</th>
                </tr>
              </thead>
              <tbody>
                {RESULTS.map((r) => (
                  <tr key={r.label} className="border-b border-outline-variant/10">
                    <td className="py-4 text-primary">{r.label}</td>
                    <td className="py-4 text-right font-mono">{r.auc}</td>
                    <td className="py-4 text-right font-mono">{r.saved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 text-sm text-on-surface/50">
              Review effort saved: how much less of the list a clerk reads, top-down, to catch 80% of the cases that stall.
              The benchmark also found and fixed target leakage in the risk model. Details are in <code>benchmarks/README.md</code>.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-[#f6f3ee] py-10 px-8 border-t border-outline-variant/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#1c1c19]/60">
          <span className="flex items-center gap-[6px] font-serif text-lg font-bold text-[#00003c]"><img src={judicaiIcon} alt="" className="w-4 h-4" />JudicAI</span>
          <span>Built by Sujit · MIT licence</span>
          <a className="underline hover:text-[#735c00]" href={REPO_URL} target="_blank" rel="noreferrer">github.com/SujitSpark/JudicAi</a>
        </div>
      </footer>
    </div>
  );
}
