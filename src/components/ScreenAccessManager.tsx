import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Shield, Monitor, Eye, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  allowed_screens: string[];
  role?: string;
  team_id?: string;
}

interface Team {
  id: string;
  name: string;
}

const AVAILABLE_SCREENS = [
  { id: 'dashboard', label: 'Dashboard', description: 'Painel principal com métricas' },
  { id: 'ranking', label: 'Ranking', description: 'Ranking de corretores' },
  { id: 'vendas', label: 'Vendas', description: 'Gestão de vendas' },
  { id: 'acompanhamento', label: 'Status de Vendas', description: 'Kanban de acompanhamento' },
  { id: 'negociacoes', label: 'Negociações', description: 'Pipeline de negociações' },
  { id: 'follow-up', label: 'Follow-up', description: 'Acompanhamento de leads' },
  { id: 'metas', label: 'Metas', description: 'Gestão de metas' },
  { id: 'meta-gestao', label: 'Metas Gestão', description: 'Dashboard estratégico de metas' },
  { id: 'atividades', label: 'Atividades', description: 'Atividades dos corretores' },
  { id: 'tarefas-kanban', label: 'Tarefas Kanban', description: 'Gestão de tarefas' },
  { id: 'equipes', label: 'Equipes', description: 'Gestão de equipes' },
  { id: 'dashboard-equipes', label: 'Dashboard Equipes', description: 'Dashboard por equipes' },
  { id: 'corretores', label: 'Corretores', description: 'Cadastro de corretores' },
  { id: 'relatorios', label: 'Relatórios', description: 'Relatórios e análises' },
  { id: 'configuracoes', label: 'Configurações', description: 'Configurações do sistema' },
];

const ScreenAccessManager = () => {
  const { isAdmin, isDiretor } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (isAdmin() || isDiretor()) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, allowed_screens, team_id')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch roles
      const userIds = (profilesData || []).map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      // Fetch teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      const usersWithRoles = (profilesData || []).map(user => ({
        ...user,
        allowed_screens: user.allowed_screens || [],
        role: rolesMap.get(user.id) || 'corretor'
      }));

      setUsers(usersWithRoles);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleScreenPermission = (userId: string, screenId: string) => {
    const currentScreens = pendingChanges[userId] || users.find(u => u.id === userId)?.allowed_screens || [];
    const updatedScreens = currentScreens.includes(screenId)
      ? currentScreens.filter(s => s !== screenId)
      : [...currentScreens, screenId];

    setPendingChanges(prev => ({
      ...prev,
      [userId]: updatedScreens
    }));
  };

  const saveUserPermissions = async (userId: string) => {
    const allowedScreens = pendingChanges[userId];
    if (!allowedScreens) return;

    setSaving(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ allowed_screens: allowedScreens })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, allowed_screens: allowedScreens }
          : user
      ));

      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const toggleAllPermissions = (userId: string, grantAll: boolean) => {
    const updatedScreens = grantAll ? AVAILABLE_SCREENS.map(s => s.id) : [];
    setPendingChanges(prev => ({
      ...prev,
      [userId]: updatedScreens
    }));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'diretor': return 'Diretor';
      case 'gerente': return 'Gerente';
      case 'corretor': return 'Corretor';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'diretor': return 'default';
      case 'gerente': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isAdmin() && !isDiretor()) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Gerenciamento de Acesso às Telas
        </CardTitle>
        <CardDescription>
          Controle quais telas cada usuário pode acessar no sistema. 
          Usuários só visualizam no menu as telas liberadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Por Usuário
            </TabsTrigger>
            <TabsTrigger value="screens" className="gap-2">
              <Eye className="h-4 w-4" />
              Visão por Tela
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {users.map((user) => {
              const initials = user.full_name
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              const currentScreens = pendingChanges[user.id] || user.allowed_screens || [];
              const hasChanges = pendingChanges[user.id] !== undefined;
              const hasAllPermissions = AVAILABLE_SCREENS.every(screen =>
                currentScreens.includes(screen.id)
              );

              return (
                <div key={user.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{user.full_name}</span>
                          <Badge variant={getRoleBadgeVariant(user.role || 'corretor') as any}>
                            {getRoleLabel(user.role || 'corretor')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAllPermissions(user.id, !hasAllPermissions)}
                      >
                        {hasAllPermissions ? 'Remover Todas' : 'Conceder Todas'}
                      </Button>
                      {hasChanges && (
                        <Button
                          size="sm"
                          onClick={() => saveUserPermissions(user.id)}
                          disabled={saving === user.id}
                          className="gap-2"
                        >
                          {saving === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Salvar
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {AVAILABLE_SCREENS.map((screen) => {
                      const isChecked = currentScreens.includes(screen.id);
                      return (
                        <div
                          key={screen.id}
                          className={`flex items-start space-x-3 p-2 rounded-lg border transition-colors ${
                            isChecked ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                          }`}
                        >
                          <Checkbox
                            id={`${user.id}-${screen.id}`}
                            checked={isChecked}
                            onCheckedChange={() => toggleScreenPermission(user.id, screen.id)}
                            disabled={saving === user.id}
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`${user.id}-${screen.id}`}
                              className="text-sm font-medium cursor-pointer block truncate"
                            >
                              {screen.label}
                            </label>
                            <p className="text-xs text-muted-foreground truncate">
                              {screen.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="screens" className="space-y-4">
            <div className="grid gap-4">
              {AVAILABLE_SCREENS.map((screen) => {
                const usersWithAccess = users.filter(u =>
                  (pendingChanges[u.id] || u.allowed_screens || []).includes(screen.id)
                );

                return (
                  <div key={screen.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{screen.label}</h4>
                        <p className="text-sm text-muted-foreground">{screen.description}</p>
                      </div>
                      <Badge variant="secondary">
                        {usersWithAccess.length} usuário(s)
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {usersWithAccess.map(user => (
                        <Badge key={user.id} variant="outline" className="text-xs">
                          {user.full_name.split(' ')[0]}
                        </Badge>
                      ))}
                      {usersWithAccess.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          Nenhum usuário tem acesso
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScreenAccessManager;
