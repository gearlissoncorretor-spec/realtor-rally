import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, XCircle, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { NegotiationStatusBadge } from "./NegotiationStatusBadge";
import { Negotiation } from "@/hooks/useNegotiations";
import { formatCurrency } from "@/utils/formatting";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NegotiationLostTableProps {
  negotiations: Negotiation[];
  getBrokerName: (id: string) => string;
  valorPerdido: number;
  onDelete: (id: string) => void;
}

export const NegotiationLostTable = ({ negotiations, getBrokerName, valorPerdido, onDelete }: NegotiationLostTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-destructive" />
        Negociações Perdidas
        <NegotiationStatusBadge status="perdida" label={`${formatCurrency(valorPerdido)} perdidos`} />
        <Badge variant="secondary" className="ml-2 text-xs">{negotiations.length}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {negotiations.length === 0 ? (
        <EmptyState icon={XCircle} title="Nenhuma negociação perdida" description="Ótima notícia! Continue assim e mantenha suas conversões em alta." />
      ) : (
        <>
          <div className="block md:hidden space-y-3">
            {negotiations.map((n) => (
              <Card key={n.id} className="border border-border/50 opacity-75">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{n.client_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{n.property_type}</p>
                    </div>
                    <NegotiationStatusBadge status="perdida" label={n.loss_reason || 'Não informado'} showIcon={false} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold text-muted-foreground line-through">{formatCurrency(n.negotiated_value)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Data</p><p>{format(new Date(n.updated_at), "dd/MM/yy", { locale: ptBR })}</p></div>
                  </div>
                  <div className="flex justify-end pt-1 border-t border-border/30">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(n.id)}><Trash2 className="w-4 h-4 mr-1" /> Excluir</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Motivo da Perda</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negotiations.map((n) => (
                  <TableRow key={n.id} className="opacity-75">
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
                    <TableCell className="font-semibold text-muted-foreground line-through">{formatCurrency(n.negotiated_value)}</TableCell>
                    <TableCell><NegotiationStatusBadge status="perdida" label={n.loss_reason || 'Não informado'} showIcon={false} /></TableCell>
                    <TableCell>{format(new Date(n.updated_at), "dd/MM/yy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(n.id)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);
