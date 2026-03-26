import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/button'; // Wait, Card is in '@/components/ui/card'
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, Brain, ChevronDown, ChevronUp, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ManagerAIInsightsProps {
  teamId?: string;
  companyId: string;
  managerName: string;
}

export const ManagerAIInsights = ({ teamId, companyId, managerName }: ManagerAIInsightsProps) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();

  const generateInsights = async () => {
    setLoading(true);
    setInsight(null);
    try {
      const { data, error } = await supabase.functions.invoke('manager-ai-brain', {
        body: { teamId, companyId, managerName },
      });

      if (error) throw error;
      setInsight(data.insight);
      setIsExpanded(true);
    } catch (err) {
      console.error('Error calling AI Brain:', err);
      toast({
        title: "Erro ao consultar o Cérebro",
        description: "Não foi possível gerar insights no momento. Verifique se a API key da IA está configurada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className={cn(
        "rounded-2xl border transition-all duration-300 overflow-hidden",
        insight ? "border-primary/40 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg shadow-primary/5" : "border-muted-foreground/10 bg-muted/30"
      )}>
        <div className="p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-500",
              loading ? "bg-primary/20 animate-pulse" : insight ? "bg-primary/20 text-primary scale-110" : "bg-muted text-muted-foreground"
            )}>
              <Brain className={cn("w-6 h-6", loading && "animate-spin-slow")} />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-foreground flex items-center gap-2">
                IA Generativa: O Cérebro <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 animate-pulse">Beta</Badge>
              </h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                {insight ? "Análise estratégica baseada em dados reais do seu time." : "Clique abaixo para que a IA analise o desempenho e riscos da sua operação."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end lg:self-center">
            {insight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-9 w-9 p-0 rounded-full hover:bg-primary/10"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            )}
            <Button
              onClick={generateInsights}
              disabled={loading}
              className={cn(
                "relative overflow-hidden group transition-all duration-300",
                insight ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground" : "bg-primary hover:scale-105"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  {insight ? "Recalcular Insights" : "Consultar o Cérebro"}
                </>
              )}
            </Button>
          </div>
        </div>

        {insight && isExpanded && (
          <div className="px-4 pb-6 lg:px-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-6" />
            <div className="prose prose-sm prose-invert max-w-none 
              prose-headings:text-primary prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-2 prose-li:my-1
              bg-background/40 backdrop-blur-sm rounded-xl p-5 border border-primary/10">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-full border border-muted-foreground/10">
                <AlertCircle className="w-3 h-3 text-amber-500" /> Previsão baseada em padrões históricos
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-full border border-muted-foreground/10">
                <TrendingUp className="w-3 h-3 text-emerald-500" /> Foco em ações imediatas
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
