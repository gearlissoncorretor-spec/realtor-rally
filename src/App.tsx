import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRedirect from "@/components/RoleRedirect";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Relatorios from "./pages/Relatorios";
import Vendas from "./pages/Vendas";
import Ranking from "./pages/Ranking";
import Corretores from "./pages/Corretores";
import Configuracoes from "./pages/Configuracoes";
import Acompanhamento from "./pages/Acompanhamento";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RoleRedirect><Home /></RoleRedirect>} />
                <Route 
                  path="/auth" 
                  element={
                    <RoleRedirect>
                      <Auth />
                    </RoleRedirect>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute requiredScreen="dashboard">
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ranking" 
                  element={
                    <ProtectedRoute requiredScreen="ranking">
                      <Ranking />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/vendas" 
                  element={
                    <ProtectedRoute requiredScreen="vendas">
                      <Vendas />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/acompanhamento" 
                  element={
                    <ProtectedRoute requiredScreen="acompanhamento">
                      <Acompanhamento />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/relatorios" 
                  element={
                    <ProtectedRoute requiredScreen="relatorios">
                      <Relatorios />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/corretores" 
                  element={
                    <ProtectedRoute requiredScreen="corretores">
                      <Corretores />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/configuracoes" 
                  element={
                    <ProtectedRoute requiredScreen="configuracoes">
                      <Configuracoes />
                    </ProtectedRoute>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
