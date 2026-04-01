import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer } from "lucide-react";
import { CreateNegotiationInput, Negotiation } from "@/hooks/useNegotiations";

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

interface NegotiationFormProps {
  formData: CreateNegotiationInput;
  setFormData: (data: CreateNegotiationInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  isCorretor: boolean;
  brokers: Array<{ id: string; name: string }>;
  flowStatuses: Array<{ value: string; label: string; icon?: string }>;
}

export function NegotiationForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEditing,
  isCorretor,
  brokers,
  flowStatuses,
}: NegotiationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isCorretor && (
        <div>
          <label className="text-sm font-medium">Corretor Responsável *</label>
          <Select
            value={formData.broker_id}
            onValueChange={(value) => setFormData({ ...formData, broker_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o corretor" />
            </SelectTrigger>
            <SelectContent>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.id}>
                  {broker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Cliente *</label>
        <Input
          value={formData.client_name}
          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
          placeholder="Nome do cliente"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Telefone</label>
          <Input
            value={formData.client_phone}
            onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Endereço do Imóvel *</label>
        <Input
          value={formData.property_address}
          onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
          placeholder="Endereço completo"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Tipo de Imóvel</label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Valor Negociado *</label>
          <Input
            type="number"
            value={formData.negotiated_value || ''}
            onChange={(e) => setFormData({ ...formData, negotiated_value: Number(e.target.value) })}
            placeholder="0,00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Data de Início</label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {flowStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <span>{status.icon}</span>
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Temperature selector */}
      <div>
        <label className="text-sm font-medium flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          Termômetro da Negociação
        </label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {TEMPERATURE_OPTIONS.map((temp) => (
            <button
              key={temp.value}
              type="button"
              onClick={() => setFormData({ ...formData, temperature: temp.value })}
              className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                formData.temperature === temp.value
                  ? `${temp.bg} border-current ${temp.color} scale-105 shadow-md`
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {temp.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          placeholder="Detalhes da negociação..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {isEditing ? 'Salvar' : 'Criar Negociação'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
