import { useEffect, useState } from 'react';
import { Trophy, Star, Crown } from 'lucide-react';

interface VictoryEffectsProps {
  isFirstPlace: boolean;
  brokerName: string;
}

const VictoryEffects = ({ isFirstPlace, brokerName }: VictoryEffectsProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (isFirstPlace) {
      setShowConfetti(true);
      
      // Generate confetti pieces
      const pieces = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 2,
        color: ['text-yellow-400', 'text-orange-400', 'text-red-400', 'text-pink-400', 'text-purple-400'][Math.floor(Math.random() * 5)]
      }));
      
      setConfettiPieces(pieces);

      // Hide confetti after animation
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isFirstPlace, brokerName]);

  if (!isFirstPlace) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {/* Crown Effect */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
        <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
      </div>

      {/* Trophy Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 via-transparent to-transparent animate-pulse" />

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className={`absolute animate-[confetti_3s_ease-out_forwards] ${piece.color}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${piece.delay}s`,
                '--random-x': `${(Math.random() - 0.5) * 200}px`,
                '--random-rotation': `${Math.random() * 720}deg`
              } as React.CSSProperties}
            >
              <Star className="w-4 h-4" />
            </div>
          ))}
        </div>
      )}

      {/* Victory Message */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce shadow-lg">
          🏆 CAMPEÃO!
        </div>
      </div>
    </div>
  );
};

// Add confetti keyframes to your global CSS or component styles
const confettiStyles = `
@keyframes confetti {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(var(--random-x)) rotate(var(--random-rotation));
    opacity: 0;
  }
}
`;

export default VictoryEffects;