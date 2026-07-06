import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export interface ModuleTourStep {
  title: string;
  description: string;
}

interface ModuleTourProps {
  /** Unique key per module, e.g. 'vendas', 'ranking' */
  moduleKey: string;
  steps: ModuleTourStep[];
  /** Delay before first showing (ms). Default 1200. */
  delay?: number;
}

const STORAGE_PREFIX = 'module_tour_completed';

/**
 * Small onboarding tour for a single module. Shows once per user per moduleKey.
 * Non-invasive: renders nothing if already completed. Safe to add to any page.
 */
export function ModuleTour({ moduleKey, steps, delay = 1200 }: ModuleTourProps) {
  const { profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!profile || steps.length === 0) return;
    const key = `${STORAGE_PREFIX}_${moduleKey}_${profile.id}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [profile, moduleKey, steps.length, delay]);

  const complete = () => {
    if (profile) {
      localStorage.setItem(`${STORAGE_PREFIX}_${moduleKey}_${profile.id}`, '1');
    }
    setVisible(false);
  };

  if (!visible || steps.length === 0) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-[90] max-w-sm w-[calc(100vw-2rem)] sm:w-96"
      >
        <Card className="p-4 shadow-2xl border-primary/30 bg-card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dica rápida
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={complete}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground text-sm">{current.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? 'w-4 bg-primary' : 'w-1 bg-muted-foreground/25'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="gap-1 h-8"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar
            </Button>
            <span className="text-xs text-muted-foreground">
              {step + 1}/{steps.length}
            </span>
            <Button
              size="sm"
              onClick={() => (isLast ? complete() : setStep((s) => s + 1))}
              className="gap-1 h-8"
            >
              {isLast ? 'Entendi' : 'Próximo'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
