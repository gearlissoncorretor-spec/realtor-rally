import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Shield, Eye, TrendingUp, Users, BarChart, Settings, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeams } from '@/hooks/useTeams';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLES = [
  { value: 'diretor', label: 'Diretor', icon: Shield },
  { value: 'gerente', label: 'Gerente', icon: Users },
  { value: 'corretor', label: 'Corretor', icon: TrendingUp },
];

const AVAILABLE_SCREENS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart },
  { id: 'vendas', label: 'Vendas', icon: TrendingUp },
  { id: 'ranking', label: 'Ranking', icon: TrendingUp },
  { id: 'acompanhamento', label: 'Acompanhamento', icon: Eye },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart },
  { id: 'corretores', label: 'Corretores', icon: Users },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

const DEFAULT_PERMISSIONS = {
  diretor: ['dashboard', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes'],
  gerente: ['dashboard', 'vendas', 'ranking', 'acompanhamento', 'relatorios'],
  corretor: ['dashboard', 'vendas']
};

const createUserSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['diretor', 'gerente', 'corretor']),
  allowed_screens: z.array(z.string()).min(1, 'Pelo menos uma tela deve ser selecionada')
});

interface CreateUserFormProps {
  onUserCreated: () => void;
}

export const CreateUserForm = ({ onUserCreated }: CreateUserFormProps) => {
  const { toast } = useToast();
  const { teams, loading: teamsLoading } = useTeams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    password: string;
    role: 'diretor' | 'gerente' | 'corretor' | undefined;
    allowed_screens: string[];
    team_id: string | undefined;
  }>({
    full_name: '',
    email: '',
    password: '',
    role: undefined,
    allowed_screens: [],
    team_id: undefined
  });

  const handleRoleChange = (role: 'diretor' | 'gerente' | 'corretor') => {
    setFormData(prev => ({
      ...prev,
      role,
      allowed_screens: DEFAULT_PERMISSIONS[role],
      team_id: undefined // Reset team selection when role changes
    }));
  };

  const toggleScreen = (screenId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_screens: prev.allowed_screens.includes(screenId)
        ? prev.allowed_screens.filter(s => s !== screenId)
        : [...prev.allowed_screens, screenId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que gerente tem equipe selecionada ANTES de começar loading
    if (formData.role === 'gerente' && !formData.team_id) {
      toast({
        title: "Equipe obrigatória",
        description: "Gerentes devem ser associados a uma equipe",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Validar dados
      const validationResult = createUserSchema.safeParse(formData);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(e => e.message).join(', ');
        toast({
          title: "Dados inválidos",
          description: errors,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          allowed_screens: formData.allowed_screens,
          team_id: formData.team_id || null
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Usuário criado com sucesso",
        description: `${formData.full_name} foi adicionado como ${formData.role}`,
      });

      // Limpar formulário
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: undefined,
        allowed_screens: [],
        team_id: undefined
      });

      onUserCreated();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Criar Novo Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.role === 'gerente' && (
            <div className="space-y-2">
              <Label htmlFor="team">Equipe *</Label>
              {teamsLoading ? (
                <div className="text-sm text-muted-foreground">Carregando equipes...</div>
              ) : teams.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma equipe encontrada. Crie uma equipe primeiro na página de Equipes.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select 
                  value={formData.team_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, team_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a equipe do gerente" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                O gerente terá acesso apenas aos corretores desta equipe
              </p>
            </div>
          )}

          {formData.role && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Permissões de Acesso</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina quais telas este usuário pode acessar
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_SCREENS.map((screen) => {
                  const Icon = screen.icon;
                  const isChecked = formData.allowed_screens.includes(screen.id);
                  
                  return (
                    <div 
                      key={screen.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                        isChecked ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                      />
                      <Icon className="h-4 w-4" />
                      <Label 
                        className="cursor-pointer flex-1 text-sm"
                        onClick={() => toggleScreen(screen.id)}
                      >
                        {screen.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
              
              {formData.allowed_screens.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allowed_screens.map((screenId) => {
                    const screen = AVAILABLE_SCREENS.find(s => s.id === screenId);
                    return screen ? (
                      <Badge key={screenId} variant="secondary">
                        {screen.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={
                loading || 
                !formData.role || 
                !formData.full_name || 
                !formData.email || 
                !formData.password ||
                (formData.role === 'gerente' && !formData.team_id)
              }
              className="flex-1"
            >
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};