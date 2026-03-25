import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RolePermission {
  id?: string;
  company_id?: string;
  role: string;
  screen: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const ALL_SCREENS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'central-gestor', label: 'Central do Gestor' },
  { value: 'dashboard-equipes', label: 'Dashboard Equipes' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'negociacoes', label: 'Negociações' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'metas', label: 'Metas' },
  { value: 'meta-gestao', label: 'Meta Gestão' },
  { value: 'atividades', label: 'Atividades' },
  { value: 'acompanhamento', label: 'Status Vendas' },
  { value: 'comissoes', label: 'Comissões' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'corretores', label: 'Corretores' },
  { value: 'equipes', label: 'Equipes' },
  { value: 'x1', label: 'X1' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'gestao-usuarios', label: 'Gestão de Usuários' },
  { value: 'configuracoes', label: 'Configurações' },
];

const CONFIGURABLE_ROLES = [
  { value: 'corretor', label: 'Corretor' },
  { value: 'gerente', label: 'Gerente' },
];

export { ALL_SCREENS, CONFIGURABLE_ROLES };

export function useRolePermissions() {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('company_id', profile.company_id);

      if (error) throw error;

      // Cast the data properly
      const mapped: RolePermission[] = (data || []).map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        role: row.role,
        screen: row.screen,
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
      }));

      setPermissions(mapped);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getPermission = (role: string, screen: string): RolePermission => {
    const found = permissions.find(p => p.role === role && p.screen === screen);
    return found || { role, screen, can_view: false, can_create: false, can_edit: false, can_delete: false };
  };

  const upsertPermission = async (perm: RolePermission) => {
    if (!profile?.company_id) return;

    const payload = {
      company_id: profile.company_id,
      role: perm.role,
      screen: perm.screen,
      can_view: perm.can_view,
      can_create: perm.can_create,
      can_edit: perm.can_edit,
      can_delete: perm.can_delete,
    };

    const existing = permissions.find(p => p.role === perm.role && p.screen === perm.screen);

    if (existing?.id) {
      const { error } = await supabase
        .from('role_permissions')
        .update(payload as any)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('role_permissions')
        .insert(payload as any);
      if (error) throw error;
    }

    await fetchPermissions();
  };

  return { permissions, loading, getPermission, upsertPermission, refetch: fetchPermissions };
}

export function usePendingUsersCount() {
  const [count, setCount] = useState(0);
  const { isAdmin, isDiretor, profile } = useAuth();

  useEffect(() => {
    if (!isAdmin() && !isDiretor()) return;
    if (!profile?.company_id) return;

    const fetchCount = async () => {
      const { count: pendingCount, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('approved', false)
        .eq('company_id', profile.company_id);

      if (!error && pendingCount !== null) {
        setCount(pendingCount);
      }
    };

    fetchCount();

    const channel = supabase
      .channel('pending-users-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, isDiretor, profile?.company_id]);

  return count;
}
