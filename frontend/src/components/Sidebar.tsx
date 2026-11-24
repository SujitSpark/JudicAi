import { 
  LayoutDashboard, 
  ListFilter, 
  Calendar, 
  Upload, 
  Gavel, 
  BarChart3, 
  StickyNote 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import judicaiIcon from '../assets/judicai-icon.svg';
import { clsx } from 'clsx';
import { useAuthStore } from '../store/authStore';
import { IS_DEMO } from '../lib/api';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Gavel, label: "All Cases", path: "/all-cases" },
  { icon: ListFilter, label: "Priority Queue", path: "/priority-queue" },
  { icon: BarChart3, label: "Risk Analysis", path: "/risk-analysis" },
  { icon: Calendar, label: "Schedules", path: "/schedules" },
  { icon: StickyNote, label: "Memos & Escalations", path: "/memos-escalations" },
  { icon: Upload, label: "Upload Data", path: "/upload" },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  
  // Dynamic User UI
  const displayName = user?.fullName || (IS_DEMO ? 'Demo viewer' : 'Signed out');
  const displayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : (IS_DEMO ? 'Read-only' : '');
  
  // Better Initials: e.g. "Sujit Shiravle" -> "SS", "Registrar" -> "RE"
  const initials = user?.fullName 
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JA';


  return (
    <aside className="w-64 bg-surface-container-low h-screen flex flex-col p-6 overflow-hidden">
      <div className="flex items-center gap-[6px] mb-10 px-2">
        {/* Lockup: icon = 0.9 x wordmark size (20px -> 18px) */}
        <img src={judicaiIcon} alt="" className="w-[18px] h-[18px]" />
        <div className="flex flex-col">
          <span className="font-serif text-xl font-bold tracking-tight text-primary">JudicAI</span>
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-on-surface/50 font-black">Modern Magistrate</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-300",
              isActive 
                ? "bg-surface-container-highest shadow-sm text-primary ring-1 ring-outline-variant/10" 
                : "text-on-surface/60 hover:bg-surface-container-neutral hover:text-primary"
            )}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-sans text-sm font-medium tracking-tight whitespace-nowrap group-hover:text-primary transition-colors">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10 px-2 group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 overflow-hidden group-hover:border-primary/30 transition-all">
            <span className="text-xs font-bold text-primary opacity-80">{initials}</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary truncate leading-tight capitalize">{displayName}</span>
            <span className="text-[9px] text-on-surface/50 font-bold uppercase tracking-wider">{displayRole}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

