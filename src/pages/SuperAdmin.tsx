import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Users, Shield, LogOut, Pencil, Trash2, Ban, CheckCircle2, Crown, Briefcase, User, TrendingUp, AlertTriangle, Search, Copy, Check, PhoneCall, Mail, Settings2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import Navigation from '@/components/Navigation';

interface Company {
  id: string;
  name: string;
  status: string;
  max_users: number;
  created_at: string;
  user_count?: number;
}

const PLANS = [
  {
    id: 'corretor',
    name: 'Corretor Autônomo',
    icon: User,
    max_users: 1,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    screens: ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'comissoes', 'configuracoes', 'agenda'],
    description: 'Para corretores individuais',
    price: 'R$ 49-99/mês',
  },
  {
    id: 'gerente',
    name: 'Gerente de Equipe',
    icon: Briefcase,
    max_users: 10,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    screens: ['dashboard', 'central-gestor', 'vendas', 'corretores', 'equipes', 'ranking', 'negociacoes', 'follow-up', 'metas', 'meta-gestao', 'atividades', 'comissoes', 'acompanhamento', 'configuracoes', 'agenda', 'gestao-usuarios'],
    description: 'Equipe de até 10 corretores',
    price: 'R$ 149-299/mês',
  },
  {
    id: 'diretor',
    name: 'Diretor / Imobiliária',
    icon: Crown,
    max_users: 50,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    screens: ['dashboard', 'central-gestor', 'vendas', 'corretores', 'ranking', 'acompanhamento', 'relatorios', 'configuracoes', 'equipes', 'metas', 'negociacoes', 'follow-up', 'atividades', 'meta-gestao', 'x1', 'dashboard-equipes', 'agenda', 'gestao-usuarios', 'comissoes'],
    description: 'Acesso total, ilimitado',
    price: 'R$ 499-999/mês',
  },
];

