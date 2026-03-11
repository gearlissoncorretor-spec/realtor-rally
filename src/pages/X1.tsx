import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { useBrokers } from '@/hooks/useBrokers';
import { useBrokerNotes } from '@/hooks/useBrokerNotes';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Users, MessageSquare, CalendarDays, Search, ChevronDown, User,
} from 'lucide-react';
import { X1Skeleton } from '@/components/skeletons/X1Skeleton';
import { BrokerX1Section } from '@/components/x1/BrokerX1Section';
import PeriodFilter from '@/components/PeriodFilter';
import { cn } from '@/lib/utils';

// KPI Card
const KPICard = ({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub: string; color: string;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', color)}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </CardContent>
  </Card>
);

// Broker card with inline note count
const BrokerCard = ({ broker, filterMonth, filterYear }: {
  broker: any; filterMonth: number; filterYear: number;
}) => {
  const [open, setOpen] = useState(false);
  const { notes } = useBrokerNotes(broker.id);

  const statusConfig: Record<string, { label: string; ring: string }> = {
    ativo: { label: 'Ativo', ring: 'ring-emerald-500' },
    inativo: { label: 'Inativo', ring: 'ring-destructive' },
    ferias: { label: 'Férias', ring: 'ring-amber-500' },
  };
  const status = statusConfig[broker.status || 'ativo'] || statusConfig.ativo;

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(
        'transition-all duration-200',
        open && 'ring-1 ring-primary/30 shadow-md'
      )}>
        <CollapsibleTrigger className="w-full">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="relative">
              <Avatar className={cn('h-11 w-11 ring-2', status.ring)}>
                <AvatarImage src={broker.avatar_url || undefined} alt={broker.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInitials(broker.name)}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                broker.status === 'ativo' ? 'bg-emerald-500' : broker.status === 'ferias' ? 'bg-amber-500' : 'bg-destructive'
              )} />
            </div>

            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-sm truncate">{broker.name}</p>
              <p className="text-xs text-muted-foreground truncate">{broker.email}</p>
            </div>

            <Badge variant="secondary" className="text-xs gap-1 shrink-0">
              <MessageSquare className="h-3 w-3" />
              {notes.length}
            </Badge>

            <Badge variant="outline" className={cn(
              'text-[10px] shrink-0',
              broker.status === 'ativo' ? 'border-emerald-500/50 text-emerald-600' :
              broker.status === 'ferias' ? 'border-amber-500/50 text-amber-600' :
              'border-destructive/50 text-destructive'
            )}>
              {status.label}
            </Badge>

            <ChevronDown className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              open && 'rotate-180'
            )} />
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t">
            <div className="pt-4">
              <BrokerX1Section brokerId={broker.id} filterMonth={filterMonth} filterYear={filterYear} />
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default function X1() {
  const { brokers, loading } = useBrokers();
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(0);

  const filteredBrokers = useMemo(() => {
    if (!brokers) return [];
    const q = search.toLowerCase().trim();
    if (!q) return brokers;
    return brokers.filter(b =>
      b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q)
    );
  }, [brokers, search]);

  const activeBrokers = brokers?.filter(b => b.status === 'ativo').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="lg:ml-72 pt-16 lg:pt-0 p-4 lg:p-6 pb-20 lg:pb-6 space-y-6">
        {loading ? <X1Skeleton /> : (
          <>
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">X1 — Acompanhamento Individual</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Registros individuais de acompanhamento organizados por corretor e data
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard icon={Users} label="Corretores" value={brokers?.length || 0} sub={`${activeBrokers} ativo(s)`} color="bg-primary" />
              <KPICard icon={MessageSquare} label="Total Registros" value="—" sub="Todos os corretores" color="bg-emerald-600" />
              <KPICard icon={CalendarDays} label="Registros Hoje" value="—" sub={new Date().toLocaleDateString('pt-BR')} color="bg-amber-600" />
            </div>

            {/* Period Filter */}
            <PeriodFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar corretor por nome ou e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Broker Cards */}
            {filteredBrokers.length > 0 ? (
              <div className="grid gap-3">
                {filteredBrokers.map(broker => (
                  <BrokerCard key={broker.id} broker={broker} filterMonth={selectedMonth} filterYear={selectedYear} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum corretor encontrado</p>
                  {search && <p className="text-sm mt-1">Tente buscar com outro termo</p>}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
