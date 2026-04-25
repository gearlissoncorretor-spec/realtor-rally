import { lazy, Suspense, Component, ErrorInfo, ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DynamicTitleUpdater } from "@/components/DynamicTitleUpdater";
import { LoadingFallback } from "@/components/LoadingFallback";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { AppUpdateManager } from "@/components/AppUpdateManager";
import { RealtimeSyncProvider } from "@/components/RealtimeSyncProvider";
import { OfflineProvider } from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import { GlobalStickyNotes } from "@/components/sticky-notes/GlobalStickyNotes";
import { OnboardingTour } from "@/components/OnboardingTour";
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import "./App.css";

// Lazy-loaded pages
const Home = lazy(() => import("@/pages/Home"));
// Index is now lazy-loaded within Home.tsx
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

const Atividades = lazy(() => import("@/pages/Atividades"));
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
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Landing = lazy(() => import("@/pages/Landing"));
const Edital = lazy(() => import("@/pages/Edital"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));


class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">Ops! Algo deu errado.</h1>
            <p className="text-muted-foreground">Ocorreu um erro inesperado que impediu o carregamento da página.</p>
            {this.state.error && (
              <pre className="mt-2 p-4 bg-muted rounded-lg text-xs text-left overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar Sistema
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
      <DynamicThemeProvider />
      <GlobalStickyNotes />
      <OnboardingTour />
      <Outlet />
    </DataProvider>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        <Routes location={location}>
          <Route path="/landing" element={<LazyPage><Landing /></LazyPage>} />
          <Route path="/auth" element={<LazyPage><Auth /></LazyPage>} />
          <Route path="/reset-password" element={<LazyPage><ResetPassword /></LazyPage>} />
          <Route path="/unsubscribe" element={<LazyPage><Unsubscribe /></LazyPage>} />
          <Route path="/onboarding" element={<ProtectedRoute allowWithoutCompany><LazyPage><Onboarding /></LazyPage></ProtectedRoute>} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<ProtectedRoute allowLanding><LazyPage><Home /></LazyPage></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><LazyPage><Vendas /></LazyPage></ProtectedRoute>} />
            <Route path="/corretores" element={<ProtectedRoute><LazyPage><Corretores /></LazyPage></ProtectedRoute>} />
            <Route path="/equipes" element={<ProtectedRoute><LazyPage><Equipes /></LazyPage></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><LazyPage><Ranking /></LazyPage></ProtectedRoute>} />
            <Route path="/metas" element={<ProtectedRoute><LazyPage><Metas /></LazyPage></ProtectedRoute>} />
            <Route path="/acompanhamento" element={<ProtectedRoute><LazyPage><Acompanhamento /></LazyPage></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><LazyPage><Relatorios /></LazyPage></ProtectedRoute>} />
            <Route path="/x1" element={<ProtectedRoute><LazyPage><X1 /></LazyPage></ProtectedRoute>} />
            <Route path="/central-gestor" element={<ProtectedRoute><LazyPage><CentralGestor /></LazyPage></ProtectedRoute>} />
            <Route path="/dashboard-equipes" element={<ProtectedRoute><LazyPage><DashboardEquipes /></LazyPage></ProtectedRoute>} />

            <Route path="/atividades" element={<ProtectedRoute><LazyPage><Atividades /></LazyPage></ProtectedRoute>} />
            <Route path="/negociacoes" element={<ProtectedRoute><LazyPage><Negociacoes /></LazyPage></ProtectedRoute>} />
            <Route path="/follow-up" element={<ProtectedRoute><LazyPage><FollowUp /></LazyPage></ProtectedRoute>} />
            <Route path="/meta-gestao" element={<ProtectedRoute><LazyPage><MetaGestao /></LazyPage></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><LazyPage><Configuracoes /></LazyPage></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><LazyPage><Agenda /></LazyPage></ProtectedRoute>} />
            <Route path="/comissoes" element={<ProtectedRoute><LazyPage><Comissoes /></LazyPage></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><LazyPage><Financeiro /></LazyPage></ProtectedRoute>} />
            <Route path="/instalar" element={<ProtectedRoute><LazyPage><Instalar /></LazyPage></ProtectedRoute>} />

            <Route path="/gestao-usuarios" element={<ProtectedRoute><LazyPage><GestaoUsuarios /></LazyPage></ProtectedRoute>} />
            <Route path="/super-admin" element={<ProtectedRoute superAdminOnly><LazyPage><SuperAdmin /></LazyPage></ProtectedRoute>} />
            <Route path="/edital" element={<ProtectedRoute><LazyPage><Edital /></LazyPage></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppShell = () => (
  <OfflineProvider>
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <DynamicTitleUpdater />
      <AnimatedRoutes />
    </Router>
  </OfflineProvider>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <Toaster />
          <AppUpdateManager />
          <InstallPrompt />
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);


export default App;
