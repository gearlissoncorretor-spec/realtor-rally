import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, X, Users, Briefcase, Calendar, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GestorHeroHeaderProps {
  profileName?: string;
  teamName: string;
  activeBrokersCount: number;
  totalBrokersCount: number;
  monthSalesCount: number;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const GestorHeroHeader: React.FC<GestorHeroHeaderProps> = ({
  profileName,
  teamName,
  activeBrokersCount,
  totalBrokersCount,
  monthSalesCount,
  focusMode,
  onToggleFocusMode,
}) => {
  const navigate = useNavigate();
  const isEmail = profileName?.includes('@');
  const firstName = isEmail ? 'Gestor' : (profileName?.split(' ')[0] || 'Gestor');

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 lg:p-6"
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-success/10 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">
              Central do Gestor
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Equipe <strong className="text-foreground">{teamName}</strong>
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span>{activeBrokersCount} de {totalBrokersCount} corretores ativos</span>
            <span className="hidden sm:inline text-border">•</span>
            <span>{monthSalesCount} venda{monthSalesCount !== 1 ? 's' : ''} no mês</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs font-medium border-border/60">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </Badge>
          <Button
            variant={focusMode ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "gap-1.5 transition-all",
              focusMode && "bg-warning hover:bg-warning/90 text-warning-foreground"
            )}
            onClick={onToggleFocusMode}
          >
            {focusMode ? <X className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {focusMode ? 'Sair do Foco' : 'Modo Foco'}
          </Button>
          {!focusMode && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 border-success/20 text-success hover:bg-success/10" onClick={() => navigate('/corretores')}>
                <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Minha</span> Equipe
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 border-primary/20 text-primary hover:bg-primary/10" onClick={() => navigate('/negociacoes')}>
                <Briefcase className="w-3.5 h-3.5" /> Negociações
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GestorHeroHeader;
