import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Vendas from "@/pages/Vendas";
import Corretores from "@/pages/Corretores";
import Equipes from "@/pages/Equipes";
import Ranking from "@/pages/Ranking";
import Acompanhamento from "@/pages/Acompanhamento";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Metas from "@/pages/Metas";
import X1 from "@/pages/X1";
import DashboardEquipes from "@/pages/DashboardEquipes";
import TarefasKanban from "@/pages/TarefasKanban";
import Atividades from "@/pages/Atividades";
import Negociacoes from "@/pages/Negociacoes";
import MetaGestao from "@/pages/MetaGestao";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Router future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/vendas" element={
                <ProtectedRoute>
                  <Vendas />
                </ProtectedRoute>
              } />
              <Route path="/corretores" element={
                <ProtectedRoute>
                  <Corretores />
                </ProtectedRoute>
              } />
              <Route path="/equipes" element={
                <ProtectedRoute>
                  <Equipes />
                </ProtectedRoute>
              } />
              <Route path="/ranking" element={
                <ProtectedRoute>
                  <Ranking />
                </ProtectedRoute>
              } />
              <Route path="/metas" element={
                <ProtectedRoute>
                  <Metas />
                </ProtectedRoute>
              } />
              <Route path="/acompanhamento" element={
                <ProtectedRoute>
                  <Acompanhamento />
                </ProtectedRoute>
              } />
              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              } />
              <Route path="/x1" element={
                <ProtectedRoute>
                  <X1 />
                </ProtectedRoute>
              } />
              <Route path="/dashboard-equipes" element={
                <ProtectedRoute>
                  <DashboardEquipes />
                </ProtectedRoute>
              } />
              <Route path="/tarefas-kanban" element={
                <ProtectedRoute>
                  <TarefasKanban />
                </ProtectedRoute>
              } />
              <Route path="/atividades" element={
                <ProtectedRoute>
                  <Atividades />
                </ProtectedRoute>
              } />
              <Route path="/negociacoes" element={
                <ProtectedRoute>
                  <Negociacoes />
                </ProtectedRoute>
              } />
              <Route path="/meta-gestao" element={
                <ProtectedRoute>
                  <MetaGestao />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;