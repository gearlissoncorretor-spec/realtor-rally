// Pré-carregamento dos chunks de rota para navegação instantânea.
// Não altera nenhuma funcionalidade — apenas antecipa o download do JS.

const loaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Home"),
  "/vendas": () => import("@/pages/Vendas"),
  "/corretores": () => import("@/pages/Corretores"),
  "/equipes": () => import("@/pages/Equipes"),
  "/ranking": () => import("@/pages/Ranking"),
  "/metas": () => import("@/pages/Metas"),
  "/acompanhamento": () => import("@/pages/Acompanhamento"),
  "/relatorios": () => import("@/pages/Relatorios"),
  "/x1": () => import("@/pages/X1"),
  "/central-gestor": () => import("@/pages/CentralGestor"),
  "/dashboard-equipes": () => import("@/pages/DashboardEquipes"),
  "/atividades": () => import("@/pages/Atividades"),
  "/rotina": () => import("@/pages/Rotina"),
  "/negociacoes": () => import("@/pages/Negociacoes"),
  "/follow-up": () => import("@/pages/FollowUp"),
  "/leads": () => import("@/pages/Leads"),
  "/meta-gestao": () => import("@/pages/MetaGestao"),
  "/configuracoes": () => import("@/pages/Configuracoes"),
  "/agenda": () => import("@/pages/Agenda"),
  "/comissoes": () => import("@/pages/Comissoes"),
  "/financeiro": () => import("@/pages/Financeiro"),
  "/gestao-usuarios": () => import("@/pages/GestaoUsuarios"),
  "/gaming": () => import("@/pages/Gaming"),
  "/ajuda": () => import("@/pages/Ajuda"),
};

const done = new Set<string>();

export const prefetchRoute = (href: string) => {
  if (done.has(href)) return;
  const loader = loaders[href];
  if (!loader) return;
  done.add(href);
  loader().catch(() => done.delete(href));
};

// Aquece as rotas mais usadas quando o navegador estiver ocioso.
export const prefetchCommonRoutes = () => {
  const run = () => ["/vendas", "/negociacoes", "/follow-up", "/leads", "/ranking"].forEach(prefetchRoute);
  if (typeof window === "undefined") return;
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === "function") ric(run, { timeout: 4000 });
  else setTimeout(run, 2500);
};
