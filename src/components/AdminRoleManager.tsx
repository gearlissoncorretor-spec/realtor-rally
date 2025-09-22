import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  role: string;
  avatar_url?: string;
  approved: boolean;
  created_at: string;
}

export const AdminRoleManager = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, profile } = useAuth();

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAdminStatus = async (userId: string, isAdmin: boolean) => {
    if (userId === profile?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode alterar seu próprio status de administrador.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: isAdmin,
          role: isAdmin ? 'admin' : 'corretor'
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_admin: isAdmin, role: isAdmin ? 'admin' : 'corretor' }
            : user
        )
      );

      toast({
        title: "Status atualizado",
        description: `Usuário ${isAdmin ? 'promovido a' : 'removido de'} administrador com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível alterar o status do usuário.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Gerenciamento de Administradores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando usuários...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Gerencie quais usuários têm permissões de administrador no sistema.
            </div>
            
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.full_name}</h3>
                      {user.is_admin && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {!user.approved && (
                        <Badge variant="outline">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Cargo: {user.role} • Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`admin-${user.id}`}
                      checked={user.is_admin}
                      onCheckedChange={(checked) => updateAdminStatus(user.id, checked)}
                      disabled={saving === user.id || user.id === profile?.id}
                    />
                    <Label 
                      htmlFor={`admin-${user.id}`} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Administrador
                    </Label>
                    {saving === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-6 pt-4 border-t">
              <Button
                onClick={fetchUsers}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Atualizar Lista
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};