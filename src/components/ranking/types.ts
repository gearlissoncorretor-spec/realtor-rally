import { formatCurrencyCompact } from "@/utils/formatting";

export interface BrokerRanking {
  id: string;
  name: string;
  avatar: string;
  sales: number;
  revenue: number;
  position: number;
  growth: number | null;
  email: string;
  userId?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  ticketMedio?: number;
  participationPct?: number;
}

export type SortField = 'vgv' | 'sales' | 'ticket' | 'growth';

export interface TeamRanking {
  id: string;
  name: string;
  totalVGV: number;
  totalSales: number;
  brokerCount: number;
  position: number;
}

export type RankingType = 'vendas' | 'captacao' | 'equipes' | 'atividades';
export type TVRankingMode = 'alternate' | 'vendas' | 'captacao';

// ===== MEDALS & ACHIEVEMENTS =====
export const getAchievements = (broker: BrokerRanking, allBrokers: BrokerRanking[]) => {
  const badges: { icon: string; label: string; color: string }[] = [];
  if (broker.position === 1) badges.push({ icon: "🏆", label: "Campeão", color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400" });
  if (broker.position <= 3 && broker.position > 1) badges.push({ icon: "🥇", label: `Top ${broker.position}`, color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400" });
  if (broker.sales >= 20) badges.push({ icon: "💎", label: "20+ Vendas", color: "from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400" });
  else if (broker.sales >= 10) badges.push({ icon: "🚀", label: "10+ Vendas", color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400" });
  else if (broker.sales >= 5) badges.push({ icon: "🔥", label: "5+ Vendas", color: "from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-400" });
  if (broker.revenue >= 5000000) badges.push({ icon: "👑", label: "5M+ VGV", color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400" });
  else if (broker.revenue >= 1000000) badges.push({ icon: "💰", label: "1M+ VGV", color: "from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400" });
  const maxRevenue = Math.max(...allBrokers.map(b => b.revenue));
  if (broker.revenue === maxRevenue && maxRevenue > 0) badges.push({ icon: "⚡", label: "Maior VGV", color: "from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-400" });
  if (broker.growth && broker.growth > 100) badges.push({ icon: "🌟", label: "Meteórico", color: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400" });
  else if (broker.growth && broker.growth > 50) badges.push({ icon: "📈", label: "Crescimento 50%+", color: "from-teal-500/20 to-cyan-500/10 border-teal-500/30 text-teal-400" });
  if (broker.sales > 0 && broker.position <= 5) badges.push({ icon: "🎯", label: "Top 5", color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400" });
  return badges;
};

// XP System
export const calculateXP = (broker: BrokerRanking) => {
  let xp = 0;
  xp += broker.sales * 500;
  xp += Math.floor(broker.revenue / 100000) * 100;
  if (broker.position === 1) xp += 2000;
  else if (broker.position === 2) xp += 1200;
  else if (broker.position === 3) xp += 800;
  else if (broker.position <= 5) xp += 400;
  if (broker.growth && broker.growth > 50) xp += 500;
  return xp;
};

export const getLevel = (xp: number): { level: number; title: string; color: string; icon: string; nextXp: number } => {
  if (xp >= 15000) return { level: 10, title: "Lenda", color: "text-yellow-400", icon: "👑", nextXp: 15000 };
  if (xp >= 10000) return { level: 9, title: "Mestre", color: "text-purple-400", icon: "🔮", nextXp: 15000 };
  if (xp >= 7500) return { level: 8, title: "Elite", color: "text-blue-400", icon: "💎", nextXp: 10000 };
  if (xp >= 5000) return { level: 7, title: "Veterano", color: "text-cyan-400", icon: "⚡", nextXp: 7500 };
  if (xp >= 3500) return { level: 6, title: "Experiente", color: "text-emerald-400", icon: "🌟", nextXp: 5000 };
  if (xp >= 2500) return { level: 5, title: "Avançado", color: "text-green-400", icon: "🔥", nextXp: 3500 };
  if (xp >= 1500) return { level: 4, title: "Intermediário", color: "text-lime-400", icon: "⭐", nextXp: 2500 };
  if (xp >= 800) return { level: 3, title: "Iniciante", color: "text-orange-400", icon: "🎯", nextXp: 1500 };
  if (xp >= 200) return { level: 2, title: "Novato", color: "text-slate-400", icon: "🌱", nextXp: 800 };
  return { level: 1, title: "Recruta", color: "text-slate-500", icon: "🏁", nextXp: 200 };
};

export const getXPProgress = (xp: number) => {
  const level = getLevel(xp);
  const prevThresholds = [0, 200, 800, 1500, 2500, 3500, 5000, 7500, 10000, 15000];
  const currentThreshold = prevThresholds[level.level - 1] || 0;
  if (level.level === 10) return 100;
  return Math.min(((xp - currentThreshold) / (level.nextXp - currentThreshold)) * 100, 100);
};
