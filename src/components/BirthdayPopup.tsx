import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cake, Rocket, Star, Trophy, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

const BIRTHDAY_POPUP_KEY_PREFIX = 'bday_popup_shown_';

const inspirationalMessages = [
  'Que hoje seja um dia incrível e cheio de conquistas! 🚀',
  'Mais um ano de sucesso e muitas vendas pela frente! 💎',
  'Hoje é seu dia! Que tal bater todas as metas? 🔥',
  'Comemore cada conquista — a maior delas é você! 🌟',
  'Você é peça-chave do nosso time. Parabéns! 🏆',
];

function getRandomMessage() {
  return inspirationalMessages[Math.floor(Math.random() * inspirationalMessages.length)];
}

function isBirthdayToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return false;
  return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
}

function hasShownToday(): boolean {
  const todayKey = BIRTHDAY_POPUP_KEY_PREFIX + new Date().toISOString().slice(0, 10);
  return localStorage.getItem(todayKey) === 'true';
}

function markShownToday() {
  const todayKey = BIRTHDAY_POPUP_KEY_PREFIX + new Date().toISOString().slice(0, 10);
  localStorage.setItem(todayKey, 'true');

  // Cleanup old keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BIRTHDAY_POPUP_KEY_PREFIX) && key !== todayKey) {
      localStorage.removeItem(key);
    }
  }
}

function fireConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999 };

  confetti({ ...defaults, particleCount: 80, origin: { x: 0.2, y: 0.5 } });
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.8, y: 0.5 } });

  setTimeout(() => {
    confetti({ ...defaults, particleCount: 60, origin: { x: 0.5, y: 0.3 } });
  }, 400);
}

const BirthdayPopup = () => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [message] = useState(getRandomMessage);

  useEffect(() => {
    if (!profile) return;
    const birthDate = (profile as any).birth_date ?? null;
    if (isBirthdayToday(birthDate) && !hasShownToday()) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => {
        setOpen(true);
        fireConfetti();
        markShownToday();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // One last burst 🎉
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 }, zIndex: 9999 });
  }, []);

  if (!open) return null;

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          'sm:max-w-md border-0 bg-transparent shadow-none p-0',
          '[&>button]:hidden' // hide default close button
        )}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-8 text-center shadow-2xl animate-scale-in">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />

          {/* Icon row */}
          <div className="relative z-10 mb-4 flex items-center justify-center gap-2">
            <Star className="h-5 w-5 text-warning animate-bounce" style={{ animationDelay: '0s' }} />
            <Cake className="h-10 w-10 text-primary-foreground drop-shadow-lg" />
            <Star className="h-5 w-5 text-warning animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>

          {/* Title */}
          <h2 className="relative z-10 text-2xl font-extrabold text-white mb-1 drop-shadow">
            🎉 Feliz Aniversário, {firstName}!
          </h2>

          {/* Message */}
          <p className="relative z-10 text-white/90 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            {message}
          </p>

          {/* Badge */}
          <div className="relative z-10 mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-4 py-1.5 text-xs font-semibold text-white">
            <Trophy className="h-3.5 w-3.5" />
            Badge: Aniversariante do Dia 🎖️
          </div>

          {/* CTA */}
          <div className="relative z-10">
            <Button
              onClick={handleClose}
              size="lg"
              className="rounded-full bg-white text-primary font-bold hover:bg-white/90 shadow-lg gap-2 px-8"
            >
              <Rocket className="h-4 w-4" />
              Começar meu dia
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BirthdayPopup;
