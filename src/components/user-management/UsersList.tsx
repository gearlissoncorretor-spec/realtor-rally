import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Edit, 
  Shield, 
  Users, 
  TrendingUp, 
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  full_name: string;
  email: string;
  user_role: string;
  approved: boolean;
  allowed_screens: string[];
  created_at: string;
  team_id?: string;
}

interface UsersListProps {
  refreshTrigger: number;
}

const AVAILABLE_SCREENS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'vendas', label: 'Vendas' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'acompanhamento', label: 'Acompanhamento' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'corretores', label: 'Corretores' },
  { id: 'configuracoes', label: 'Configurações' },
];

export const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profile data with roles
      const usersWithRoles = profilesData?.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          user_role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.user_role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.approved : !user.approved
      );
    }

    setFilteredUsers(filtered);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const updateUser = async (updatedUser: User) => {
    try {
      setSaving(true);
      
      // Update profile (without role)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.full_name,
          approved: updatedUser.approved,
          allowed_screens: updatedUser.allowed_screens ?? []
        })
        .eq('id', updatedUser.id);

      if (profileError) throw profileError;

      // Update role in user_roles table
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', updatedUser.id);

      if (deleteError) throw deleteError;

      // Then insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: updatedUser.id,
          role: updatedUser.user_role as any,
          created_by: currentUser?.id
        }]);

      if (roleError) throw roleError;

      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso",
      });

      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar as informações do usuário",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleScreenPermission = (screenId: string) => {
    if (!editingUser) return;

    const currentScreens = editingUser.allowed_screens || [];
    const updatedScreens = currentScreens.includes(screenId)
      ? currentScreens.filter(s => s !== screenId)
      : [...currentScreens, screenId];

    setEditingUser({
      ...editingUser,
      allowed_screens: updatedScreens
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'diretor': return Shield;
      case 'gerente': return Users;
      case 'corretor': return TrendingUp;
      default: return Users;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'diretor': return 'bg-red-100 text-red-800';
      case 'gerente': return 'bg-blue-100 text-blue-800';
      case 'corretor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando usuários...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="diretor">Diretor</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="corretor">Corretor</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const RoleIcon = getRoleIcon(user.user_role);
              const isExpanded = expandedUser === user.id;
              
              return (
                <div
                  key={user.id}
                  className="border rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* User Card Header */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.full_name}</p>
                            {user.user_role === 'admin' && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleBadgeColor(user.user_role)}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.user_role}
                        </Badge>
                        
                        <Badge variant={user.approved ? "default" : "secondary"}>
                          {user.approved ? "Ativo" : "Pendente"}
                        </Badge>
                        
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-4">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <div>
                            <p className="text-sm font-medium mb-2">Permissões:</p>
                            <div className="flex flex-wrap gap-1">
                              {user.allowed_screens?.map(screenId => {
                                const screen = AVAILABLE_SCREENS.find(s => s.id === screenId);
                                return screen ? (
                                  <Badge key={screenId} variant="outline" className="text-xs">
                                    {screen.label}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome Completo</Label>
                  <Input
                    id="edit-name"
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-role">Cargo</Label>
                  <Select 
                    value={editingUser.user_role} 
                    onValueChange={(user_role) => setEditingUser({ ...editingUser, user_role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="corretor">Corretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingUser.approved}
                  onCheckedChange={(approved) => setEditingUser({ ...editingUser, approved })}
                />
                <Label>Ativo</Label>
              </div>

              <div>
                <Label className="text-base font-medium">Permissões de Acesso</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {AVAILABLE_SCREENS.map((screen) => (
                    <div key={screen.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={editingUser.allowed_screens?.includes(screen.id) ?? false}
                        onCheckedChange={() => toggleScreenPermission(screen.id)}
                      />
                      <Label className="cursor-pointer">{screen.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => updateUser(editingUser)} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
