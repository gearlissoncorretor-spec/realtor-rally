import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Users, Target, ArrowRight, Star, Award, DollarSign, Home as HomeIcon } from "lucide-react";
import AuthButton from "@/components/AuthButton";
const Home = () => {
  const features = [{
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
    title: "Dashboard Inteligente",
    description: "Visualize seus KPIs e métricas em tempo real com gráficos interativos"
  }, {
    icon: <Award className="w-8 h-8 text-success" />,
    title: "Ranking Gamificado",
    description: "Sistema de ranking que motiva sua equipe de vendas com competição saudável"
  }, {
    icon: <DollarSign className="w-8 h-8 text-warning" />,
    title: "Gestão de Vendas",
    description: "Controle completo de todas as vendas com filtros avançados e relatórios"
  }, {
    icon: <Users className="w-8 h-8 text-info" />,
    title: "Equipe Conectada",
    description: "Gerencie corretores, metas e performance de forma centralizada"
  }];
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground px-[5px] py-[19px] my-[8px]">My Broker Senador Canedo</span>
          </div>
          
          <div className="flex items-center gap-4">
            <AuthButton />
            <Link to="/dashboard">
              <Button variant="outline" className="animate-fade-in">
                Acessar Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-success/10 rounded-full blur-3xl animate-bounce-gentle" style={{
          animationDelay: '1s'
        }}></div>
          <div className="absolute bottom-20 left-1/3 w-56 h-56 bg-info/10 rounded-full blur-3xl animate-bounce-gentle" style={{
          animationDelay: '2s'
        }}></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl text-foreground mb-6 animate-fade-in md:text-7xl font-bold">
            Transforme Suas
            <span className="block bg-gradient-primary bg-clip-text text-transparent animate-glow-pulse">Vendas em Dados</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            Plataforma completa para gestão de vendas, ranking de corretores e análise de performance em tempo real
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
          animationDelay: '0.4s'
        }}>
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all duration-300 transform hover:scale-105">
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/ranking">
              <Button size="lg" variant="outline" className="hover:bg-muted transition-all duration-300">
                Ver Ranking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[{
            label: "Vendas Ativas",
            value: "248",
            icon: <Target className="w-6 h-6" />
          }, {
            label: "Corretores",
            value: "12",
            icon: <Users className="w-6 h-6" />
          }, {
            label: "VGV Total",
            value: "R$ 2.4M",
            icon: <DollarSign className="w-6 h-6" />
          }, {
            label: "Taxa Conversão",
            value: "18.5%",
            icon: <TrendingUp className="w-6 h-6" />
          }].map((stat, index) => <div key={stat.label} className="text-center animate-scale-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 animate-fade-in">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{
            animationDelay: '0.1s'
          }}>
              Tudo que você precisa para gerenciar e potencializar suas vendas imobiliárias
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => <Card key={feature.title} className="p-8 bg-gradient-card border-border hover:shadow-lg transition-all duration-300 group animate-fade-in hover:scale-105" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-background rounded-lg group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 animate-fade-in">
            Pronto para Começar?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            Transforme sua gestão de vendas hoje mesmo com nossa plataforma completa
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-all duration-300">
                Acessar Dashboard
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/vendas">
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
                Ver Vendas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-background border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Gestão de  Equipe </span>
          </div>
          <p className="text-muted-foreground">© 2025 CRM Imobiliário. Transformando vendas com tecnologia.</p>
        </div>
      </footer>
    </div>;
};
export default Home;