const SuperAdmin = () => {
  const { isSuperAdmin, signOut } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('companies');

  // Contact Form Submissions
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [contactSettings, setContactSettings] = useState({
    enabled: true,
    recipient: 'suporte@gestaomaster.com'
  });

  // Create company + director flow
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>('diretor');
  const [companyName, setCompanyName] = useState('');
  const [customMaxUsers, setCustomMaxUsers] = useState(10);
  const [directorName, setDirectorName] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorPassword, setDirectorPassword] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Edit company
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', max_users: 10 });

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar empresas');
      setLoading(false);
      return;
    }

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

  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(c => c.status === 'ativo').length;
    const blocked = companies.filter(c => c.status === 'bloqueado').length;
    const totalUsers = companies.reduce((acc, c) => acc + (c.user_count || 0), 0);
    const totalCapacity = companies.reduce((acc, c) => acc + c.max_users, 0);
    const nearLimit = companies.filter(c => c.status === 'ativo' && (c.user_count || 0) >= c.max_users * 0.8).length;
    return { total, active, blocked, totalUsers, totalCapacity, nearLimit };
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, searchQuery]);

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedPlan('diretor');
    setCompanyName('');
    setCustomMaxUsers(10);
    setDirectorName('');
    setDirectorEmail('');
    setDirectorPassword('');
    setCreatedCredentials(null);
    setCreatingCompany(false);
  };

  const handleWizardCreate = async () => {
    if (!companyName.trim()) { toast.error('Nome da empresa é obrigatório'); return; }
    if (!directorName.trim() || !directorEmail.trim() || !directorPassword.trim()) { toast.error('Preencha todos os dados do diretor'); return; }
    if (directorPassword.length < 8) { toast.error('Senha deve ter pelo menos 8 caracteres'); return; }

    setCreatingCompany(true);
    const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[2];
    const maxUsers = selectedPlan === 'diretor' ? customMaxUsers : plan.max_users;
    const role = selectedPlan === 'corretor' ? 'corretor' : selectedPlan === 'gerente' ? 'gerente' : 'diretor';

    try {
      // 1. Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName.trim(), max_users: maxUsers })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create the company owner (socio) user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: directorName.trim(),
          email: directorEmail.trim(),
          password: directorPassword,
          role: 'socio',
          company_id: companyData.id,
          allowed_screens: plan.screens,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreatedCredentials({ email: directorEmail.trim(), password: directorPassword });
      setWizardStep(3);
      fetchCompanies();
      toast.success('Empresa e administrador criados com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar empresa');
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateCompany = async () => {
    if (!editCompany) return;
    const { error } = await supabase
      .from('companies')
      .update({ name: editFormData.name, max_users: editFormData.max_users })
      .eq('id', editCompany.id);

    if (error) { toast.error('Erro ao atualizar empresa: ' + error.message); return; }
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

    if (error) { toast.error('Erro ao alterar status'); return; }
    toast.success(`Empresa ${newStatus === 'ativo' ? 'ativada' : 'bloqueada'}!`);
    fetchCompanies();
  };

  const handleDeleteCompany = async (company: Company) => {
    if ((company.user_count || 0) > 0) {
      toast.error('Não é possível excluir empresa com usuários ativos');
      return;
    }
    const { error } = await supabase.from('companies').delete().eq('id', company.id);
    if (error) { toast.error('Erro ao excluir empresa: ' + error.message); return; }
    toast.success('Empresa excluída!');
    fetchCompanies();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.blocked}</p>
                  <p className="text-xs text-muted-foreground">Bloqueadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.totalCapacity}</p>
                  <p className="text-xs text-muted-foreground">Capacidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xl font-bold text-foreground">{stats.nearLimit}</p>
                  <p className="text-xs text-muted-foreground">Perto do Limite</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Section */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Empresas (Imobiliárias)
              </CardTitle>
              <CardDescription>Gerencie as empresas que utilizam a plataforma</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Button onClick={() => { resetWizard(); setWizardOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {filteredCompanies.map((company) => {
                    const usage = company.max_users > 0 ? ((company.user_count || 0) / company.max_users) * 100 : 0;
                    return (
                      <Card key={company.id} className="border border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground">{company.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(company.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <Badge variant={company.status === 'ativo' ? 'default' : 'destructive'}>
                              {company.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Usuários: {company.user_count || 0} / {company.max_users}</span>
                              <span>{Math.round(usage)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${usage >= 90 ? 'bg-destructive' : usage >= 70 ? 'bg-amber-500' : 'bg-primary'}`}
                                style={{ width: `${Math.min(usage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-border/30 flex-wrap">
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditCompany(company); setEditFormData({ name: company.name, max_users: company.max_users }); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => handleToggleStatus(company)}>
                              {company.status === 'ativo' ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => handleDeleteCompany(company)} disabled={(company.user_count || 0) > 0}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Uso</TableHead>
                        <TableHead>Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => {
                        const usage = company.max_users > 0 ? ((company.user_count || 0) / company.max_users) * 100 : 0;
                        return (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>
                              <Badge variant={company.status === 'ativo' ? 'default' : 'destructive'}>
                                {company.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                              </Badge>
                            </TableCell>
                            <TableCell>{company.user_count || 0} / {company.max_users}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${usage >= 90 ? 'bg-destructive' : usage >= 70 ? 'bg-amber-500' : 'bg-primary'}`}
                                    style={{ width: `${Math.min(usage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">{Math.round(usage)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{new Date(company.created_at).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { setEditCompany(company); setEditFormData({ name: company.name, max_users: company.max_users }); }}>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </main>

      {/* ===== WIZARD: Nova Venda ===== */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) { setWizardOpen(false); resetWizard(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {wizardStep === 1 && '1. Escolha o Plano'}
              {wizardStep === 2 && '2. Dados da Empresa e Administrador'}
              {wizardStep === 3 && '✅ Empresa Criada!'}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && 'Selecione o plano que o cliente contratou'}
              {wizardStep === 2 && 'Preencha os dados para provisionar o ambiente'}
              {wizardStep === 3 && 'Envie as credenciais abaixo para o cliente'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Plan selection */}
          {wizardStep === 1 && (
            <div className="space-y-3">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `${plan.borderColor} ${plan.bgColor}`
                        : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${plan.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${plan.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{plan.price}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.id === 'corretor' ? '1 usuário' : plan.id === 'gerente' ? 'Até 10 usuários' : 'Customizável'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setWizardOpen(false)}>Cancelar</Button>
                <Button onClick={() => setWizardStep(2)}>Próximo</Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: Company + Director data */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2">
                  {(() => { const p = PLANS.find(p => p.id === selectedPlan)!; const Icon = p.icon; return <Icon className={`w-4 h-4 ${p.color}`} />; })()}
                  <span className="text-sm font-medium text-foreground">
                    Plano: {PLANS.find(p => p.id === selectedPlan)?.name}
                  </span>
                  <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setWizardStep(1)}>Alterar</Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Nome da Empresa / Imobiliária</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Imobiliária XYZ" />
                </div>

                {selectedPlan === 'diretor' && (
                  <div>
                    <Label>Limite de Usuários</Label>
                    <Input type="number" value={customMaxUsers} onChange={(e) => setCustomMaxUsers(parseInt(e.target.value) || 10)} min={1} />
                  </div>
                )}

                <div className="border-t border-border/50 pt-3">
                  <p className="text-sm font-medium text-foreground mb-2">Administrador da Empresa</p>
                </div>

                <div>
                  <Label>Nome Completo</Label>
                  <Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} placeholder="Nome do administrador" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={directorEmail} onChange={(e) => setDirectorEmail(e.target.value)} placeholder="email@empresa.com" />
                </div>
                <div>
                  <Label>Senha Inicial</Label>
                  <Input type="text" value={directorPassword} onChange={(e) => setDirectorPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setWizardStep(1)}>Voltar</Button>
                <Button onClick={handleWizardCreate} disabled={creatingCompany}>
                  {creatingCompany ? 'Criando...' : 'Criar Empresa'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Success + credentials */}
          {wizardStep === 3 && createdCredentials && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center space-y-1">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="font-semibold text-foreground">Empresa provisionada com sucesso!</p>
                <p className="text-sm text-muted-foreground">Envie as credenciais abaixo para o cliente</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-mono text-sm text-foreground">{createdCredentials.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(createdCredentials.email, 'email')}>
                    {copiedField === 'email' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Senha</p>
                    <p className="font-mono text-sm text-foreground">{createdCredentials.password}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(createdCredentials.password, 'password')}>
                    {copiedField === 'password' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">URL de Acesso</p>
                    <p className="font-mono text-sm text-foreground break-all">{window.location.origin}/auth</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(`${window.location.origin}/auth`, 'url')}>
                    {copiedField === 'url' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  const text = `🏢 Acesso ao Sistema\n\nEmail: ${createdCredentials.email}\nSenha: ${createdCredentials.password}\nAcesse: ${window.location.origin}/auth`;
                  handleCopy(text, 'all');
                  toast.success('Credenciais copiadas!');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Tudo
              </Button>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setWizardOpen(false); resetWizard(); }}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={!!editCompany} onOpenChange={(open) => !open && setEditCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa</Label>
              <Input value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
            </div>
            <div>
              <Label>Limite de Usuários</Label>
              <Input type="number" value={editFormData.max_users} onChange={(e) => setEditFormData({ ...editFormData, max_users: parseInt(e.target.value) || 10 })} min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompany(null)}>Cancelar</Button>
            <Button onClick={handleUpdateCompany}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default SuperAdmin;
