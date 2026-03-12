import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DynamicTitleUpdater } from "@/components/DynamicTitleUpdater";
import { LoadingFallback } from "@/components/LoadingFallback";
import { AppUpdateManager } from "@/components/AppUpdateManager";
import { RealtimeSyncProvider } from "@/components/RealtimeSyncProvider";
import "./App.css";

// Lazy-loaded pages
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
const TarefasKanban = lazy(() => import("@/pages/TarefasKanban"));
const Atividades = lazy(() => import("@/pages/TarefasKanban")); // Redirect to unified page
const Negociacoes = lazy(() => import("@/pages/Negociacoes"));
const MetaGestao = lazy(() => import("@/pages/MetaGestao"));
const FollowUp = lazy(() => import("@/pages/FollowUp"));
const Agenda = lazy(() => import("@/pages/Agenda"));
const Instalar = lazy(() => import("@/pages/Instalar"));
const GestaoUsuarios = lazy(() => import("@/pages/GestaoUsuarios"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const CentralGestor = lazy(() => import("@/pages/CentralGestor"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Comissoes = lazy(() => import("@/pages/Comissoes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);

// Only loads DataProvider when user is authenticated
const AuthenticatedLayout = () => {
  const { user } = useAuth();
  
  if (!user) return <Outlet />;
  
  return (
    <DataProvider>
      <RealtimeSyncProvider />
      <Outlet />
    </DataProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <Toaster />
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <DynamicTitleUpdater />
          <Routes>
            <Route path="/auth" element={<LazyPage><Auth /></LazyPage>} />
            <Route path="/reset-password" element={<LazyPage><ResetPassword /></LazyPage>} />
            <Route element={<AuthenticatedLayout />}>
              <Route path="/" element={
                <ProtectedRoute><LazyPage><Index /></LazyPage></ProtectedRoute>
              } />
              <Route path="/vendas" element={
                <ProtectedRoute><LazyPage><Vendas /></LazyPage></ProtectedRoute>
              } />
              <Route path="/corretores" element={
                <ProtectedRoute><LazyPage><Corretores /></LazyPage></ProtectedRoute>
              } />
              <Route path="/equipes" element={
                <ProtectedRoute><LazyPage><Equipes /></LazyPage></ProtectedRoute>
              } />
              <Route path="/ranking" element={
                <ProtectedRoute><LazyPage><Ranking /></LazyPage></ProtectedRoute>
              } />
              <Route path="/metas" element={
                <ProtectedRoute><LazyPage><Metas /></LazyPage></ProtectedRoute>
              } />
              <Route path="/acompanhamento" element={
                <ProtectedRoute><LazyPage><Acompanhamento /></LazyPage></ProtectedRoute>
              } />
              <Route path="/relatorios" element={
                <ProtectedRoute><LazyPage><Relatorios /></LazyPage></ProtectedRoute>
              } />
              <Route path="/x1" element={
                <ProtectedRoute><LazyPage><X1 /></LazyPage></ProtectedRoute>
              } />
              <Route path="/central-gestor" element={
                <ProtectedRoute><LazyPage><CentralGestor /></LazyPage></ProtectedRoute>
              } />
              <Route path="/dashboard-equipes" element={
                <ProtectedRoute><LazyPage><DashboardEquipes /></LazyPage></ProtectedRoute>
              } />
              <Route path="/tarefas-kanban" element={
                <ProtectedRoute><LazyPage><TarefasKanban /></LazyPage></ProtectedRoute>
              } />
              <Route path="/atividades" element={
                <ProtectedRoute><LazyPage><Atividades /></LazyPage></ProtectedRoute>
              } />
              <Route path="/negociacoes" element={
                <ProtectedRoute><LazyPage><Negociacoes /></LazyPage></ProtectedRoute>
              } />
              <Route path="/follow-up" element={
                <ProtectedRoute><LazyPage><FollowUp /></LazyPage></ProtectedRoute>
              } />
              <Route path="/meta-gestao" element={
                <ProtectedRoute><LazyPage><MetaGestao /></LazyPage></ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute><LazyPage><Configuracoes /></LazyPage></ProtectedRoute>
              } />
              <Route path="/agenda" element={
                <ProtectedRoute><LazyPage><Agenda /></LazyPage></ProtectedRoute>
              } />
              <Route path="/comissoes" element={
                <ProtectedRoute><LazyPage><Comissoes /></LazyPage></ProtectedRoute>
              } />
              <Route path="/instalar" element={
                <ProtectedRoute><LazyPage><Instalar /></LazyPage></ProtectedRoute>
              } />
              <Route path="/gestao-usuarios" element={
                <ProtectedRoute><LazyPage><GestaoUsuarios /></LazyPage></ProtectedRoute>
              } />
              <Route path="/super-admin" element={
                <ProtectedRoute superAdminOnly><LazyPage><SuperAdmin /></LazyPage></ProtectedRoute>
              } />
            </Route>
            <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
