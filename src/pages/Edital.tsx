import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  ShoppingBag, 
  Target, 
  Trophy, 
  Receipt, 
  CalendarDays, 
  LayoutGrid, 
  FileBarChart,
  Settings,
  Database,
  Smartphone,
  CheckCircle2,
  Lock,
  Globe
} from "lucide-react";

const Edital = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Badge variant="outline" className="mb-2">Documentação Oficial</Badge>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Edital de Funcionalidades e Acessos
          </h1>
          <p className="text-muted-foreground text-lg">
            Guia completo sobre a estrutura, módulos e níveis de permissão do sistema.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Perfil de Usuários */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Perfis de Usuário</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Corretor</CardTitle>
                    <Badge>Operacional</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Foco na execução: lança vendas, gere suas negociações, agenda e acompanha suas próprias metas e ranking.
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Gerente</CardTitle>
                    <Badge variant="secondary">Gestão</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Visão de equipe: acompanha o desempenho dos seus corretores, valida vendas e monitora metas do grupo.
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Diretor / Sócio</CardTitle>
                    <Badge variant="secondary">Estratégico</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Visão macro: acesso a BI, dashboards consolidados, financeiro e performance global da imobiliária.
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Admin</CardTitle>
                    <Badge variant="outline">Sistema</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Configuração: gere usuários, permissões, branding da empresa e configurações gerais do sistema.
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Super Admin</CardTitle>
                    <Badge variant="destructive">Root</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Controle total: gestão de múltiplas instâncias, logs de erro e manutenção técnica de alto nível.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Módulos Principais */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <LayoutGrid className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Módulos e Funcionalidades</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Gestão de Vendas</h3>
                      <p className="text-sm text-muted-foreground">Fluxo completo de registro de vendas, tipos de produtos, valores e históricos detalhados por corretor e unidade.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Metas e Performance</h3>
                      <p className="text-sm text-muted-foreground">Definição de objetivos mensais, trimestrais e anuais com indicadores de progresso visual em tempo real.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Ranking & Gamificação</h3>
                      <p className="text-sm text-muted-foreground">Pódios dinâmicos que incentivam a competitividade saudável entre corretores e equipes.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Financeiro e Comissões</h3>
                      <p className="text-sm text-muted-foreground">Cálculo automatizado de comissões, status de pagamento e acompanhamento de fluxo de caixa operacional.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">CRM e Follow-up</h3>
                      <p className="text-sm text-muted-foreground">Gestão de leads, histórico de contatos (X1), funil de negociações e agenda integrada de compromissos.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                      <FileBarChart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">BI e Relatórios</h3>
                      <p className="text-sm text-muted-foreground">Geração de relatórios avançados, exportação para Excel e dashboards de análise de dados (Ticket Médio, VGC, etc).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pilares Tecnológicos */}
          <section className="bg-card border rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Infraestrutura e Segurança</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium">Real-time</h4>
                <p className="text-xs text-muted-foreground">Sincronização instantânea entre todos os dispositivos conectados.</p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium">PWA Ready</h4>
                <p className="text-xs text-muted-foreground">Instalável como aplicativo nativo no celular ou desktop.</p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium">Segurança</h4>
                <p className="text-xs text-muted-foreground">Proteção de dados com RLS (Row Level Security) via Supabase.</p>
              </div>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium">Cloud Native</h4>
                <p className="text-xs text-muted-foreground">Acessível de qualquer lugar do mundo com 99.9% de uptime.</p>
              </div>
            </div>
          </section>

          {/* Rodapé do Edital */}
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p className="text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Documento atualizado automaticamente de acordo com as versões do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Edital;
