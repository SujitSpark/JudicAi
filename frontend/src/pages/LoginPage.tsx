import { Navigate, useNavigate } from 'react-router-dom';
import { API_BASE, IS_DEMO } from '../lib/api';
import judicaiIcon from '../assets/judicai-icon.svg';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (IS_DEMO) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      setAuth({ 
        username: email, 
        fullName: data.full_name, 
        role: data.role 
      }, data.access_token);
      toast.success(`Welcome back, ${data.full_name}`);
      navigate('/dashboard');

    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="judicial-bg font-body text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Login Container */}
      <main className="w-full max-w-[480px] flex flex-col items-center relative z-10 animate-fade-in">
        {/* Brand Identity */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <img src={judicaiIcon} alt="" className="w-16 h-16 shadow-xl rounded-[14px]" />
          </div>
          <h1 className="font-serif text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-md">JudicAI</h1>
          <p className="font-sans text-xs uppercase tracking-[0.4em] text-secondary-fixed font-semibold opacity-90">Judicial Intelligence System</p>
        </div>

        {/* Login Card */}
        <div className="w-full magistrate-card p-12 rounded-lg relative overflow-hidden">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5">
            <span className="material-symbols-outlined text-8xl absolute -top-4 -right-4">balance</span>
          </div>

          <form className="space-y-10" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-3 group">
              <label className="block font-serif text-sm italic font-semibold text-primary/80 group-focus-within:text-secondary transition-colors" htmlFor="email">
                Official Identification Email
              </label>
              <div className="relative">
                <input 
                  className="magistrate-input w-full" 
                  id="email" 
                  name="email" 
                  placeholder="registrar@justice.gov" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3 group">
              <div className="flex justify-between items-end">
                <label className="block font-serif text-sm italic font-semibold text-primary/80 group-focus-within:text-secondary transition-colors" htmlFor="password">
                  Security Credentials
                </label>
              </div>
              <div className="relative">
                <input 
                  className="magistrate-input w-full" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" type="button">
                  <span className="material-symbols-outlined text-xl">visibility</span>
                </button>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-6 space-y-8">
              <button 
                className="w-full bg-primary py-5 text-secondary-fixed font-serif text-xl font-bold rounded-sm shadow-xl hover:bg-[#000050] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group gold-leaf-hover border border-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Access Chambers'}
                {!isLoading && <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">shield_person</span>}
              </button>

              
              <div className="flex justify-center">
                <a className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant/70 hover:text-secondary transition-colors underline decoration-outline-variant/30 underline-offset-8" href="#">
                  Forgotten Access Keys
                </a>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Meta */}
        <footer className="mt-14 text-center space-y-6">
          <div className="flex items-center justify-center gap-8 text-white/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">encrypted</span>
              <span className="font-sans text-[10px] uppercase tracking-wider">End-to-End Encryption</span>
            </div>
            <div className="w-px h-3 bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">public</span>
              <span className="font-sans text-[10px] uppercase tracking-wider">Global Jurisdiction</span>
            </div>
          </div>
          <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-white/50">
            Prevention-first design • Powered by Local AI • Secure
          </p>
        </footer>
      </main>

      {/* Subtle Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
}
