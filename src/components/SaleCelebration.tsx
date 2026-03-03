import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Rocket, Star, PartyPopper, TrendingUp } from 'lucide-react';

interface SaleCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokerName: string;
  clientName: string;
  saleValue: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'circle' | 'square' | 'star';
}

const COLORS = [
  '#FFD700', '#FF6B35', '#00D68F', '#3B82F6', '#A855F7',
  '#F43F5E', '#06B6D4', '#EAB308', '#22C55E', '#EC4899',
];

const MOTIVATIONAL_MESSAGES = [
  "Você é imparável! 🔥",
  "Sucesso é o seu sobrenome! 💎",
  "Rumo ao topo! 🚀",
  "Mais uma conquista incrível! 🌟",
  "Continue brilhando! ✨",
  "O céu é o limite! 🎯",
  "Campeão de vendas! 🏆",
];

export function SaleCelebration({ open, onOpenChange, brokerName, clientName, saleValue }: SaleCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [motivationalMsg] = useState(() => 
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  );

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 3,
        speedY: 1.5 + Math.random() * 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
      });
    }
    setParticles(newParticles);
  }, []);

  const playCelebrationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play a cheerful ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.start(start);
        osc.stop(start + 0.4);
      });

      // Add a shimmer/sparkle effect
      setTimeout(() => {
        const shimmerNotes = [1568, 2093, 1760, 2637];
        shimmerNotes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const start = ctx.currentTime + i * 0.08;
          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          osc.start(start);
          osc.stop(start + 0.3);
        });
      }, 500);
    } catch (e) {
      // Audio not supported, fail silently
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    createParticles();
    playCelebrationSound();

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.x + p.speedX * 0.3,
          y: p.y + p.speedY * 0.5,
          rotation: p.rotation + p.rotationSpeed,
          opacity: Math.max(0, p.opacity - 0.003),
        })).filter(p => p.y < 120 && p.opacity > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [open, createParticles]);

  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saleValue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:hidden">
        {/* Confetti layer */}
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
                borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
                transform: `rotate(${p.rotation}deg)`,
                opacity: p.opacity,
                transition: 'none',
                ...(p.shape === 'star' ? {
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  backgroundColor: p.color,
                } : {}),
              }}
            />
          ))}
        </div>

        {/* Main celebration card */}
        <div className="relative bg-card rounded-2xl border border-border overflow-hidden">
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 text-center relative overflow-hidden">
            {/* Sparkle effects */}
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <Star
                  key={i}
                  className="absolute text-white/30 animate-pulse"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    width: 12 + Math.random() * 16,
                    height: 12 + Math.random() * 16,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 animate-bounce">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                VENDA FECHADA!
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <PartyPopper className="w-5 h-5 text-yellow-200" />
                <p className="text-white/90 font-medium text-lg">Parabéns!</p>
                <PartyPopper className="w-5 h-5 text-yellow-200" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Broker congratulations */}
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-foreground">
                🎉 {brokerName}
              </p>
              <p className="text-muted-foreground">
                Você fechou uma venda com <span className="font-semibold text-foreground">{clientName}</span>!
              </p>
            </div>

            {/* Sale value highlight */}
            <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Valor da Venda
              </p>
              <p className="text-3xl font-extrabold text-green-500">
                {formattedValue}
              </p>
            </div>

            {/* Motivational message */}
            <div className="bg-muted/50 rounded-xl p-4 text-center border border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-primary" />
                <p className="font-semibold text-foreground text-sm">Próximo passo</p>
              </div>
              <p className="text-lg font-bold text-primary">
                {motivationalMsg}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Continue com esse ritmo e conquiste ainda mais!
              </p>
            </div>

            {/* Stats incentive */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Cada venda te aproxima do topo do ranking!</span>
            </div>

            {/* Close button */}
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-base h-12 rounded-xl shadow-lg shadow-orange-500/25"
            >
              🚀 Bora pra próxima!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
