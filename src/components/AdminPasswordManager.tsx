import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Send, AlertTriangle, UserCog } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
}

const AdminPasswordManager = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_admin')
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

  const sendPasswordResetEmail = async (email: string, userId: string) => {
    setResetLoading(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: `Link de redefinição de senha enviado para ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o email de redefinição",
        variant: "destructive",
      });
    } finally {
      setResetLoading(null);
    }
  };

  const updatePasswordInDB = async (userId: string) => {
    const password = newPassword[userId];
    if (!password || password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(userId);
    try {
      // Usar Admin API para alterar senha diretamente
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: password
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Senha do usuário foi alterada com sucesso",
      });

      // Limpar o campo de senha
      setNewPassword(prev => ({ ...prev, [userId]: '' }));
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha",
        variant: "destructive",
      });
    } finally {
      setResetLoading(null);
    }
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
          <KeyRound className="h-5 w-5" />
          Gerenciar Senhas de Usuários
        </CardTitle>
        <CardDescription>
          Redefinir senhas de usuários via email ou alterar diretamente no banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Use a alteração direta no BD apenas em casos de emergência. 
            Recomenda-se sempre enviar o link de redefinição por email.
          </AlertDescription>
        </Alert>

        {users.map((user) => {
          const initials = user.full_name
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

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
                          <UserCog className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opção 1: Enviar email de redefinição */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Redefinição por Email (Recomendado)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendPasswordResetEmail(user.email, user.id)}
                    disabled={resetLoading === user.id}
                    className="w-full"
                  >
                    {resetLoading === user.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Enviar Link por Email
                  </Button>
                </div>

                {/* Opção 2: Alterar diretamente no BD */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alteração Direta no BD</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Nova senha (min. 6 chars)"
                      value={newPassword[user.id] || ''}
                      onChange={(e) => setNewPassword(prev => ({ 
                        ...prev, 
                        [user.id]: e.target.value 
                      }))}
                      disabled={resetLoading === user.id}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updatePasswordInDB(user.id)}
                      disabled={resetLoading === user.id || !newPassword[user.id]}
                    >
                      {resetLoading === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPasswordManager;