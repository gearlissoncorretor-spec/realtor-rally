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
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

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
              <Route path="/configuracoes" element={
                <ProtectedRoute adminOnly>
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