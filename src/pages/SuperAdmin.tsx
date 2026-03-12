import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Users, Shield, LogOut, Pencil, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Company {
  id: string;
  name: string;
  status: string;
  max_users: number;
  created_at: string;
  user_count?: number;
}

const SuperAdmin = () => {
  const { isSuperAdmin, signOut, profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({ name: '', max_users: 10 });
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [userFormData, setUserFormData] = useState({ full_name: '', email: '', password: '' });

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar empresas');
      setLoading(false);
      return;
    }

    // Get user counts per company
    const companiesWithCounts = await Promise.all(
      (data || []).map(async (company: any) => {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id);
        return { ...company, user_count: count || 0 };
      })
    );

    setCompanies(companiesWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  const handleCreateCompany = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    const { error } = await supabase
      .from('companies')
      .insert({ name: formData.name, max_users: formData.max_users });

    if (error) {
      toast.error('Erro ao criar empresa: ' + error.message);
      return;
    }

    toast.success('Empresa criada com sucesso!');
    setCreateOpen(false);
    setFormData({ name: '', max_users: 10 });
    fetchCompanies();
  };

  const handleUpdateCompany = async () => {
    if (!editCompany) return;

    const { error } = await supabase
      .from('companies')
      .update({ name: formData.name, max_users: formData.max_users })
      .eq('id', editCompany.id);

    if (error) {
      toast.error('Erro ao atualizar empresa: ' + error.message);
      return;
    }

    toast.success('Empresa atualizada!');
    setEditCompany(null);
    fetchCompanies();
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = company.status === 'ativo' ? 'bloqueado' : 'ativo';
    const { error } = await supabase
      .from('companies')
      .update({ status: newStatus })
      .eq('id', company.id);

    if (error) {
      toast.error('Erro ao alterar status');
      return;
    }

    toast.success(`Empresa ${newStatus === 'ativo' ? 'ativada' : 'bloqueada'}!`);
    fetchCompanies();
  };

  const handleDeleteCompany = async (company: Company) => {
    if ((company.user_count || 0) > 0) {
      toast.error('Não é possível excluir empresa com usuários ativos');
      return;
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id);

    if (error) {
      toast.error('Erro ao excluir empresa: ' + error.message);
      return;
    }

    toast.success('Empresa excluída!');
    fetchCompanies();
  };

  const handleCreateCompanyUser = async () => {
    if (!selectedCompany || !userFormData.full_name || !userFormData.email || !userFormData.password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (userFormData.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: userFormData.full_name,
          email: userFormData.email,
          password: userFormData.password,
          role: 'diretor',
          company_id: selectedCompany.id,
          allowed_screens: ['dashboard', 'central-gestor', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas', 'negociacoes', 'follow-up', 'atividades', 'tarefas-kanban', 'meta-gestao', 'x1', 'dashboard-equipes', 'agenda', 'gestao-usuarios'],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Diretor criado com sucesso!');
      setCreateUserOpen(false);
      setUserFormData({ full_name: '', email: '', password: '' });
      setSelectedCompany(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
              <p className="text-xs text-muted-foreground">Painel de Gestão da Plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{companies.length}</p>
                  <p className="text-sm text-muted-foreground">Empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {companies.reduce((acc, c) => acc + (c.user_count || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Usuários Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {companies.filter(c => c.status === 'ativo').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Empresas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Empresas (Imobiliárias)
              </CardTitle>
              <CardDescription>Gerencie as empresas que utilizam a plataforma</CardDescription>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Empresa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Empresa</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da imobiliária"
                    />
                  </div>
                  <div>
                    <Label>Limite de Usuários</Label>
                    <Input
                      type="number"
                      value={formData.max_users}
                      onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
                      min={1}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateCompany}>Criar Empresa</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : companies.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma empresa cadastrada
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {companies.map((company) => (
                    <Card key={company.id} className="border border-border/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{company.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Criada em {new Date(company.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Badge variant={company.status === 'ativo' ? 'default' : 'destructive'}>
                            {company.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Usuários</p>
                            <p className="font-semibold">{company.user_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Limite</p>
                            <p className="font-semibold">{company.max_users}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-border/30 flex-wrap">
                          <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => { setSelectedCompany(company); setUserFormData({ full_name: '', email: '', password: '' }); setCreateUserOpen(true); }}>
                            <Users className="w-4 h-4 mr-1" /> Diretor
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9" onClick={() => { setEditCompany(company); setFormData({ name: company.name, max_users: company.max_users }); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9" onClick={() => handleToggleStatus(company)}>
                            {company.status === 'ativo' ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9" onClick={() => handleDeleteCompany(company)} disabled={(company.user_count || 0) > 0}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Limite</TableHead>
                        <TableHead>Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>
                            <Badge variant={company.status === 'ativo' ? 'default' : 'destructive'}>
                              {company.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                            </Badge>
                          </TableCell>
                          <TableCell>{company.user_count || 0}</TableCell>
                          <TableCell>{company.max_users}</TableCell>
                          <TableCell>{new Date(company.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedCompany(company); setUserFormData({ full_name: '', email: '', password: '' }); setCreateUserOpen(true); }} title="Criar Diretor">
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setEditCompany(company); setFormData({ name: company.name, max_users: company.max_users }); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(company)}>
                                {company.status === 'ativo' ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCompany(company)} disabled={(company.user_count || 0) > 0}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Company Dialog */}
      <Dialog open={!!editCompany} onOpenChange={(open) => !open && setEditCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Limite de Usuários</Label>
              <Input
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompany(null)}>Cancelar</Button>
            <Button onClick={handleUpdateCompany}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Diretor - {selectedCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={userFormData.full_name}
                onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                placeholder="Nome do diretor"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCompanyUser}>Criar Diretor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
