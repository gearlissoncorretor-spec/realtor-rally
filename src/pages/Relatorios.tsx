import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Relatorios = () => {
  const { toast } = useToast();

  const handleGenerateReport = (reportTitle: string) => {
    toast({
      title: "Relatório gerado",
      description: `${reportTitle} foi gerado com sucesso.`,
    });
  };

  const handleDownloadReport = (reportTitle: string) => {
    toast({
      title: "Download iniciado",
      description: `Download do ${reportTitle} iniciado.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="lg:ml-64 pt-16 lg:pt-0 p-4 lg:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
            Relatórios
          </h1>
          <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Gere relatórios detalhados de vendas e performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Relatório de Vendas",
              description: "Vendas por período e corretor",
              icon: <BarChart3 className="w-8 h-8 text-primary" />,
              color: "bg-primary/10"
            },
            {
              title: "Performance Mensal",
              description: "Análise de metas e resultados",
              icon: <TrendingUp className="w-8 h-8 text-success" />,
              color: "bg-success/10"
            },
            {
              title: "Ranking de Corretores",
              description: "Classificação por desempenho",
              icon: <Users className="w-8 h-8 text-info" />,
              color: "bg-info/10"
            }
          ].map((report, index) => (
            <Card key={report.title} className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className={`w-16 h-16 ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                {report.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{report.title}</h3>
              <p className="text-muted-foreground mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleGenerateReport(report.title)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadReport(report.title)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Relatorios;