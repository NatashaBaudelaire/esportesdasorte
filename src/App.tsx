import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import BetSlipPanel from "@/components/BetSlipPanel";
import DrawerMenu from "@/components/DrawerMenu";
import HomePage from "@/pages/HomePage";
import LivePage from "@/pages/LivePage";
import SearchPage from "@/pages/SearchPage";
import ChatPage from "@/pages/ChatPage";
import WalletPage from "@/pages/WalletPage";
import ProfilePage from "@/pages/ProfilePage";
import AuthPage from "@/pages/AuthPage";
import EventDetailPage from "@/pages/EventDetailPage";
import BolaoPage from "@/pages/BolaoPage";
import PlansPage from "@/pages/PlansPage";
import SettingsPage from "@/pages/SettingsPage";
import CasinoPage from "@/pages/CasinoPage";
import CrashPage from "@/pages/CrashPage";
import EsportesPage from "@/pages/EsportesPage";
import BetHistoryPage from "@/pages/BetHistoryPage";
import PerformancePage from "@/pages/PerformancePage";
import ResponsibleGamingPage from "@/pages/ResponsibleGamingPage";
import PromotionsPage from "@/pages/PromotionsPage";
import NotFound from "./pages/NotFound.tsx";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import LibrasResourcesPage from "@/pages/LibrasResourcesPage";
import SupportPage from "@/pages/SupportPage";
import CompliancePage from "@/pages/CompliancePage";

const queryClient = new QueryClient();

const AppLayout = () => {
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isResetPage = location.pathname === '/reset-password';
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isAuthPage || isResetPage) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto pt-2">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ao-vivo" element={<LivePage />} />
          <Route path="/cassino" element={<CasinoPage />} />
          <Route path="/esportes" element={<EsportesPage />} />
          <Route path="/crash" element={<CrashPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/busca" element={<SearchPage />} />
          <Route path="/carteira" element={<WalletPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/evento/:id" element={<EventDetailPage />} />
          <Route path="/bolao" element={<BolaoPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/historico" element={<BetHistoryPage />} />
          <Route path="/desempenho" element={<PerformancePage />} />
          <Route path="/jogo-responsavel" element={<ResponsibleGamingPage />} />
          <Route path="/promocoes" element={<PromotionsPage />} />
          <Route path="/libras-resources" element={<LibrasResourcesPage />} />
          <Route path="/suporte" element={<SupportPage />} />
          <Route path="/conformidade" element={<CompliancePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav onBetSlipToggle={() => setBetSlipOpen(!betSlipOpen)} />
      <BetSlipPanel isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />
      <DrawerMenu isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
