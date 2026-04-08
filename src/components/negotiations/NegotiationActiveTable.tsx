import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, DollarSign, XCircle, Undo2, StickyNote, Handshake, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NegotiationStatusBadge } from "./NegotiationStatusBadge";
import { Negotiation } from "@/hooks/useNegotiations";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TEMPERATURE_OPTIONS = [
  { value: 'fria', label: '❄️ Fria', color: 'text-info', bg: 'bg-info/10 border-info/30' },
  { value: 'morna', label: '🌤️ Morna', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  { value: 'quente', label: '🔥 Quente', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
];

interface NegotiationActiveTableProps {
  negotiations: Negotiation[];
  getBrokerName: (id: string) => string;
  getStatusByValue: (status: string) => any;
  isApproved: (status: string) => boolean;
  isStalled: (n: Negotiation) => boolean;
  onEdit: (n: Negotiation) => void;
  onSaleConversion: (n: Negotiation) => void;
  onLoss: (n: Negotiation) => void;
  onReturnFollowUp: (n: Negotiation) => void;
  onNotes: (n: Negotiation) => void;
  onDelete: (id: string) => void;
  onNewNegotiation: () => void;
}

const getTemperatureBadge = (temperature: string) => {
  const temp = TEMPERATURE_OPTIONS.find(t => t.value === temperature);
  if (!temp) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${temp.bg} ${temp.color}`}>
      {temp.label}
    </span>
  );
};

export const NegotiationActiveTable = ({
  negotiations, getBrokerName, getStatusByValue, isApproved, isStalled,
  onEdit, onSaleConversion, onLoss, onReturnFollowUp, onNotes, onDelete, onNewNegotiation,
}: NegotiationActiveTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Handshake className="w-5 h-5 text-primary" />
        Negociações em Andamento
        <Badge variant="secondary" className="ml-2 text-xs">{negotiations.length}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {negotiations.length === 0 ? (
        <EmptyState variant="negotiations" title="Nenhuma negociação encontrada" description="Comece adicionando sua primeira negociação para acompanhar o pipeline de vendas." actionLabel="Nova Negociação" onAction={onNewNegotiation} />
      ) : (
        <>
          {/* Mobile */}
          <div className="block md:hidden space-y-3">
            {negotiations.map((n) => {
              const statusConfig = getStatusByValue(n.status);
              const canConvert = isApproved(n.status);
              return (
                <Card key={n.id} className={`border ${isStalled(n) ? 'border-destructive/50 bg-destructive/5' : 'border-border/50'}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{n.client_name}</p>
                        {n.client_phone && (
                          <a href={`https://wa.me/${n.client_phone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-success hover:text-success/80">
                            <MessageCircle className="w-3 h-3" />{n.client_phone}
                          </a>
                        )}
                      </div>
                      <NegotiationStatusBadge status={n.status} label={statusConfig?.label} color={statusConfig?.color} icon={statusConfig?.icon} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-xs text-muted-foreground">Imóvel</p><p className="truncate capitalize">{n.property_type}</p></div>
                      <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold text-primary">{formatCurrency(n.negotiated_value)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Corretor</p><p className="truncate">{getBrokerName(n.broker_id)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Data</p><p>{format(new Date(n.start_date), "dd/MM/yy", { locale: ptBR })}</p></div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">{getTemperatureBadge(n.temperature)}</div>
                    <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(n)} className="flex-1 h-9"><Edit className="w-4 h-4 mr-1" /> Editar</Button>
                      <Button size="sm" onClick={() => onSaleConversion(n)} className={`flex-1 h-9 text-success-foreground ${canConvert ? 'bg-success hover:bg-success/90' : 'bg-success/50 hover:bg-success/70'}`}><DollarSign className="w-4 h-4 mr-1" /> Venda</Button>
                      <Button size="sm" variant="destructive" onClick={() => onLoss(n)} className="h-9"><XCircle className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => onReturnFollowUp(n)} className="h-9" title="Voltar para Follow Up"><Undo2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => onNotes(n)} className="h-9" title="Notas"><StickyNote className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive h-9" onClick={() => onDelete(n.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Termômetro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negotiations.map((n) => {
                  const statusConfig = getStatusByValue(n.status);
                  const canConvert = isApproved(n.status);
                  return (
                    <TableRow key={n.id} className={isStalled(n) ? 'bg-destructive/5 border-l-2 border-l-destructive' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{n.client_name}</p>
                          {n.client_phone && (
                            <a href={`https://wa.me/${n.client_phone.replace(/\D/g, '').replace(/^(?!55)/, '55')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-success hover:text-success/80">
                              <MessageCircle className="w-3 h-3" />{n.client_phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><div className="max-w-[200px]"><p className="truncate">{n.property_address}</p><p className="text-xs text-muted-foreground capitalize">{n.property_type}</p></div></TableCell>
                      <TableCell>{getBrokerName(n.broker_id)}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(n.negotiated_value)}</TableCell>
                      <TableCell>{getTemperatureBadge(n.temperature)}</TableCell>
                      <TableCell><NegotiationStatusBadge status={n.status} label={statusConfig?.label} color={statusConfig?.color} icon={statusConfig?.icon} /></TableCell>
                      <TableCell>{format(new Date(n.start_date), "dd/MM/yy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => onEdit(n)} title="Editar"><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="default" onClick={() => onSaleConversion(n)} className={`text-success-foreground ${canConvert ? 'bg-success hover:bg-success/90 animate-pulse' : 'bg-success/50 hover:bg-success/70'}`} title={canConvert ? "Cliente aprovado - Converter em Venda" : "Converter em Venda"}>
                            <DollarSign className="w-4 h-4" /><span className="ml-1">{canConvert ? 'VENDA!' : 'VENDA'}</span>
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => onLoss(n)} title="Registrar Perda"><XCircle className="w-4 h-4" /><span className="ml-1">PERDA</span></Button>
                          <Button size="sm" variant="outline" onClick={() => onReturnFollowUp(n)} title="Voltar para Follow Up"><Undo2 className="w-4 h-4" /><span className="ml-1">Follow Up</span></Button>
                          <Button size="sm" variant="outline" onClick={() => onNotes(n)} title="Notas"><StickyNote className="w-4 h-4" /><span className="ml-1">Notas</span></Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(n.id)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);
