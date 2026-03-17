import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOrganizationSettings } from './useOrganizationSettings';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/central-gestor': 'Central do Gestor',
  '/vendas': 'Vendas',
  '/ranking': 'Ranking',
  '/corretores': 'Corretores',
  '/equipes': 'Equipes',
  '/metas': 'Metas',
  '/meta-gestao': 'Meta Gestão',
  '/negociacoes': 'Negociações',
  '/follow-up': 'Follow-up / Clientes',
  '/atividades': 'Atividades',
  '/tarefas-kanban': 'Tarefas',
  '/acompanhamento': 'Status Vendas',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/dashboard-equipes': 'Dashboard Equipes',
  '/agenda': 'Agenda',
  '/gestao-usuarios': 'Gestão de Usuários',
  '/x1': 'X1',
  '/instalar': 'Instalar App',
  '/super-admin': 'Super Admin',
  '/auth': 'Login',
};

export const useDynamicTitle = () => {
  const location = useLocation();
  const { settings } = useOrganizationSettings();

  useEffect(() => {
    const orgName = settings?.organization_name || 'Gestão Master';
    const pageTitle = PAGE_TITLES[location.pathname] || 'Gestão Master';
    document.title = `${orgName} | ${pageTitle}`;
  }, [location.pathname, settings?.organization_name]);

  // Dynamic favicon from logo
  useEffect(() => {
    const logoUrl = settings?.logo_icon_url || settings?.logo_url;
    if (logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = logoUrl;
      link.type = 'image/png';
    }
  }, [settings?.logo_icon_url, settings?.logo_url]);
};
