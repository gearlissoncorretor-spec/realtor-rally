import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Palette, Users, ArrowRight, ArrowLeft, Check, SkipForward } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const STEPS = [
  { icon: Building2, label: "Dados da Imobiliária" },
  { icon: Palette, label: "Personalização" },
  { icon: Users, label: "Convide sua Equipe" },
];

const COLOR_OPTIONS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
  "#f43f5e", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9",
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [inviteEmails, setInviteEmails] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetupCompany = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-company", {
        body: {
          company_name: companyName,
          phone,
          primary_color: primaryColor,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Send invites if provided
      const emails = inviteEmails.split(/[,;\n]/).map(e => e.trim()).filter(Boolean);
      if (emails.length > 0 && data?.company?.id) {
        for (const email of emails) {
          try {
            await supabase.functions.invoke("send-credentials", {
              body: { email, company_id: data.company.id },
            });
          } catch {
            console.warn("Failed to send invite to:", email);
          }
        }
      }

      toast({ title: "Empresa criada com sucesso!", description: "Redirecionando para o painel..." });
      
      // Force reload to refresh auth context with new company_id
      setTimeout(() => window.location.href = "/", 1000);
    } catch (error: any) {
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return companyName.trim().length >= 2;
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      handleSetupCompany();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-lg animate-float-up">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card mb-2">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Configure sua Imobiliária</h1>
          <p className="text-white/50 text-sm">Preencha as informações para começar a usar o sistema</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i < step ? "bg-green-500 text-white" :
                i === step ? "bg-blue-500 text-white" :
                "bg-white/10 text-white/40"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-green-500" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-blue-400" />; })()}
            <h2 className="text-lg font-bold text-white">{STEPS[step].label}</h2>
            <span className="ml-auto text-white/30 text-sm">{step + 1}/3</span>
          </div>

          {/* Step 1: Company Data */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/90 font-medium text-sm">Nome da Imobiliária *</Label>
                <Input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ex: Imobiliária Premium"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium text-sm">Telefone (opcional)</Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 rounded-xl h-12"
                />
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-white/50 text-sm">Escolha a cor principal da sua marca. Você poderá personalizar mais depois.</p>
              <div className="grid grid-cols-6 gap-3">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${
                      primaryColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl border border-white/10" style={{ borderColor: primaryColor + "40" }}>
                <p className="text-white/60 text-xs">Pré-visualização:</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    {companyName.charAt(0).toUpperCase() || "A"}
                  </div>
                  <span className="text-white font-semibold">{companyName || "Sua Imobiliária"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Invites */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-white/50 text-sm">
                Convide gerentes e corretores para usar o sistema. Eles receberão um email com as credenciais de acesso.
              </p>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium text-sm">Emails (separados por vírgula)</Label>
                <textarea
                  value={inviteEmails}
                  onChange={e => setInviteEmails(e.target.value)}
                  placeholder={"gerente@empresa.com\ncorretor1@empresa.com\ncorretor2@empresa.com"}
                  rows={4}
                  className="flex w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none"
                />
              </div>
              <p className="text-white/30 text-xs flex items-center gap-1">
                <SkipForward className="w-3 h-3" /> Você pode pular esta etapa e convidar depois nas configurações.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Criando...</>
              ) : step === 2 ? (
                <><Check className="w-5 h-5" /> Finalizar</>
              ) : (
                <><ArrowRight className="w-5 h-5" /> Próximo</>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Você poderá alterar todas as configurações depois.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
