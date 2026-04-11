/**
 * Centralized role-based screen access configuration.
 * Used by ProtectedRoute and Navigation to avoid duplication.
 */
export const ROLE_SCREENS: Record<string, string[]> = {
  socio: ['*'],
  diretor: ['*'],
  admin: ['*'],
  super_admin: ['*'],
  gerente: [
    'dashboard', 'central-gestor', 'vendas', 'negociacoes', 'follow-up',
    'metas', 'meta-gestao', 'atividades', 'corretores', 'equipes',
    'ranking', 'acompanhamento', 'comissoes', 'relatorios',
    'x1', 'configuracoes', 'agenda', 'instalar', 'gestao-usuarios',
  ],
  corretor: [
    'dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas',
    'atividades', 'comissoes', 'configuracoes',
    'agenda', 'instalar',
  ],
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
  '/meta-gestao': 'meta-gestao',
  '/configuracoes': 'configuracoes',
  '/agenda': 'agenda',
  '/instalar': 'instalar',
  '/gestao-usuarios': 'gestao-usuarios',
  '/comissoes': 'comissoes',
};

/** Check if a role has access to a given screen */
export function roleHasScreenAccess(role: string, screen: string): boolean {
  const screens = ROLE_SCREENS[role] || [];
  return screens.includes('*') || screens.includes(screen);
}
