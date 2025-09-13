import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Shield, Save } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  allowed_screens: string[];
}

const AVAILABLE_SCREENS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'acompanhamento', label: 'Acompanhamento' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'corretores', label: 'Corretores' },
  { id: 'configuracoes', label: 'Configurações' },
];

const UserPermissionsManager = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (userId: string, allowedScreens: string[]) => {
    setSaving(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ allowed_screens: allowedScreens })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, allowed_screens: allowedScreens }
          : user
      ));

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

  const toggleScreenPermission = (userId: string, screenId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentScreens = user.allowed_screens || [];
    const updatedScreens = currentScreens.includes(screenId)
      ? currentScreens.filter(s => s !== screenId)
      : [...currentScreens, screenId];

    updateUserPermissions(userId, updatedScreens);
  };

  const toggleAllPermissions = (userId: string, grantAll: boolean) => {
    const updatedScreens = grantAll ? AVAILABLE_SCREENS.map(s => s.id) : [];
    updateUserPermissions(userId, updatedScreens);
  };

  if (!isAdmin()) {
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
          <Users className="h-5 w-5" />
          Gerenciar Permissões de Usuários
        </CardTitle>
        <CardDescription>
          Controle quais telas cada usuário pode acessar no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {users.map((user) => {
          const initials = user.full_name
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          const hasAllPermissions = AVAILABLE_SCREENS.every(screen => 
            user.allowed_screens?.includes(screen.id)
          );

          return (
            <div key={user.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.full_name}</span>
                      {user.is_admin && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllPermissions(user.id, !hasAllPermissions)}
                    disabled={saving === user.id}
                  >
                    {hasAllPermissions ? 'Remover Todas' : 'Conceder Todas'}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Telas Permitidas:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_SCREENS.map((screen) => {
                    const isChecked = user.allowed_screens?.includes(screen.id) ?? false;
                    return (
                      <div key={screen.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${user.id}-${screen.id}`}
                          checked={isChecked}
                          onCheckedChange={() => toggleScreenPermission(user.id, screen.id)}
                          disabled={saving === user.id}
                        />
                        <label
                          htmlFor={`${user.id}-${screen.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {screen.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {saving === user.id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando permissões...
                </div>
              )}
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPermissionsManager;