import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Ranking from "./pages/Ranking";
import Vendas from "./pages/Vendas";
import Relatorios from "./pages/Relatorios";
import Corretores from "./pages/Corretores";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/corretores" element={<Corretores />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
