import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Rocket, BarChart3, Users, Target, Handshake, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_STEPS = [
  {
    icon: Rocket,
    title: 'Bem-vindo ao sistema!',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades. Leva menos de 1 minuto!',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: BarChart3,
    title: 'Dashboard & Vendas',
    description: 'Acompanhe o desempenho da sua equipe em tempo real. Veja VGV, metas atingidas e ranking dos corretores.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Handshake,
    title: 'Negociações & Follow-up',
    description: 'Gerencie todo o pipeline de vendas: do primeiro contato até o fechamento. Nunca perca um lead!',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Equipes & Corretores',
    description: 'Organize sua equipe, defina metas individuais e acompanhe a produtividade de cada corretor.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Target,
    title: 'Metas & Atividades',
    description: 'Defina metas mensais e semanais. Acompanhe tarefas e atividades em tempo real.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Calendar,
    title: 'Agenda & Relatórios',
    description: 'Organize compromissos, exporte relatórios profissionais e integre com Google Calendar.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
];

const TOUR_STORAGE_KEY = 'onboarding_tour_completed';

export const OnboardingTour = () => {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const completed = localStorage.getItem(`${TOUR_STORAGE_KEY}_${profile.id}`);
    if (!completed) {
      // Delay to let the dashboard load first
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleComplete = () => {
    if (profile) {
      localStorage.setItem(`${TOUR_STORAGE_KEY}_${profile.id}`, 'true');
    }
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Card className="w-full max-w-md p-6 space-y-5 shadow-2xl border-border/50 bg-card">
            {/* Close button */}
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${step.bg}`}>
                <StepIcon className={`w-7 h-7 ${step.color}`} />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1" onClick={handleComplete}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} de {TOUR_STEPS.length}
              </span>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1"
              >
                {isLast ? 'Começar!' : 'Próximo'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>

            {/* Skip */}
            {!isLast && (
              <div className="text-center">
                <button
                  onClick={handleComplete}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Pular tutorial
                </button>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
