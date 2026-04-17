import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import UserFilters from '@/components/gestao-usuarios/UserFilters';
import UserCard, { type UserData } from '@/components/gestao-usuarios/UserCard';
import CreateUserDialog from '@/components/gestao-usuarios/CreateUserDialog';
import EditUserDialog from '@/components/gestao-usuarios/EditUserDialog';
import TransferTeamDialog from '@/components/gestao-usuarios/TransferTeamDialog';

const GestaoUsuarios = () => {
  const { user, profile, isAdmin, isDiretor, isGerente, isSocio } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [transferUser, setTransferUser] = useState<UserData | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserData | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canManage = isAdmin() || isDiretor() || isGerente();

  const fetchData = useCallback(async (keepLoadingState = false) => {
    if (!keepLoadingState) setLoading(true);

    try {
      const [profilesRes, rolesRes, teamsRes, brokersRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('teams').select('id, name').order('name'),
        supabase.from('brokers').select('id, user_id, name, email, phone, birthday, avatar_url, status, team_id'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (brokersRes.error) throw brokersRes.error;

      const rolesMap = new Map<string, string>();
      rolesRes.data?.forEach((role) => rolesMap.set(role.user_id, role.role));

      const teamsMap = new Map<string, string>();
      teamsRes.data?.forEach((team) => teamsMap.set(team.id, team.name));

      const brokerByUserId = new Map(
        (brokersRes.data || [])
          .filter((broker) => broker.user_id)
          .map((broker) => [broker.user_id as string, broker])
      );

      const mapped: UserData[] = (profilesRes.data || []).map((profileRow) => {
        const linkedBroker = brokerByUserId.get(profileRow.id);
        const role = rolesMap.get(profileRow.id) || 'corretor';
        const resolvedTeamId = linkedBroker?.team_id || profileRow.team_id || undefined;

        return {
          id: profileRow.id,
          full_name: linkedBroker?.name || profileRow.full_name,
          nickname: (profileRow as any).nickname || undefined,
          email: profileRow.email,
          phone: linkedBroker?.phone || (profileRow as any).phone || undefined,
          birth_date: linkedBroker?.birthday || (profileRow as any).birth_date || undefined,
          avatar_url: linkedBroker?.avatar_url || profileRow.avatar_url || undefined,
          status: linkedBroker?.status || (profileRow as any).status || 'ativo',
          approved: profileRow.approved ?? false,
          team_id: resolvedTeamId,
          team_name: resolvedTeamId ? teamsMap.get(resolvedTeamId) : undefined,
          role,
          created_at: profileRow.created_at || undefined,
          last_login_at: (profileRow as any).last_login_at || undefined,
          broker_id: linkedBroker?.id,
          broker_email: linkedBroker?.email || undefined,
        };
      });

      setUsers(mapped);
      setTeams(teamsRes.data || []);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err.message, variant: 'destructive' });
    } finally {
      if (!keepLoadingState) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`gestao-usuarios-sync-${user.id}`);
    const refresh = () => fetchData(true);

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brokers' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (isGerente() && profile?.team_id && u.team_id !== profile.team_id && u.id !== user?.id) return false;
      if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !(u.nickname?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (teamFilter === 'none' && u.team_id) return false;
      if (teamFilter !== 'all' && teamFilter !== 'none' && u.team_id !== teamFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, teamFilter, statusFilter, isGerente, profile, user]);

  const syncBrokerFields = async (userId: string, payload: { status?: string; team_id?: string | null }) => {
    const brokerPatch: Record<string, string | null> = {};

    if (payload.status !== undefined) brokerPatch.status = payload.status;
    if (payload.team_id !== undefined) brokerPatch.team_id = payload.team_id;

    if (Object.keys(brokerPatch).length === 0) return;

    const { error } = await supabase
      .from('brokers')
      .update(brokerPatch)
      .eq('user_id', userId);

    if (error) throw error;
  };

  const handleToggleStatus = async (u: UserData) => {
    const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus } as any)
        .eq('id', u.id);

      if (error) throw error;

      await syncBrokerFields(u.id, { status: newStatus });
      toast({ title: `Usuário ${newStatus === 'ativo' ? 'ativado' : 'inativado'}` });
      fetchData(true);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inativo' } as any)
        .eq('id', deleteUser.id);

      if (error) throw error;

      await syncBrokerFields(deleteUser.id, { status: 'inativo' });
      toast({ title: 'Usuário marcado como inativo', description: 'Dados históricos preservados.' });
      setDeleteOpen(false);
      fetchData(true);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;

    setResetLoading(true);
    const tempPass = generateTempPassword();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('Sessão expirada. Faça login novamente para resetar a senha.');
      }

      const functionHeaders = {
        Authorization: `Bearer ${accessToken}`,
      };

      const { error: resetError } = await supabase.functions.invoke('update-user-password', {
        body: { userId: resetUser.id, password: tempPass },
        headers: functionHeaders,
      });

      if (resetError) throw resetError;

      setGeneratedPassword(tempPass);
      setResetSuccess(true);
      setResetOpen(true);

      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-credentials', {
          body: {
            user_id: resetUser.id,
            email: resetUser.email,
            password: tempPass,
            full_name: resetUser.full_name,
            role: resetUser.role,
            is_password_reset: true,
          },
          headers: functionHeaders,
        });

        if (emailError) throw emailError;

        toast({
          title: 'Senha resetada com sucesso!',
          description: emailResult?.note || 'A senha temporária foi gerada e o email foi enviado.',
        });
      } catch (emailErr: any) {
        console.warn('Falha ao enviar email de credenciais:', emailErr);
        toast({
          title: 'Senha resetada com sucesso!',
          description: 'A senha temporária foi gerada, mas o email não pôde ser enviado automaticamente.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível resetar a senha.', variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;

    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseReset = () => {
    setResetOpen(false);
    setResetSuccess(false);
    setGeneratedPassword(null);
    setResetUser(null);
    setCopied(false);
  };

  const allowedRoles = isAdmin() || isSocio()
    ? ['admin', 'socio', 'diretor', 'gerente', 'corretor']
    : isDiretor()
      ? ['gerente', 'corretor']
      : isGerente()
        ? ['corretor']
        : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
                forcedTeamId={isGerente() && profile?.team_id ? profile.team_id : undefined}
              />
            )}
          </div>

          <UserFilters
            search={search}
            onSearchChange={setSearch}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            teamFilter={teamFilter}
            onTeamFilterChange={setTeamFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            teams={teams}
          />

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
              {filteredUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  isCurrentUser={u.id === user?.id}
                  canManage={canManage || (isGerente() && u.role === 'corretor')}
                  isAdmin={isAdmin()}
                  onEdit={(selectedUser) => { setEditUser(selectedUser); setEditOpen(true); }}
                  onResetPassword={(selectedUser) => { setResetUser(selectedUser); setResetOpen(true); }}
                  onToggleStatus={handleToggleStatus}
                  onDelete={(selectedUser) => { setDeleteUser(selectedUser); setDeleteOpen(true); }}
                  onTransferTeam={(selectedUser) => { setTransferUser(selectedUser); setTransferOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <EditUserDialog
        user={editUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        teams={teams}
        onSaved={() => fetchData(true)}
        allowedRoles={allowedRoles}
      />

      <TransferTeamDialog
        user={transferUser}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        teams={teams}
        onSaved={() => fetchData(true)}
      />

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

      <AlertDialog open={resetOpen} onOpenChange={(open) => { if (!open) handleCloseReset(); else setResetOpen(true); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetSuccess ? '✅ Senha Resetada com Sucesso' : 'Resetar Senha'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {resetSuccess && generatedPassword ? (
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                      A senha temporária de <strong className="text-foreground">{resetUser?.full_name}</strong> foi gerada.
                      O login deve ser feito com o email <strong className="text-foreground">{resetUser?.email}</strong> e, após entrar, o sistema exigirá a criação de uma nova senha.
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                      <code className="flex-1 text-lg font-mono font-bold text-foreground tracking-wider select-all">
                        {generatedPassword}
                      </code>
                      <Button variant="ghost" size="sm" onClick={handleCopyPassword} className="shrink-0">
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-warning/10 border border-warning/20 rounded-lg p-3 space-y-1">
                      <p><strong className="text-warning">⚠️ Importante:</strong> Esta senha será exibida apenas uma vez.</p>
                      <p>Use exatamente o email <strong className="text-foreground">{resetUser?.email}</strong> no login.</p>
                    </div>
                  </div>
                ) : (
                  <p>
                    Deseja resetar a senha de <strong>{resetUser?.full_name}</strong>? Uma nova senha temporária será gerada e o acesso deverá ser feito com o email <strong>{resetUser?.email}</strong>.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {resetSuccess ? (
              <AlertDialogAction onClick={handleCloseReset}>Fechar</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={resetLoading}>Cancelar</AlertDialogCancel>
                <Button type="button" onClick={handleResetPassword} disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {resetLoading ? 'Gerando...' : 'Resetar Senha'}
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoUsuarios;
