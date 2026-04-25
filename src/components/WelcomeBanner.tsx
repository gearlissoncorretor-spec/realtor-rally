import { useAuth } from "@/contexts/AuthContext";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const TIPS = [
  { icon: TrendingUp, text: "Acompanhe metas em tempo real no Ranking", route: "/ranking" },
  { icon: Calendar, text: "Organize compromissos na Agenda", route: "/agenda" },
  { icon: Zap, text: "Use a Central do Gestor para visão consolidada", route: "/central-gestor" },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

export const WelcomeBanner = () => {
  const { profile } = useAuth();
  const { settings } = useOrganizationSettings();
  const navigate = useNavigate();
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTipIndex(p => (p + 1) % TIPS.length), 5000);
    return () => clearInterval(interval);
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] || "Corretor";
  const tip = TIPS[tipIndex];
  const TipIcon = tip.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card p-5 mb-6"
    >
      {/* Decorative shimmer */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">
              {getGreeting()}, {firstName}! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bem-vindo de volta ao {settings?.organization_name || "sistema"}.
            </p>
          </div>
        </div>

        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm cursor-pointer hover:border-primary/30 transition-all"
          onClick={() => navigate(tip.route)}
        >
          <TipIcon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">{tip.text}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">→</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
