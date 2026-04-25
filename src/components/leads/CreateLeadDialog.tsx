import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_SOURCES } from './LeadSourceBadge';
import { useLeads, type CreateLeadInput } from '@/hooks/useLeads';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().max(160).email('E-mail inválido').optional().or(z.literal('')),
  source: z.string(),
  campaign: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateLeadDialog = ({ open, onOpenChange }: Props) => {
  const { createLead } = useLeads();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    campaign: '',
    notes: '',
  });

  const reset = () => setForm({ name: '', phone: '', email: '', source: 'manual', campaign: '', notes: '' });

  const handleSubmit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }
    setSubmitting(true);
    try {
      await createLead({
        name: parsed.data.name,
        source: parsed.data.source,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        campaign: parsed.data.campaign || null,
        notes: parsed.data.notes || null,
      });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Novo Lead
          </DialogTitle>
          <DialogDescription>Cadastre manualmente um novo lead na plataforma.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do lead" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={form.source as string} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Input value={form.campaign ?? ''} onChange={(e) => setForm({ ...form, campaign: e.target.value })} placeholder="Nome da campanha" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Informações adicionais..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Salvando...' : 'Cadastrar Lead'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
