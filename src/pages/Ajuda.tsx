import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Keyboard, Home, TrendingUp, Users, Target, Trophy, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  content: string;
  keywords: string[];
}

const articles: HelpArticle[] = [
  {
    id: "atalhos",
    title: "Atalhos de teclado",
    category: "Geral",
    icon: Keyboard,
    keywords: ["atalho", "teclado", "shortcut", "ctrl", "cmd"],
    content:
      "Ctrl/Cmd + K → Abrir a busca rápida (Command Palette). Digite o nome de qualquer tela para navegar.",
  },
  {
    id: "dashboard",
    title: "Como ler o Dashboard",
    category: "Principal",
    icon: Home,
    keywords: ["dashboard", "kpi", "métricas", "vgv"],
    content:
      "O Dashboard mostra VGV, comissão e ticket médio do período selecionado. Vendas com status 'Distrato' e 'Cancelada' são excluídas automaticamente das métricas.",
  },
  {
    id: "vendas",
    title: "Registrar uma venda",
    category: "Comercial",
    icon: TrendingUp,
    keywords: ["venda", "novo", "cadastrar", "registrar"],
    content:
      "Vá em Vendas → 'Nova Venda'. Preencha o cliente, empreendimento, valor e corretor. Vendas de 'Lançamento' não contam para captação.",
  },
  {
    id: "corretores",
    title: "Cadastrar corretores",
    category: "Gestão",
    icon: Users,
    keywords: ["corretor", "usuário", "equipe"],
    content:
      "Em Corretores → 'Novo Corretor'. Ao excluir, o corretor é marcado como 'Inativo' (soft delete) para preservar o histórico de vendas.",
  },
  {
    id: "metas",
    title: "Definindo metas",
    category: "Produtividade",
    icon: Target,
    keywords: ["meta", "objetivo", "goal"],
    content:
      "Metas podem ser individuais (por corretor) ou de equipe. Configure o período, tipo (VGV, unidades, ligações) e o valor alvo.",
  },
  {
    id: "ranking",
    title: "Como funciona o Ranking",
    category: "Produtividade",
    icon: Trophy,
    keywords: ["ranking", "podium", "gamificação"],
    content:
      "O Ranking é calculado por VGV do período. Empates são desempatados pelo número de vendas. Modo TV disponível para exibir em telão.",
  },
  {
    id: "atividades",
    title: "Registro de atividades",
    category: "Produtividade",
    icon: ClipboardList,
    keywords: ["atividade", "ligação", "visita", "follow"],
    content:
      "Registre ligações, visitas e follow-ups. Ativa pontuação no ranking de atividades e alimenta relatórios de produtividade.",
  },
];

export default function Ajuda() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.includes(q))
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, HelpArticle[]>();
    filtered.forEach((a) => {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Encontre respostas rápidas sobre o sistema. Use Ctrl/Cmd + K para busca rápida.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ajuda (ex: venda, meta, ranking)..."
          className="pl-10 h-11"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description={`Não encontramos artigos para "${query}". Tente outros termos.`}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((article) => {
                  const Icon = article.icon;
                  return (
                    <Card key={article.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Icon className="w-4 h-4 text-primary" />
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {article.content}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
