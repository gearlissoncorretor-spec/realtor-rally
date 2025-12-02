import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  allowed_screens: string[];
  role?: string;
}

interface PendingApprovalsProps {
  onApprovalChange: () => void;
}

export const PendingApprovals = ({ onApprovalChange }: PendingApprovalsProps) => {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, allowed_screens')
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for these users
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
        title: "Erro ao carregar aprovações pendentes",
        description: "Não foi possível carregar os usuários pendentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      setProcessing(userId);
      
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
      onApprovalChange();
      
      toast({
        title: approved ? "Usuário Aprovado" : "Usuário Rejeitado",
        description: `O usuário foi ${approved ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating user approval:', error);
      toast({
        title: "Erro ao processar aprovação",
        description: "Não foi possível processar a aprovação do usuário",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando aprovações pendentes...</span>
        </CardContent>
      </Card>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma aprovação pendente</h3>
          <p className="text-muted-foreground">
            Todos os usuários foram processados ou não há solicitações pendentes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingUsers.map((user) => (
        <Card key={user.id} className="border-l-4 border-l-orange-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{user.full_name}</h3>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{user.role || 'corretor'}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Solicitado em {new Date(user.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {/* Permissões solicitadas */}
                  {user.allowed_screens && user.allowed_screens.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Permissões solicitadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.allowed_screens.map(screen => (
                          <Badge key={screen} variant="outline" className="text-xs">
                            {screen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApproval(user.id, true)}
                  disabled={processing === user.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processing === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Aprovar
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApproval(user.id, false)}
                  disabled={processing === user.id}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
