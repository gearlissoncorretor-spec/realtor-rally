import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Facebook, RefreshCw, Link2Off, AlertTriangle, CheckCircle2, Plus, Trash2, Copy } from 'lucide-react';
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

interface FbForm {
  id: string;
  page_id: string;
  form_id: string;
  form_name: string | null;
  status: string | null;
  leads_count: number;
}

interface FbConnection {
  id: string;
  facebook_user_name: string | null;
  facebook_user_email: string | null;
  status: string;
  last_synced_at: string | null;
}

const WEBHOOK_URL = 'https://kwsnnwiwflsvsqiuzfja.supabase.co/functions/v1/leads-webhook';

const invoke = async (action: string, body?: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(`facebook-oauth/${action}`, {
    body: body ?? {},
  });
  if (error) {
    let details = error.message;
    try {
      const ctx = (error as unknown as { context?: { text?: () => Promise<string> } }).context;
      if (ctx?.text) {
        const raw = await ctx.text();
        try {
          const parsed = JSON.parse(raw);
          details = parsed.message || parsed.error || raw;
        } catch {
          details = raw;
        }
      }
    } catch { /* ignore */ }
    throw new Error(details);
  }
  return data as any;
};

export const FacebookIntegrationCard = () => {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [connection, setConnection] = useState<FbConnection | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [pages, setPages] = useState<FbPage[]>([]);
  const [forms, setForms] = useState<FbForm[]>([]);
  const [configError, setConfigError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ page_id: '', page_name: '', form_id: '', form_name: '' });
  const [addFormFor, setAddFormFor] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ form_id: '', form_name: '' });

  const [credStatus, setCredStatus] = useState<{ configured: boolean; valid: boolean; message: string; app_id?: string; redirect_uri?: string } | null>(null);
  const [validating, setValidating] = useState(false);

  const validateCredentials = async (notify = true) => {
    setValidating(true);
    try {
      const data = await invoke('validate');
      setCredStatus(data);
      if (notify) {
        if (data?.valid) toast.success(data.message);
        else toast.error(data?.message || 'Credenciais inválidas');
      }
      if (data?.valid) setConfigError(null);
    } catch (err) {
      if (notify) toast.error((err as Error).message);
    } finally {
      setValidating(false);
    }
  };


  const load = async () => {
    setLoading(true);
    try {
      const data = await invoke('pages');
      if (data?.error === 'not_configured') {
        setConfigError(data.message);
      } else {
        setConfigError(null);
        setConnection(data?.connection ?? null);
        setIsManual(Boolean(data?.manual));
        setPages(data?.pages ?? []);
        setForms(data?.forms ?? []);
      }
    } catch (err) {
      setConfigError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    validateCredentials(false);

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
      setForms([]);
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

  const handleManualSave = async () => {
    if (!/^\d{5,25}$/.test(form.page_id.trim())) {
      toast.error('Informe um Page ID válido (apenas números).');
      return;
    }
    if (!form.page_name.trim()) {
      toast.error('Informe o nome da página.');
      return;
    }
    if (form.form_id.trim() && !/^\d{5,25}$/.test(form.form_id.trim())) {
      toast.error('Informe um Form ID válido (apenas números).');
      return;
    }
    setWorking(true);
    try {
      await invoke('manual-page', {
        page_id: form.page_id.trim(),
        page_name: form.page_name.trim().slice(0, 120),
        form_id: form.form_id.trim(),
        form_name: form.form_name.trim().slice(0, 120),
      });
      toast.success('Página cadastrada com sucesso!');
      setForm({ page_id: '', page_name: '', form_id: '', form_name: '' });
      setShowManual(false);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const removePage = async (pageRowId: string) => {
    setWorking(true);
    try {
      await invoke('manual-remove', { page_row_id: pageRowId });
      toast.success('Página removida');
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast.success('URL do webhook copiada');
  };

  const manualForm = (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fb-page-id" className="text-xs">Page ID *</Label>
          <Input id="fb-page-id" inputMode="numeric" placeholder="1234567890" value={form.page_id}
            onChange={(e) => setForm((f) => ({ ...f, page_id: e.target.value.replace(/\D/g, '').slice(0, 25) }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fb-page-name" className="text-xs">Nome da página *</Label>
          <Input id="fb-page-name" placeholder="Imobiliária X" maxLength={120} value={form.page_name}
            onChange={(e) => setForm((f) => ({ ...f, page_name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fb-form-id" className="text-xs">Form ID (opcional)</Label>
          <Input id="fb-form-id" inputMode="numeric" placeholder="9876543210" value={form.form_id}
            onChange={(e) => setForm((f) => ({ ...f, form_id: e.target.value.replace(/\D/g, '').slice(0, 25) }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fb-form-name" className="text-xs">Nome do formulário</Label>
          <Input id="fb-form-name" placeholder="Lançamento Setembro" maxLength={120} value={form.form_name}
            onChange={(e) => setForm((f) => ({ ...f, form_name: e.target.value }))} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleManualSave} disabled={working} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Salvar página
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowManual(false)} disabled={working}>Cancelar</Button>
      </div>
      <Separator />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Webhook para receber os leads</p>
        <div className="flex gap-2">
          <Input readOnly value={WEBHOOK_URL} className="text-xs" />
          <Button size="icon" variant="outline" onClick={copyWebhook} aria-label="Copiar URL do webhook">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cole essa URL no seu integrador (Meta, Zapier, Make) apontando para o formulário cadastrado acima.
        </p>
      </div>
    </div>
  );

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
              {connection ? (isManual ? 'Conectado (manual)' : 'Conectado') : 'Não conectado'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Conecte sua conta do Meta ou cadastre a página e o formulário manualmente para receber os leads no sistema.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <div className="space-y-4">
            {configError && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Login automático indisponível</p>
                  <p className="mt-1 leading-relaxed">{configError}</p>
                </div>
              </div>
            )}

            {/* Credenciais do app Meta */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs">
                  <p className="font-semibold text-sm">Credenciais do app Meta</p>
                  <p className="text-muted-foreground">
                    {credStatus
                      ? credStatus.message
                      : 'Verificando FACEBOOK_APP_ID e FACEBOOK_APP_SECRET...'}
                  </p>
                  {credStatus?.app_id && (
                    <p className="text-muted-foreground mt-1">
                      App ID: <span className="font-mono">{credStatus.app_id}</span>
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={
                    credStatus?.valid
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }
                >
                  {credStatus?.valid ? 'Válidas' : credStatus?.configured ? 'Inválidas' : 'Ausentes'}
                </Badge>
              </div>
              {credStatus?.redirect_uri && (
                <div className="flex items-center gap-2">
                  <Input readOnly value={credStatus.redirect_uri} className="h-8 text-[11px] font-mono" />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    aria-label="Copiar URI de redirecionamento"
                    onClick={() => {
                      navigator.clipboard.writeText(credStatus.redirect_uri!);
                      toast.success('URI de redirecionamento copiada');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => validateCredentials()} disabled={validating} className="gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
                Validar credenciais
              </Button>
            </div>



            {!connection && (
              <div className="space-y-3">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" /> Leads chegam em tempo real na tela de Leads</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" /> Campanha, conjunto e anúncio registrados automaticamente</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" /> Distribua para os corretores com um clique</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleConnect} disabled={working} className="gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
                    <Facebook className="w-4 h-4" />
                    Conectar com Facebook
                  </Button>
                  <Button variant="outline" onClick={() => setShowManual((v) => !v)} disabled={working} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Conectar manualmente
                  </Button>
                </div>
              </div>
            )}

            {connection && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-muted/30 p-3">
                <div className="text-xs">
                  <p className="font-semibold text-sm">{connection.facebook_user_name || 'Conta Meta'}</p>
                  <p className="text-muted-foreground">{connection.facebook_user_email || (isManual ? 'Cadastro manual de páginas' : 'Conta conectada')}</p>
                </div>
                <div className="flex gap-2">
                  {!isManual && (
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={working} className="gap-1.5">
                      <RefreshCw className={`w-3.5 h-3.5 ${working ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowManual((v) => !v)} disabled={working} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar página
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={working} className="gap-1.5 text-destructive">
                    <Link2Off className="w-3.5 h-3.5" />
                    Desconectar
                  </Button>
                </div>
              </div>
            )}

            {showManual && manualForm}

            {connection && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Páginas ({pages.length})</p>
                {pages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma página cadastrada ainda.</p>
                ) : (
                  pages.map((p) => {
                    const pageForms = forms.filter((f) => f.page_id === p.id);
                    return (
                      <div key={p.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
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
                              <p className="text-xs text-muted-foreground truncate">ID {p.page_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={p.subscribed} onCheckedChange={(v) => togglePage(p, v)} disabled={working} />
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removePage(p.id)} disabled={working} aria-label={`Remover ${p.page_name}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Campanhas / formulários da página */}
                        <div className="pl-11 space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Campanhas (formulários)
                          </p>
                          {pageForms.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Nenhuma campanha cadastrada — adicione o Form ID para escolher de qual campanha receber leads.
                            </p>
                          ) : (
                            pageForms.map((f) => (
                              <div key={f.id} className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{f.form_name || `Formulário ${f.form_id}`}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">ID {f.form_id} · {f.leads_count} leads</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant="outline" className={f.status === 'active' ? 'text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'text-[10px] bg-muted/50'}>
                                    {f.status === 'active' ? 'Recebendo' : 'Pausada'}
                                  </Badge>
                                  <Switch
                                    checked={f.status === 'active'}
                                    onCheckedChange={(v) => toggleForm(f, v)}
                                    disabled={working}
                                    aria-label={`Receber leads de ${f.form_name || f.form_id}`}
                                  />
                                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => removeForm(f.id)} disabled={working} aria-label={`Remover ${f.form_name || f.form_id}`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}

                          {addFormFor === p.id ? (
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              <Input
                                placeholder="Form ID (somente números)"
                                inputMode="numeric"
                                value={newForm.form_id}
                                onChange={(e) => setNewForm((n) => ({ ...n, form_id: e.target.value.replace(/\D/g, '').slice(0, 25) }))}
                                className="h-8 text-xs"
                              />
                              <Input
                                placeholder="Nome da campanha"
                                maxLength={120}
                                value={newForm.form_name}
                                onChange={(e) => setNewForm((n) => ({ ...n, form_name: e.target.value }))}
                                className="h-8 text-xs"
                              />
                              <div className="flex gap-1.5">
                                <Button size="sm" className="h-8" onClick={() => addForm(p.id)} disabled={working}>Salvar</Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddFormFor(null)} disabled={working}>Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => { setAddFormFor(p.id); setNewForm({ form_id: '', form_name: '' }); }}
                              disabled={working}
                            >
                              <Plus className="w-3 h-3" /> Adicionar campanha
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
};
