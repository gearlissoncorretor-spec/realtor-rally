import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import "./App.css";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Vendas = lazy(() => import("@/pages/Vendas"));
const Corretores = lazy(() => import("@/pages/Corretores"));
const Equipes = lazy(() => import("@/pages/Equipes"));
const Ranking = lazy(() => import("@/pages/Ranking"));
const Acompanhamento = lazy(() => import("@/pages/Acompanhamento"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Metas = lazy(() => import("@/pages/Metas"));
const X1 = lazy(() => import("@/pages/X1"));
const DashboardEquipes = lazy(() => import("@/pages/DashboardEquipes"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
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
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
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
                <Route path="/configuracoes" element={
                  <ProtectedRoute>
                    <Configuracoes />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;