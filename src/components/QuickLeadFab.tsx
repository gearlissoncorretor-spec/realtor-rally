import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLeads, type LeadSource } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "site", label: "Site" },
  { value: "manual", label: "Indicação / Outros" },
];

// Format Brazilian phone as user types: (11) 91234-5678
const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

// Routes where the FAB should not appear
const HIDDEN_ROUTES = ["/auth", "/landing", "/reset-password", "/onboarding", "/unsubscribe"];

export const QuickLeadFab = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { createLead } = useLeads();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<LeadSource>("whatsapp");

  if (!user) return null;
  if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const reset = () => {
    setName("");
    setPhone("");
    setSource("whatsapp");
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits && digits.length < 10) {
      toast.error("Telefone inválido");
      return;
    }
    setSaving(true);
    try {
      await createLead({
        name: trimmed,
        phone: digits ? digits : null,
        source,
      });
      reset();
      setOpen(false);
    } catch {
      // toast is handled inside the hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cadastro rápido de cliente"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 flex items-center justify-center active:scale-95 transition-all group"
        title="Cadastro rápido de cliente"
      >
        <Plus className="h-6 w-6" />
        <span className="hidden lg:group-hover:inline-flex absolute right-full mr-3 whitespace-nowrap bg-card text-foreground text-sm font-medium px-3 py-1.5 rounded-md shadow-md border border-border/40">
          Cadastro rápido
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Novo cliente (10 seg)
            </DialogTitle>
            <DialogDescription>
              Cadastre o essencial agora. Complete os dados depois.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="qlf-name">Nome *</Label>
              <Input
                id="qlf-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qlf-phone">WhatsApp</Label>
              <Input
                id="qlf-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 91234-5678"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar cliente"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickLeadFab;
