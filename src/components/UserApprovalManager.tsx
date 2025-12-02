import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  approved: boolean;
  created_at: string;
  avatar_url?: string;
  role?: string;
}

export const UserApprovalManager = () => {
  const { isAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin()) {
      fetchPendingUsers();
    }
  }, []);

  const fetchPendingUsers = async () => {
    try {
      // First fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, approved, created_at, avatar_url')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then fetch roles for these users
      const userIds = (profilesData || []).map(p => p.id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

      const usersWithRoles = (profilesData || []).map(user => ({
        ...user,
        role: rolesMap.get(user.id) || 'corretor'
      }));

      setPendingUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários pendentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approved,
          approved_by: approved ? (await supabase.auth.getUser()).data.user?.id : null,
          approved_at: approved ? new Date().toISOString() : null,
        })
        .eq('id', userId);

      if (error) throw error;

      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: approved ? "Usuário Aprovado" : "Usuário Rejeitado",
        description: `Usuário foi ${approved ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating user approval:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aprovação de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Aprovação de Usuários
        </CardTitle>
        <CardDescription>
          Gerencie as solicitações de novos usuários que aguardam aprovação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">Nenhum usuário pendente</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Não há usuários aguardando aprovação no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{user.role || 'corretor'}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Solicitado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleUserApproval(user.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUserApproval(user.id, false)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
