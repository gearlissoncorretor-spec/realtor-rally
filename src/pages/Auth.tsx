import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, Building2, Sparkles, Loader2 } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "", 
    fullName: "" 
  });
  
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useOrganizationSettings();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth state
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
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive"
        });
        setIsSubmitting(false);
      } else {
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao sistema!"
        });
        // Navigation will happen automatically via useEffect
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message || "Não foi possível criar a conta",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Conta criada",
          description: "Aguarde aprovação de um administrador para acessar o sistema"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-float-up">
        {/* Logo and Title - Axis Branding */}
        <div className="text-center mb-10 space-y-5">
          {settings?.logo_icon_url ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-card mb-4 hover-lift overflow-hidden">
              <img 
                src={settings.logo_icon_url} 
                alt="Axis"
                className="w-full h-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-card mb-4 hover-lift border border-primary/20">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                A
              </span>
            </div>
          )}
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight">
            Axis
          </h1>
          <p className="text-primary text-base font-medium tracking-wide">
            A evolução da gestão imobiliária
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl hover-lift">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 rounded-xl mb-6">
              <TabsTrigger 
                value="login"
                className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 font-medium transition-all duration-300"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-lg data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 font-medium transition-all duration-300"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 font-medium text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 font-medium text-sm">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 pr-12 transition-all duration-300"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] gap-2 mt-6" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white/90 font-medium text-sm">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Seu nome completo"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupEmail" className="text-white/90 font-medium text-sm">
                    Email
                  </Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signupPassword" className="text-white/90 font-medium text-sm">
                    Senha
                  </Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/90 font-medium text-sm">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 rounded-xl h-12 transition-all duration-300"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] gap-2 mt-6" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  {isSubmitting ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-xs font-medium">
            © 2025 Axis. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
