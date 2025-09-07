import Navigation from "@/components/Navigation";
import RankingPodium from "@/components/RankingPodium";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

const Ranking = () => {
  const brokerRankings = [
    {
      id: "1",
      name: "Ana Silva",
      avatar: "/placeholder.svg",
      sales: 8,
      revenue: 850000,
      position: 1,
      growth: 15.2
    },
    {
      id: "2", 
      name: "Carlos Santos",
      avatar: "/placeholder.svg",
      sales: 6,
      revenue: 720000,
      position: 2,
      growth: 8.7
    },
    {
      id: "3",
      name: "Maria Oliveira", 
      avatar: "/placeholder.svg",
      sales: 5,
      revenue: 650000,
      position: 3,
      growth: -2.1
    },
    {
      id: "4",
      name: "João Costa",
      avatar: "/placeholder.svg", 
      sales: 4,
      revenue: 520000,
      position: 4,
      growth: 12.5
    },
    {
      id: "5",
      name: "Paula Lima",
      avatar: "/placeholder.svg",
      sales: 3,
      revenue: 420000,
      position: 5,
      growth: 6.8
    },
    {
      id: "6",
      name: "Roberto Alves",
      avatar: "/placeholder.svg",
      sales: 3,
      revenue: 380000,
      position: 6,
      growth: -1.4
    },
    {
      id: "7",
      name: "Fernanda Souza",
      avatar: "/placeholder.svg",
      sales: 2,
      revenue: 320000,
      position: 7,
      growth: 4.2
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-warning" />
            <h1 className="text-3xl font-bold text-foreground">Ranking de Corretores</h1>
          </div>
          <p className="text-muted-foreground">
            Performance e classificação dos corretores do mês
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Podium */}
          <div className="lg:col-span-2">
            <RankingPodium brokers={brokerRankings} />
          </div>

          {/* Detailed Rankings */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gradient-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Ranking Completo
              </h3>
              
              <div className="space-y-4">
                {brokerRankings.map((broker, index) => (
                  <div 
                    key={broker.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        #{broker.position}
                      </div>
                      
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={broker.avatar} alt={broker.name} />
                        <AvatarFallback>
                          {broker.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {broker.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {broker.sales} vendas realizadas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          R$ {broker.revenue.toLocaleString('pt-BR')}
                        </p>
                        <div className="flex items-center gap-1">
                          {broker.growth > 0 ? (
                            <TrendingUp className="w-3 h-3 text-success" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-destructive" />
                          )}
                          <span className={`text-xs ${broker.growth > 0 ? 'text-success' : 'text-destructive'}`}>
                            {broker.growth > 0 ? '+' : ''}{broker.growth}%
                          </span>
                        </div>
                      </div>

                      {broker.position <= 3 && (
                        <Badge 
                          variant={broker.position === 1 ? "default" : "secondary"}
                          className="animate-glow-pulse"
                        >
                          {broker.position === 1 ? "🏆 Campeão" : 
                           broker.position === 2 ? "🥈 Vice" : "🥉 Terceiro"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;