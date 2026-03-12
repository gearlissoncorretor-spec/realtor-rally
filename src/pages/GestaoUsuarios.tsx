import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import UserFilters from '@/components/gestao-usuarios/UserFilters';
import UserCard, { type UserData } from '@/components/gestao-usuarios/UserCard';
import CreateUserDialog from '@/components/gestao-usuarios/CreateUserDialog';
import EditUserDialog from '@/components/gestao-usuarios/EditUserDialog';
import TransferTeamDialog from '@/components/gestao-usuarios/TransferTeamDialog';

const GestaoUsuarios = () => {
  const { user, isAdmin, isDiretor, isGerente, getUserRole } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialogs
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [transferUser, setTransferUser] = useState<UserData | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserData | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const canManage = isAdmin() || isDiretor() || isGerente();
  const currentRole = getUserRole();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profiles, roles, and teams in parallel
      const [profilesRes, rolesRes, teamsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('teams').select('id, name').order('name'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const rolesMap = new Map<string, string>();
      rolesRes.data?.forEach(r => rolesMap.set(r.user_id, r.role));

      const teamsMap = new Map<string, string>();
      teamsRes.data?.forEach(t => teamsMap.set(t.id, t.name));

      const mapped: UserData[] = (profilesRes.data || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        nickname: (p as any).nickname || undefined,
        email: p.email,
        phone: (p as any).phone || undefined,
        birth_date: (p as any).birth_date || undefined,
        avatar_url: p.avatar_url || undefined,
        status: (p as any).status || 'ativo',
        approved: p.approved ?? false,
        team_id: p.team_id || undefined,
        team_name: p.team_id ? teamsMap.get(p.team_id) : undefined,
        role: rolesMap.get(p.id) || 'corretor',
        created_at: p.created_at || undefined,
        last_login_at: (p as any).last_login_at || undefined,
      }));

      setUsers(mapped);
      setTeams(teamsRes.data || []);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && 
          !(u.nickname?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (teamFilter === 'none' && u.team_id) return false;
      if (teamFilter !== 'all' && teamFilter !== 'none' && u.team_id !== teamFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, teamFilter, statusFilter]);

  const handleToggleStatus = async (u: UserData) => {
    const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus } as any)
        .eq('id', u.id);
      if (error) throw error;
      toast({ title: `Usuário ${newStatus === 'ativo' ? 'ativado' : 'inativado'}` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      // Just inactivate - don't actually delete to preserve historical data
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inativo' } as any)
        .eq('id', deleteUser.id);
      if (error) throw error;
      toast({ title: "Usuário marcado como inativo", description: "Dados históricos preservados." });
      setDeleteOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    try {
      const { error } = await supabase.functions.invoke('update-user-password', {
        body: { userId: resetUser.id, newPassword: generateTempPassword() }
      });
      if (error) throw error;
      toast({ title: "Senha resetada", description: "Uma nova senha temporária foi gerada." });
      setResetOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const allowedRoles = isAdmin() ? ['admin', 'diretor', 'gerente', 'corretor'] 
    : isDiretor() ? ['gerente', 'corretor'] 
    : isGerente() ? ['corretor'] 
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full text-center sm:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
                <Users className="h-7 w-7" /> Gestão de Usuários
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>
            {canManage && (
              <CreateUserDialog 
                teams={teams} 
                onCreated={fetchData} 
                allowedRoles={allowedRoles}
              />
            )}
          </div>

          {/* Filters */}
          <UserFilters
            search={search} onSearchChange={setSearch}
            roleFilter={roleFilter} onRoleFilterChange={setRoleFilter}
            teamFilter={teamFilter} onTeamFilterChange={setTeamFilter}
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            teams={teams}
          />

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  isCurrentUser={u.id === user?.id}
                  canManage={canManage || (isGerente() && u.role === 'corretor')}
                  isAdmin={isAdmin()}
                  onEdit={(u) => { setEditUser(u); setEditOpen(true); }}
                  onResetPassword={(u) => { setResetUser(u); setResetOpen(true); }}
                  onToggleStatus={handleToggleStatus}
                  onDelete={(u) => { setDeleteUser(u); setDeleteOpen(true); }}
                  onTransferTeam={(u) => { setTransferUser(u); setTransferOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditUserDialog 
        user={editUser} open={editOpen} onOpenChange={setEditOpen}
        teams={teams} onSaved={fetchData} allowedRoles={allowedRoles}
      />

      {/* Transfer Dialog */}
      <TransferTeamDialog
        user={transferUser} open={transferOpen} onOpenChange={setTransferOpen}
        teams={teams} onSaved={fetchData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário <strong>{deleteUser?.full_name}</strong> será marcado como inativo. 
              Dados históricos (negociações, metas, atividades) serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Inativar Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja resetar a senha de <strong>{resetUser?.full_name}</strong>? Uma nova senha temporária será gerada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>Resetar Senha</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoUsuarios;
