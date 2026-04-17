import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import {
  BarChart3, Users, Kanban, Target, Trophy, DollarSign,
  FileText, Calendar, Check, Star, ChevronDown,
  ChevronUp, Smartphone, Shield, Upload, Clock, Zap, Eye,
  TrendingUp, Building2, Menu, X, PhoneCall, ArrowRight,
  Sparkles, ShieldCheck, Rocket
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ── Animated counter ──
const AnimatedCounter = ({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
};

// ── Fade-in wrapper ──
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
};

// ── Data ──
const FEATURES = [
  { icon: BarChart3, title: "Dashboard Inteligente", desc: "KPIs em tempo real com visão completa do seu negócio. Acompanhe VGV, vendas e performance." },
  { icon: Users, title: "Gestão de Equipes", desc: "Organize corretores em equipes com gerentes responsáveis. Hierarquia clara e dados isolados." },
  { icon: Kanban, title: "Pipeline de Negociações", desc: "Visualize cada negociação no Kanban. Controle temperatura, valores e próximos passos." },
  { icon: Target, title: "Follow-up Automatizado", desc: "Nunca perca um lead. Alertas de contato, histórico completo e conversão inteligente." },
  { icon: Trophy, title: "Metas e Ranking", desc: "Gamifique resultados com metas individuais e por equipe. Ranking em tempo real no Modo TV." },
  { icon: DollarSign, title: "Comissões", desc: "Controle comissões com parcelas, datas de vencimento e status de pagamento." },
  { icon: FileText, title: "Relatórios Avançados", desc: "Gráficos dinâmicos, filtros por período e exportação. Dados para decisões estratégicas." },
  { icon: DollarSign, title: "Pix Grátis", desc: "Integração para recebimento via Pix sem taxas bancárias abusivas. Gestão financeira simplificada." },
  { icon: Smartphone, title: "App Grátis", desc: "Instale o sistema como um aplicativo no seu celular (PWA). Acesso rápido e offline para corretores." },
  { icon: Calendar, title: "Agenda Integrada", desc: "Eventos, visitas e reuniões em um calendário compartilhado com a equipe." },
];

const PLANS = [
  {
    name: "Starter", price: "Grátis", period: "14 dias", popular: false,
    features: ["Até 5 usuários", "Dashboard básico", "Pipeline de negociações", "Pix Grátis", "Follow-up de clientes", "Suporte por email"],
    cta: "Começar grátis",
  },
  {
    name: "Professional", price: "R$ 197", period: "/mês", popular: true,
    features: ["Até 25 usuários", "Todas as funcionalidades", "Ranking e Modo TV", "Comissões avançadas", "Relatórios completos", "Suporte prioritário"],
    cta: "Assinar agora",
  },
  {
    name: "Enterprise", price: "Sob consulta", period: "", popular: false,
    features: ["Usuários ilimitados", "Suporte dedicado", "SLA garantido", "Onboarding personalizado", "API e integrações", "Treinamento da equipe"],
    cta: "Falar com vendas",
  },
];

const TESTIMONIALS = [
  { name: "Ricardo Mendes", role: "Diretor Comercial", company: "Mendes Imóveis", quote: "O Gestão Master transformou nossa gestão. Antes usávamos planilhas e perdíamos negociações. Hoje temos visão completa em tempo real.", stars: 5 },
  { name: "Carla Fonseca", role: "Gerente de Equipe", company: "Premium Imobiliária", quote: "O ranking com gamificação aumentou a produtividade dos meus corretores em 40%. Eles adoram competir de forma saudável.", stars: 5 },
  { name: "André Oliveira", role: "CEO", company: "Oliveira & Associados", quote: "Migrei de outro sistema em 1 dia. A importação de dados foi simples e o suporte me ajudou em tudo. Recomendo demais.", stars: 5 },
];

const FAQS = [
  { q: "Preciso instalar alguma coisa?", a: "Não! O Gestão Master funciona 100% no navegador e também pode ser instalado como app no celular (PWA). Nenhuma configuração técnica necessária." },
  { q: "Posso usar no celular?", a: "Sim! O sistema é totalmente responsivo e pode ser instalado como aplicativo no seu celular, funcionando como um app nativo." },
  { q: "Meus dados estão seguros?", a: "Totalmente. Cada imobiliária tem seus dados isolados (multi-tenant), com criptografia e backups automáticos. Nenhum dado vaza entre empresas." },
  { q: "Como migro meus dados?", a: "Você pode importar dados via Excel/CSV diretamente pelo sistema. O processo é simples e guiado passo a passo." },
  { q: "Tem período de teste?", a: "Sim! Oferecemos 14 dias grátis com acesso completo ao plano Professional. Sem necessidade de cartão de crédito." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem fidelidade. Você pode cancelar ou fazer downgrade do plano quando quiser, sem taxas extras." },
];

const TABS = [
  { label: "Dashboard", icon: BarChart3 },
  { label: "Negociações", icon: Kanban },
  { label: "Ranking", icon: Trophy },
];

const Landing = () => {
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [annual, setAnnual] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const goLogin = () => navigate("/auth");
  const supportPhone = (settings?.support_phone || '62982062205').replace(/\D/g, '');
  const supportMessage = 'Olá, gostaria de solicitar acesso ao sistema.';
  const contactUrl = supportPhone
    ? `https://wa.me/${supportPhone}?text=${encodeURIComponent(supportMessage)}`
    : '';
  const handleContactClick = () => {
    if (!contactUrl) return;
    window.open(contactUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-blue-500/30">
      <FloatingWhatsApp phoneNumber={settings?.support_phone || '62982062205'} />
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Gestão Master</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition">Recursos</a>
            <a href="#pricing" className="hover:text-white transition">Preços</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={goLogin}>Entrar</Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleContactClick} disabled={!contactUrl}>
              Saiba mais
            </Button>
          </div>
          <button className="md:hidden text-white/70" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl overflow-hidden">
              <div className="px-4 py-4 flex flex-col gap-3">
                <a href="#features" className="text-white/60 hover:text-white py-2" onClick={() => setMobileMenu(false)}>Recursos</a>
                <a href="#pricing" className="text-white/60 hover:text-white py-2" onClick={() => setMobileMenu(false)}>Preços</a>
                <a href="#faq" className="text-white/60 hover:text-white py-2" onClick={() => setMobileMenu(false)}>FAQ</a>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full" onClick={handleContactClick} disabled={!contactUrl}>
                  Saiba mais
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
              <Zap className="w-4 h-4" /> Usado por 150+ imobiliárias no Brasil
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-8">
              A evolução da<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">gestão imobiliária</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Controle vendas, equipes, negociações e metas em uma única plataforma inteligente. 
              Elimine o caos das planilhas e escale seus resultados hoje mesmo.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 h-14 text-base font-semibold rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all gap-2 w-full sm:w-auto"
                onClick={handleContactClick} disabled={!contactUrl}>
                <PhoneCall className="w-5 h-5" /> Saiba mais
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-14 text-base rounded-xl gap-2 w-full sm:w-auto">
                <Eye className="w-5 h-5" /> Ver demonstração
              </Button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-white/30 text-sm flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Acesso mediante contato com suporte: <strong>(62) 98206-2205</strong>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SOCIAL PROOF COUNTERS ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 150, suffix: "+", label: "Imobiliárias" },
            { value: 2400, suffix: "+", label: "Corretores" },
            { value: 18000, suffix: "+", label: "Vendas registradas" },
            { value: 99.9, suffix: "%", label: "Uptime" },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </div>
                <p className="text-white/40 text-sm mt-1">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Chega de <span className="text-red-400">caos</span>. Bem-vindo ao <span className="text-blue-400">controle</span>.</h2>
              <p className="text-white/40 max-w-xl mx-auto">Problemas comuns que imobiliárias enfrentam — e como o Gestão Master resolve cada um.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { problem: "Planilhas infinitas e desorganizadas", solution: "Dashboard centralizado com dados em tempo real", icon: BarChart3 },
              { problem: "Sem visibilidade sobre a equipe", solution: "Hierarquia clara com métricas por corretor e equipe", icon: Users },
              { problem: "Leads se perdendo no processo", solution: "Pipeline visual com follow-up automático e alertas", icon: Target },
              { problem: "Comissões calculadas na mão", solution: "Gestão de comissões com parcelas e controle financeiro", icon: DollarSign },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 transition-all group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition">
                    <item.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-red-400/80 text-sm line-through mb-1">{item.problem}</p>
                    <p className="text-white font-semibold">{item.solution}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 sm:py-28 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Tudo que você precisa, em um só lugar</h2>
              <p className="text-white/40 max-w-xl mx-auto">Funcionalidades completas para gerenciar sua imobiliária de ponta a ponta.</p>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 hover:bg-white/[0.05] transition-all group h-full">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition">
                    <f.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO TABS ── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Veja o sistema em ação</h2>
              <p className="text-white/40">Explore as principais telas do Gestão Master</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="flex justify-center gap-2 mb-8">
              {TABS.map((tab, i) => (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === i ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden aspect-video flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4 text-center p-8">
                  {(() => { const Icon = TABS[activeTab].icon; return <Icon className="w-16 h-16 text-blue-400/50" />; })()}
                  <h3 className="text-xl font-bold text-white/70">{TABS[activeTab].label}</h3>
                  <p className="text-white/30 text-sm max-w-md">
                    {activeTab === 0 && "Visão completa de KPIs, VGV, vendas e performance em gráficos interativos."}
                    {activeTab === 1 && "Pipeline visual com Kanban drag-and-drop, temperatura de leads e conversão."}
                    {activeTab === 2 && "Ranking em tempo real com pódio animado e Modo TV para exibição em telas."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 sm:py-28 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Planos que crescem com você</h2>
              <p className="text-white/40 mb-6">Comece grátis e escale conforme sua operação.</p>
              <div className="inline-flex items-center gap-3 bg-white/5 rounded-full p-1">
                <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm transition ${!annual ? "bg-blue-500 text-white" : "text-white/50"}`}>
                  Mensal
                </button>
                <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm transition ${annual ? "bg-blue-500 text-white" : "text-white/50"}`}>
                  Anual <span className="text-green-400 text-xs ml-1">-20%</span>
                </button>
              </div>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className={`relative p-8 rounded-2xl border transition-all h-full flex flex-col ${
                  plan.popular
                    ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)]"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Mais popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-white">
                      {plan.price === "Grátis" ? "Grátis" : annual && plan.price !== "Sob consulta" ? "R$ 157" : plan.price}
                    </span>
                    <span className="text-white/40 text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleContactClick} disabled={!contactUrl}
                    className={`w-full h-12 rounded-xl font-semibold ${
                      plan.popular ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-white/10 hover:bg-white/15 text-white"
                    }`}>
                    {plan.cta}
                  </Button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">O que dizem nossos clientes</h2>
              <p className="text-white/40">Imobiliárias que transformaram sua operação com o Gestão Master.</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                      <p className="text-white/40 text-xs">{t.role} • {t.company}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 sm:py-28 px-4 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Perguntas frequentes</h2>
              <p className="text-white/40">Tudo que você precisa saber antes de começar.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-white/5 rounded-xl bg-white/[0.02] px-6 overflow-hidden">
                  <AccordionTrigger className="text-white font-medium text-left hover:no-underline py-5 text-sm sm:text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/50 text-sm pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Pronto para transformar sua gestão?</h2>
                <p className="text-white/50 mb-8 max-w-md mx-auto">
                  Junte-se a mais de 150 imobiliárias que já usam o Gestão Master para vender mais e melhor.
                </p>
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-10 h-14 text-base font-semibold rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] transition-all gap-2"
                  onClick={handleContactClick} disabled={!contactUrl}>
                  Entrar em contato <PhoneCall className="w-5 h-5" />
                </Button>
                <p className="text-white/30 text-sm mt-4">Acesso mediante contato com suporte</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Gestão Master</span>
              <p className="text-white/30 text-sm mt-2">A evolução da gestão imobiliária.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white/70 mb-3 text-sm">Produto</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="#features" className="hover:text-white transition">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Preços</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/70 mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="#" className="hover:text-white transition">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} Axis. Todos os direitos reservados.</p>
            <p className="text-white/20 text-xs">Feito com ❤️ no Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
