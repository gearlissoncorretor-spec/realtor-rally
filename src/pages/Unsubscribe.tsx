import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertTriangle, MailX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://kwsnnwiwflsvsqiuzfja.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c25ud2l3ZmxzdnNxaXV6ZmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjUxNzYsImV4cCI6MjA3Mjg0MTE3Nn0._wkwx1DF3dU3prxTZ-w1jANj4uJS1u1tXzN4D4bq5wY";

type State = "validating" | "ready" | "already" | "invalid" | "submitting" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("validating");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    document.title = "Cancelar inscrição | Gestão Master";
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data.valid) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("success");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else {
        setErrorMsg(data?.error || "Não foi possível processar.");
        setState("error");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao processar.");
      setState("error");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {state === "success" || state === "already" ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : state === "invalid" || state === "error" ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <MailX className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <CardTitle>
            {state === "success" && "Inscrição cancelada"}
            {state === "already" && "Já cancelado"}
            {state === "invalid" && "Link inválido"}
            {state === "error" && "Algo deu errado"}
            {(state === "validating" || state === "ready" || state === "submitting") && "Cancelar inscrição de e-mails"}
          </CardTitle>
          <CardDescription>
            {state === "validating" && "Validando seu link..."}
            {state === "ready" && "Confirme abaixo para parar de receber e-mails deste sistema."}
            {state === "submitting" && "Processando..."}
            {state === "success" && "Você não receberá mais e-mails deste sistema."}
            {state === "already" && "Este e-mail já está fora da nossa lista."}
            {state === "invalid" && "O link de cancelamento é inválido ou expirou."}
            {state === "error" && (errorMsg || "Tente novamente em alguns instantes.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {state === "validating" || state === "submitting" ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : state === "ready" ? (
            <Button onClick={handleConfirm} variant="destructive">
              Confirmar cancelamento
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
};

export default Unsubscribe;
