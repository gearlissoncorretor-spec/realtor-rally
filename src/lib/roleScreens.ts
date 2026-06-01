/**
 * Centralized role-based screen access configuration.
 * Used by ProtectedRoute and Navigation to avoid duplication.
 *
 * Hierarchy: super_admin > admin > sócio > diretor > gerente > corretor
 * Each higher role inherits everything below + extras.
 */

// Corretor: own pipeline + dia-a-dia
const CORRETOR_SCREENS = [
  'dashboard', 'vendas', 'negociacoes', 'follow-up', 'leads', 'metas',
  'atividades', 'comissoes', 'financeiro', 'configuracoes',
  'agenda', 'instalar', 'edital',
];

// Gerente: tudo do corretor + visão de equipe (sem gestão de usuários nem relatórios estratégicos)
const GERENTE_SCREENS = [
  ...CORRETOR_SCREENS,
  'dashboard-equipes', 'equipes', 'corretores', 'ranking',
  'acompanhamento', 'x1', 'meta-gestao',
];

// Diretor: tudo do gerente + relatórios estratégicos + central gestor
const DIRETOR_SCREENS = [
  ...GERENTE_SCREENS,
  'central-gestor', 'relatorios',
];

// Sócio: tudo do diretor + gestão de usuários
const SOCIO_SCREENS = [
  ...DIRETOR_SCREENS,
  'gestao-usuarios',
];

export const ROLE_SCREENS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: ['*'],
  socio: SOCIO_SCREENS,
  diretor: DIRETOR_SCREENS,
  gerente: GERENTE_SCREENS,
  corretor: CORRETOR_SCREENS,
};

export const PATH_TO_SCREEN: Record<string, string> = {
  '/': 'dashboard',
  '/vendas': 'vendas',
  '/corretores': 'corretores',
  '/equipes': 'equipes',
  '/ranking': 'ranking',
  '/metas': 'metas',
  '/acompanhamento': 'acompanhamento',
  '/relatorios': 'relatorios',
  '/x1': 'x1',
  '/dashboard-equipes': 'dashboard-equipes',
  '/central-gestor': 'central-gestor',
  '/atividades': 'atividades',
  '/negociacoes': 'negociacoes',
  '/follow-up': 'follow-up',
  '/leads': 'leads',
  '/meta-gestao': 'meta-gestao',
  '/configuracoes': 'configuracoes',
  '/agenda': 'agenda',
  '/instalar': 'instalar',
  '/gestao-usuarios': 'gestao-usuarios',
  '/comissoes': 'comissoes',
  '/financeiro': 'financeiro',
  '/edital': 'edital',
};

/** Check if a role has access to a given screen */
export function roleHasScreenAccess(role: string, screen: string): boolean {
  const screens = ROLE_SCREENS[role] || [];
  return screens.includes('*') || screens.includes(screen);
}
