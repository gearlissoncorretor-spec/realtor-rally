import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer } from "lucide-react";
import { CreateNegotiationInput, Negotiation } from "@/hooks/useNegotiations";
import { useNegotiationStatuses } from "@/hooks/useNegotiationStatuses";

const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
];

const TEMPERATURE_OPTIONS = [
  { value: 'fria', label: '❄️ Fria', color: 'text-info', bg: 'bg-info/10 border-info/30' },
  { value: 'morna', label: '🌤️ Morna', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  { value: 'quente', label: '🔥 Quente', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
];

const DEFAULT_FORM: CreateNegotiationInput = {
  broker_id: '',
  client_name: '',
  client_email: '',
  client_phone: '',
  property_address: '',
  property_type: 'apartamento',
  negotiated_value: 0,
  status: 'em_contato',
  start_date: new Date().toISOString().split('T')[0],
  observations: '',
  temperature: 'morna',
};

interface NegotiationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Negotiation | null;
  brokers: { id: string; name: string }[];
  isCorretor: boolean;
  currentBrokerId?: string;
  onSubmit: (data: CreateNegotiationInput, isEditing: boolean, editId?: string) => Promise<void>;
}

export const NegotiationFormDialog = ({
  open, onOpenChange, editing, brokers, isCorretor, currentBrokerId, onSubmit,
}: NegotiationFormDialogProps) => {
  const { flowStatuses } = useNegotiationStatuses();
  const [formData, setFormData] = useState<CreateNegotiationInput>(DEFAULT_FORM);

  useEffect(() => {
    if (editing) {
      setFormData({
        broker_id: editing.broker_id,
        client_name: editing.client_name,
        client_email: editing.client_email || '',
        client_phone: editing.client_phone || '',
        property_address: editing.property_address,
        property_type: editing.property_type,
        negotiated_value: editing.negotiated_value,
        status: editing.status,
        start_date: editing.start_date,
        observations: editing.observations || '',
        temperature: editing.temperature || 'morna',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      broker_id: isCorretor && currentBrokerId ? currentBrokerId : formData.broker_id,
    };
    await onSubmit(dataToSubmit, !!editing, editing?.id);
    onOpenChange(false);
    setFormData(DEFAULT_FORM);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Negociação' : 'Nova Negociação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isCorretor && (
            <div>
              <label className="text-sm font-medium">Corretor Responsável *</label>
              <Select value={formData.broker_id} onValueChange={(v) => setFormData({ ...formData, broker_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o corretor" /></SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Cliente *</label>
            <Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} placeholder="Nome do cliente" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={formData.client_email} onChange={(e) => setFormData({ ...formData, client_email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input value={formData.client_phone} onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Endereço do Imóvel *</label>
            <Input value={formData.property_address} onChange={(e) => setFormData({ ...formData, property_address: e.target.value })} placeholder="Endereço completo" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Imóvel</label>
              <Select value={formData.property_type} onValueChange={(v) => setFormData({ ...formData, property_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Valor Negociado *</label>
              <Input type="number" value={formData.negotiated_value || ''} onChange={(e) => setFormData({ ...formData, negotiated_value: Number(e.target.value) })} placeholder="0,00" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data de Início</label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {flowStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2"><span>{s.icon}</span>{s.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4" />Termômetro da Negociação
            </label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {TEMPERATURE_OPTIONS.map((temp) => (
                <button key={temp.value} type="button" onClick={() => setFormData({ ...formData, temperature: temp.value })} className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${formData.temperature === temp.value ? `${temp.bg} border-current ${temp.color} scale-105 shadow-md` : 'border-border bg-background hover:bg-muted'}`}>
                  {temp.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Textarea value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} placeholder="Detalhes da negociação..." rows={3} />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">{editing ? 'Salvar' : 'Criar Negociação'}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
