import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { Helmet } from "react-helmet-async";

const Landing = () => {
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();

  const supportPhone = (settings?.support_phone || '62982062205').replace(/\D/g, '');
  const supportMessage = 'Olá, gostaria de saber mais sobre o Gestão Master.';
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodeURIComponent(supportMessage)}`;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-green-500/30">
      <Helmet>
        <title>Gestão Master | Sistema de Gestão Imobiliária</title>
        <meta name="description" content="Aumente suas vendas imobiliárias com um sistema inteligente. Controle total, ranking de corretores e gestão completa em um só lugar."/>
        <meta property="og:title" content="🚀 Aumente suas vendas imobiliárias hoje" />
        <meta property="og:description" content="Sistema completo com ranking, metas e controle total. Veja como escalar sua imobiliária." />
        <meta property="og:image" content="https://gestaomaster.app.br/preview.jpg" />
        <meta property="og:url" content="https://gestaomaster.app.br/landing" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gestão Master" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="max-w-[900px] mx-auto px-5 py-10 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight animate-fade-in">
          🚀 Transforme sua imobiliária em uma máquina de vendas
        </h1>
        
        <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-100">
          Controle completo de captação, vendas, metas e ranking de corretores em um único sistema.
        </p>

        <div className="mb-12 animate-fade-in delay-200">
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-[#22c55e] hover:bg-[#16a34a] text-black px-8 py-4 text-lg sm:text-xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/20"
          >
            Quero aumentar minhas vendas
          </a>
        </div>

        <div className="mt-10 rounded-xl overflow-hidden shadow-2xl animate-fade-in delay-300">
          <img 
            src="https://gestaomaster.app.br/dashboard.jpg" 
            alt="Sistema Gestão Master" 
            className="w-full h-auto rounded-xl"
          />
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Button 
            variant="ghost" 
            className="text-white/50 hover:text-white hover:bg-white/5"
            onClick={() => navigate("/auth")}
          >
            Acessar Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
