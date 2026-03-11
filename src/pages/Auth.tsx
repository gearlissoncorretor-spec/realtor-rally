import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, KeyRound, Loader2, ArrowLeft, Mail } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  
  const { signIn, resetPassword, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      if (error) {
        toast({ title: "Erro no login", description: error.message || "Credenciais inválidas", variant: "destructive" });
        setIsSubmitting(false);
      } else {
        toast({ title: "Login realizado", description: "Bem-vindo ao sistema!" });
      }
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await resetPassword(forgotEmail);
      if (error) {
        toast({ title: "Erro", description: error.message || "Não foi possível enviar o email.", variant: "destructive" });
      } else {
        setResetSent(true);
        toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      }
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const orgName = settings?.organization_name || 'Axis';
  const tagline = settings?.organization_tagline || 'A evolução da gestão imobiliária';
  const effectiveLogo = settings?.logo_icon_url || settings?.logo_url || null;
  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-md animate-float-up">
        {/* Logo and Title */}
        <div className="text-center mb-10 space-y-4">
          {effectiveLogo ? (
            <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl glass-card mb-2 hover-lift overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-shadow duration-500 hover:shadow-[0_0_60px_rgba(59,130,246,0.3)]">
              <img src={effectiveLogo} alt={orgName} className="w-full h-full object-contain p-3" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl glass-card mb-2 hover-lift border border-primary/20 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
              <span className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {initial}
              </span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">{orgName}</h1>
          <p className="text-blue-400 text-base sm:text-lg font-semibold tracking-wide leading-relaxed max-w-sm mx-auto">
            Plataforma profissional para gestão de vendas imobiliárias
          </p>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            💡 Organize clientes, negociações e resultados em <strong className="text-white/70">um único sistema</strong>.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl hover-lift">
          {showForgotPassword ? (
            // Forgot Password View
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                  onClick={() => { setShowForgotPassword(false); setResetSent(false); setForgotEmail(""); }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-bold text-white">Esqueci minha senha</h2>
              </div>

              {resetSent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 mb-2">
                    <Mail className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Email Enviado!</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Enviamos um link de redefinição para <strong className="text-white/80">{forgotEmail}</strong>. 
                    Verifique sua caixa de entrada e spam.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                    onClick={() => { setShowForgotPassword(false); setResetSent(false); setForgotEmail(""); }}
                  >
                    Voltar ao login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <p className="text-white/60 text-sm">
                    Informe seu email cadastrado. Enviaremos um link para redefinir sua senha.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-white/90 font-medium text-sm">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            // Login View
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold text-white">Acessar o sistema</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 font-medium text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 font-medium text-sm">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 text-white/70 hover:text-white rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  className="text-blue-400 hover:text-blue-300 text-sm p-0 h-auto font-medium"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Esqueci minha senha
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-13 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-base rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_30px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] gap-2 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>🚀</span>}
                {isSubmitting ? "Entrando..." : "Entrar no Sistema"}
              </Button>

              <p className="text-center text-white/40 text-xs mt-4 italic">
                Grandes vendas começam com organização.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-white/30 text-xs font-medium">
            Versão 1.0 &nbsp;|&nbsp; © {new Date().getFullYear()} {orgName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
