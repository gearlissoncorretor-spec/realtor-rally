import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via recovery link — show form
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      toast({ title: "Senha fraca", description: "A senha deve conter letras e números.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas diferentes", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: {
          must_change_password: false,
          temp_password_set_at: null,
        },
      });
      if (error) throw error;

      setSuccess(true);
      toast({ title: "Senha atualizada!", description: "Sua senha foi redefinida com sucesso." });
      setTimeout(() => navigate("/"), 2000);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível redefinir a senha.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const orgName = settings?.organization_name || 'Gestão Master';

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md animate-float-up">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card mb-4">
            <KeyRound className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Redefinir Senha</h1>
          <p className="text-muted-foreground text-sm">Digite sua nova senha para acessar o {orgName}</p>
        </div>

        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Senha Atualizada!</h2>
              <p className="text-muted-foreground text-sm">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white/90 font-medium text-sm">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <p className="text-xs text-white/50">Mínimo 8 caracteres com letras e números</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white/90 font-medium text-sm">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] gap-2 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                {isSubmitting ? "Atualizando..." : "Redefinir Senha"}
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Button variant="link" className="text-white/60 hover:text-white text-sm" onClick={() => navigate("/auth")}>
            Voltar para o login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
