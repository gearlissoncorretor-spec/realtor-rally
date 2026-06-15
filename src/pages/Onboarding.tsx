import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Building2, Palette, Users, ArrowRight, ArrowLeft, Check,
  SkipForward, X, Mail, Sparkles
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const STEPS = [
  { icon: Building2, label: "Dados da Imobiliária", desc: "Conte-nos sobre sua empresa" },
  { icon: Palette, label: "Personalização", desc: "Escolha a identidade visual" },
  { icon: Users, label: "Convide sua Equipe", desc: "Adicione gerentes e corretores" },
];

const COLOR_OPTIONS = [
  { hex: "#3b82f6", name: "Azul" },
  { hex: "#6366f1", name: "Índigo" },
  { hex: "#8b5cf6", name: "Violeta" },
  { hex: "#ec4899", name: "Rosa" },
  { hex: "#f43f5e", name: "Vermelho" },
  { hex: "#f97316", name: "Laranja" },
  { hex: "#eab308", name: "Amarelo" },
  { hex: "#22c55e", name: "Verde" },
  { hex: "#14b8a6", name: "Turquesa" },
  { hex: "#06b6d4", name: "Ciano" },
  { hex: "#0ea5e9", name: "Céu" },
  { hex: "#64748b", name: "Cinza" },
];

const formatPhoneBR = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const addEmailsFromInput = () => {
    const parts = inviteInput.split(/[,;\s\n]+/).map(p => p.trim()).filter(Boolean);
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const p of parts) {
      if (isValidEmail(p) && !inviteEmails.includes(p)) valid.push(p);
      else if (!isValidEmail(p)) invalid.push(p);
    }
    if (valid.length) setInviteEmails(prev => [...prev, ...valid]);
    setInviteInput("");
    setEmailError(invalid.length ? `E-mail inválido: ${invalid.join(", ")}` : "");
  };

  const removeEmail = (email: string) =>
    setInviteEmails(prev => prev.filter(e => e !== email));

  const handleSetupCompany = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-company", {
        body: {
          company_name: companyName.trim(),
          phone: phone.trim(),
          primary_color: primaryColor,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Send invites if provided
      if (inviteEmails.length > 0 && data?.company?.id) {
        let sent = 0;
        for (const email of inviteEmails) {
          try {
            await supabase.functions.invoke("send-credentials", {
              body: { email, company_id: data.company.id },
            });
            sent++;
          } catch {
            console.warn("Failed to send invite to:", email);
          }
        }
        if (sent > 0) {
          toast({
            title: `${sent} convite(s) enviado(s)`,
            description: "Sua equipe receberá um e-mail com as credenciais.",
          });
        }
      }

      toast({
        title: "Empresa criada com sucesso! 🎉",
        description: "Redirecionando para o painel...",
      });

      setTimeout(() => (window.location.href = "/"), 1200);
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
      // If user typed but didn't add, try to add before finalizing
      if (inviteInput.trim()) addEmailsFromInput();
      handleSetupCompany();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkipInvites = () => {
    setInviteEmails([]);
    setInviteInput("");
    handleSetupCompany();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-xl animate-float-up">
        {/* Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl glass-card mb-1">
            <Sparkles className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Vamos configurar sua imobiliária
          </h1>
          <p className="text-white/50 text-sm">
            Leva menos de 1 minuto para começar
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-blue-500 text-white ring-4 ring-blue-500/20"
                    : "bg-white/10 text-white/40"
                }`}
              >
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
          <div className="flex items-start gap-3 mb-6">
            {(() => {
              const Icon = STEPS[step].icon;
              return (
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
              );
            })()}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white leading-tight">
                {STEPS[step].label}
              </h2>
              <p className="text-white/50 text-xs mt-0.5">{STEPS[step].desc}</p>
            </div>
            <span className="text-white/30 text-sm font-medium">
              {step + 1}/3
            </span>
          </div>

          {/* Step 1: Company Data */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/90 font-medium text-sm">
                  Nome da imobiliária <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ex: Imobiliária Premium"
                  maxLength={100}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 rounded-xl h-12"
                />
                <p className="text-white/30 text-xs">
                  {companyName.length}/100 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium text-sm">
                  Telefone para contato <span className="text-white/40">(opcional)</span>
                </Label>
                <Input
                  value={phone}
                  onChange={e => setPhone(formatPhoneBR(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 rounded-xl h-12"
                />
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-white/60 text-sm">
                Escolha a cor principal da sua marca. Você poderá ajustar logo, slogan
                e mais cores depois em <span className="text-white/90 font-medium">Configurações</span>.
              </p>
              <div className="grid grid-cols-6 gap-3">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setPrimaryColor(c.hex)}
                    title={c.name}
                    className={`relative w-full aspect-square rounded-xl transition-all hover:scale-110 ${
                      primaryColor === c.hex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {primaryColor === c.hex && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
              <div
                className="p-4 rounded-xl border bg-white/5"
                style={{ borderColor: primaryColor + "60" }}
              >
                <p className="text-white/50 text-xs mb-3">Pré-visualização</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {companyName.trim().charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {companyName.trim() || "Sua Imobiliária"}
                    </p>
                    <p className="text-white/40 text-xs">Painel de gestão</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Ação
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Invites */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-white/60 text-sm">
                Convide gerentes e corretores. Eles receberão um e-mail com as credenciais
                e poderão acessar o sistema imediatamente.
              </p>
              <div className="space-y-2">
                <Label className="text-white/90 font-medium text-sm">
                  E-mails da equipe
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteInput}
                    onChange={e => {
                      setInviteInput(e.target.value);
                      setEmailError("");
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addEmailsFromInput();
                      }
                    }}
                    placeholder="corretor@empresa.com"
                    type="email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 rounded-xl h-11"
                  />
                  <Button
                    type="button"
                    onClick={addEmailsFromInput}
                    disabled={!inviteInput.trim()}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-400/40 rounded-xl h-11 px-4"
                  >
                    Adicionar
                  </Button>
                </div>
                {emailError && (
                  <p className="text-red-400 text-xs">{emailError}</p>
                )}
                <p className="text-white/30 text-xs">
                  Pressione Enter ou vírgula para adicionar múltiplos e-mails.
                </p>
              </div>

              {inviteEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/60 text-xs font-medium">
                    {inviteEmails.length} convite(s) prontos para enviar:
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-white/5 border border-white/10">
                    {inviteEmails.map(email => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="bg-blue-500/20 text-white hover:bg-blue-500/30 border border-blue-400/30 gap-1.5 pl-2 pr-1 py-1 rounded-lg"
                      >
                        <Mail className="w-3 h-3" />
                        <span className="text-xs">{email}</span>
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="hover:bg-white/20 rounded p-0.5 ml-0.5"
                          aria-label={`Remover ${email}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-white/30 text-xs flex items-center gap-1.5 pt-2 border-t border-white/5">
                <SkipForward className="w-3 h-3" />
                Você pode pular esta etapa e convidar depois em Gestão de Usuários.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-7">
            {step > 0 && !isSubmitting && (
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {step === 2 && !isSubmitting && (
              <Button
                variant="ghost"
                onClick={handleSkipInvites}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-12 px-4"
              >
                Pular
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] gap-2 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Criando sua empresa...
                </>
              ) : step === 2 ? (
                <>
                  <Check className="w-5 h-5" /> Finalizar e acessar
                </>
              ) : (
                <>
                  Próximo <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          🔒 Seus dados estão seguros • Você pode alterar tudo depois
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
