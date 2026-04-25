import { useMemo, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Phone, Plus, Search, UserPlus, Users, Inbox, TrendingUp, Target } from 'lucide-react';
import { useLeads, type Lead } from '@/hooks/useLeads';
import { LeadStatusBadge, LEAD_STATUSES } from '@/components/leads/LeadStatusBadge';
import { LeadSourceBadge, LEAD_SOURCES } from '@/components/leads/LeadSourceBadge';
import { DistributeLeadDialog } from '@/components/leads/DistributeLeadDialog';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { MyIntegrations } from '@/components/leads/MyIntegrations';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Leads = () => {
  const { isCorretor } = useAuth();
  const { leads, loading, assignLead, updateLead } = useLeads();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [distributeLead, setDistributeLead] = useState<Lead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const isBroker = isCorretor();

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          l.name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.campaign?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const stats = useMemo(() => ({
    total: leads.length,
    novos: leads.filter((l) => l.status === 'novo').length,
    atendimento: leads.filter((l) => l.status === 'atendimento').length,
    convertidos: leads.filter((l) => l.status === 'convertido').length,
  }), [leads]);

  const formatPhone = (phone: string | null) => phone || '—';
  const phoneHref = (phone: string | null) => {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    return `tel:+${digits}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestão centralizada de leads — pronto para integrações com Meta Ads e site próprio.
            </p>
          </div>
          {!isBroker && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Inbox} label="Total" value={stats.total} accent="text-primary" />
          <StatCard icon={UserPlus} label="Novos" value={stats.novos} accent="text-blue-500" />
          <StatCard icon={TrendingUp} label="Em Atendimento" value={stats.atendimento} accent="text-amber-500" />
          <StatCard icon={Target} label="Convertidos" value={stats.convertidos} accent="text-emerald-500" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone, e-mail ou campanha..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="md:w-44">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lista de Leads <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={leads.length === 0 ? 'Nenhum lead ainda' : 'Nenhum lead encontrado'}
                description={
                  leads.length === 0
                    ? 'Cadastre manualmente ou aguarde leads chegarem das integrações ativas.'
                    : 'Tente ajustar os filtros para ver mais resultados.'
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="hidden md:table-cell">Campanha</TableHead>
                      <TableHead className="hidden lg:table-cell">Entrada</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      {!isBroker && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          {lead.phone ? (
                            <a
                              href={phoneHref(lead.phone)}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {formatPhone(lead.phone)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <LeadSourceBadge source={lead.source} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {lead.campaign || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {isBroker ? (
                            <Select
                              value={lead.status}
                              onValueChange={(v) => updateLead({ id: lead.id, status: v })}
                            >
                              <SelectTrigger className="h-8 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAD_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <LeadStatusBadge status={lead.status} />
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.responsible ? (
                            <span className="text-sm">{lead.responsible.full_name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem responsável</span>
                          )}
                        </TableCell>
                        {!isBroker && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => setDistributeLead(lead)}
                            >
                              <Users className="w-3 h-3" />
                              Distribuir
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Integrations */}
        <MyIntegrations />
      </main>

      <DistributeLeadDialog
        open={!!distributeLead}
        onOpenChange={(o) => !o && setDistributeLead(null)}
        lead={distributeLead}
        onConfirm={async (brokerUserId) => {
          if (!distributeLead) return;
          await assignLead({ leadId: distributeLead.id, brokerUserId });
        }}
      />

      <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Leads;
