import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_admin: boolean;
  approved: boolean;
  created_at: string;
  updated_at?: string;
  allowed_screens?: string[];
}

export const UsersDebugPanel = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

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
        title: "Erro",
        description: "Erro ao carregar usuários do banco",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Painel de Debug - Usuários do Banco
        </CardTitle>
        <CardDescription>
          Visualização de usuários registrados no sistema (somente perfis seguros).
        </CardDescription>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.full_name}</span>
                      {user.is_admin && (
                        <Badge variant="destructive">Admin</Badge>
                      )}
                      {user.approved ? (
                        <Badge variant="default">Aprovado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline">{user.role}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">ID:</span>
                    <p className="font-mono text-xs break-all">{user.id}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Telas Permitidas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.allowed_screens?.map((screen) => (
                        <Badge key={screen} variant="outline" className="text-xs">
                          {screen}
                        </Badge>
                      )) || <span className="text-muted-foreground text-xs">Nenhuma</span>}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Atualizado em:</span>
                    <p>{formatDate(user.updated_at)}</p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-muted-foreground">Criado em:</span>
                    <p>{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};