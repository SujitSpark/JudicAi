import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import CaseDetailPanel from "./components/CaseDetailPanel";
import { Toaster } from "sonner";
import DashboardPage from "./pages/DashboardPage";
import PriorityPage from "./pages/PriorityPage";
import LoginPage from "./pages/LoginPage";
import AllCasesPage from "./pages/AllCasesPage";
import RiskAnalysisPage from "./pages/RiskAnalysisPage";
import SchedulesPage from "./pages/SchedulesPage";
import MemosEscalationsPage from "./pages/MemosEscalationsPage";
import UploadPage from "./pages/UploadPage";
import LandingPage from "./pages/LandingPage";
import DemoBanner from "./components/DemoBanner";

function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DemoBanner />
        <Navbar />
        <main className="flex-1 overflow-y-auto px-12 py-10 selection:bg-secondary-container selection:text-secondary transition-all">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/all-cases" element={<AllCasesPage />} />
            <Route path="/priority-queue" element={<PriorityPage />} />
            <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/memos-escalations" element={<MemosEscalationsPage />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </main>
      </div>
      <CaseDetailPanel />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" expand={false} richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <AppLayout />
        } />
      </Routes>
    </BrowserRouter>
  );
}
