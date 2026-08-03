import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Facebook, RefreshCw, Link2Off, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FbPage {
  id: string;
  page_id: string;
  page_name: string;
  category: string | null;
  picture_url: string | null;
  subscribed: boolean;
  last_lead_at: string | null;
}

interface FbConnection {
  id: string;
  facebook_user_name: string | null;
  facebook_user_email: string | null;
  status: string;
  last_synced_at: string | null;
}

const invoke = async (action: string, body?: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(`facebook-oauth/${action}`, {
    body: body ?? {},
  });
  if (error) {
    let details = error.message;
    try {
      // @ts-expect-error context existe em FunctionsHttpError
      if (error.context?.text) details = await error.context.text();
    } catch { /* ignore */ }
    throw new Error(details);
  }
  return data as any;
};

export const FacebookIntegrationCard = () => {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [connection, setConnection] = useState<FbConnection | null>(null);
  const [pages, setPages] = useState<FbPage[]>([]);
  const [configError, setConfigError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await invoke('pages');
      if (data?.error === 'not_configured') {
        setConfigError(data.message);
      } else {
        setConfigError(null);
        setConnection(data?.connection ?? null);
        setPages(data?.pages ?? []);
      }
    } catch (err) {
      setConfigError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get('fb') === 'connected') {
      toast.success('Facebook conectado com sucesso!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('fb') === 'error') {
      toast.error(params.get('message') || 'Falha ao conectar o Facebook');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setWorking(true);
    try {
      const data = await invoke('start', { redirect_to: window.location.origin + window.location.pathname });
      if (data?.url) window.location.href = data.url;
      else throw new Error(data?.message || 'Não foi possível iniciar a autorização.');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const handleSync = async () => {
    setWorking(true);
    try {
      await invoke('sync');
      toast.success('Páginas atualizadas');
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    setWorking(true);
    try {
      await invoke('disconnect');
      toast.success('Conexão removida');
      setConnection(null);
      setPages([]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const togglePage = async (page: FbPage, enable: boolean) => {
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, subscribed: enable } : p)));
    try {
      await invoke('subscribe', { page_id: page.id, enable });
      toast.success(enable ? `Recebendo leads de ${page.page_name}` : `Leads pausados para ${page.page_name}`);
    } catch (err) {
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, subscribed: !enable } : p)));
      toast.error((err as Error).message);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Facebook className="w-5 h-5" />
            </span>
            Facebook Lead Ads
          </CardTitle>
          {!loading && (
            <Badge variant="outline" className={connection ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted/50'}>
              {connection ? 'Conectado' : 'Não conectado'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Conecte sua conta do Meta e escolha as páginas para receber os leads das campanhas direto no sistema.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : configError ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Integração ainda não configurada</p>
              <p className="mt-1 leading-relaxed">{configError}</p>
            </div>
          </div>
        ) : !connection ? (
          <div className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" /> Leads chegam em tempo real na tela de Leads</li>
              <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" /> Campanha, conjunto e anúncio registrados automaticamente</li>
              <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" /> Distribua para os corretores com um clique</li>
            </ul>
            <Button onClick={handleConnect} disabled={working} className="w-full sm:w-auto gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
              <Facebook className="w-4 h-4" />
              Conectar com Facebook
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-muted/30 p-3">
              <div className="text-xs">
                <p className="font-semibold text-sm">{connection.facebook_user_name || 'Conta Meta'}</p>
                <p className="text-muted-foreground">{connection.facebook_user_email || 'Conta conectada'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSync} disabled={working} className="gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${working ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={working} className="gap-1.5 text-destructive">
                  <Link2Off className="w-3.5 h-3.5" />
                  Desconectar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Páginas ({pages.length})</p>
              {pages.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma página encontrada. Clique em "Atualizar".</p>
              ) : (
                pages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.picture_url ? (
                        <img src={p.picture_url} alt={`Foto da página ${p.page_name}`} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Facebook className="w-4 h-4 text-muted-foreground" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.page_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.category || 'Página'}</p>
                      </div>
                    </div>
                    <Switch checked={p.subscribed} onCheckedChange={(v) => togglePage(p, v)} disabled={working} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
