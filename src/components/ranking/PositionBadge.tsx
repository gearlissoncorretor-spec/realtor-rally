import { Trophy, Medal } from "lucide-react";

const PositionBadge = ({ position }: { position: number }) => {
  if (position === 1) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 shrink-0">
      <Trophy className="w-4 h-4 text-white" />
    </div>
  );
  if (position === 2) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md shrink-0">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  if (position === 3) return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shrink-0">
      <Medal className="w-4 h-4 text-white" />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-muted-foreground">#{position}</span>
    </div>
  );
};

export default PositionBadge;
