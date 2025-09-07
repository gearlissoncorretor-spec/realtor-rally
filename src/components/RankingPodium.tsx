import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrokerRanking {
  id: string;
  name: string;
  avatar?: string;
  sales: number;
  revenue: number;
  position: number;
}

interface RankingPodiumProps {
  brokers: BrokerRanking[];
}

const RankingPodium = ({ brokers }: RankingPodiumProps) => {
  const top3 = brokers.slice(0, 3);
  
  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1: return "h-32";
      case 2: return "h-24";
      case 3: return "h-20";
      default: return "h-16";
    }
  };

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-6 h-6 text-warning" />;
      case 2: return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3: return <Award className="w-5 h-5 text-property-accent" />;
      default: return null;
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1: return "bg-gradient-to-t from-warning/20 to-warning/10 border-warning/30";
      case 2: return "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/30";
      case 3: return "bg-gradient-to-t from-property-accent/20 to-property-accent/10 border-property-accent/30";
      default: return "bg-gradient-card";
    }
  };

  // Reorder for podium display (2nd, 1st, 3rd)
  const podiumOrder = [
    top3.find(b => b.position === 2),
    top3.find(b => b.position === 1),
    top3.find(b => b.position === 3)
  ].filter(Boolean) as BrokerRanking[];

  return (
    <Card className="p-6 bg-gradient-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-warning" />
        <h3 className="text-lg font-semibold text-foreground">Top Corretores</h3>
      </div>

      <div className="flex items-end justify-center gap-4 mb-6">
        {podiumOrder.map((broker, index) => (
          <div
            key={broker.id}
            className="flex flex-col items-center animate-podium-rise"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {/* Avatar and info */}
            <div className="flex flex-col items-center mb-3">
              <Avatar className="w-16 h-16 mb-2 ring-2 ring-primary/20">
                <AvatarImage src={broker.avatar} alt={broker.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {broker.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium text-foreground text-center">
                {broker.name}
              </p>
              <p className="text-xs text-muted-foreground">
                R$ {broker.revenue.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Podium base */}
            <div className={cn(
              "relative w-20 rounded-t-lg border-2 flex flex-col items-center justify-end p-2",
              getPodiumHeight(broker.position),
              getPodiumColor(broker.position)
            )}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                {getPodiumIcon(broker.position)}
              </div>
              <Badge 
                variant="secondary" 
                className="bg-background/80 text-foreground font-bold"
              >
                #{broker.position}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Additional rankings */}
      {brokers.length > 3 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Outros Corretores
          </h4>
          {brokers.slice(3, 7).map((broker) => (
            <div 
              key={broker.id} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-6">
                  #{broker.position}
                </span>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={broker.avatar} alt={broker.name} />
                  <AvatarFallback className="text-xs">
                    {broker.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {broker.name}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {broker.sales} vendas
                </p>
                <p className="text-xs text-muted-foreground">
                  R$ {broker.revenue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RankingPodium;