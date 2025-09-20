import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatting';
import { Sale } from '@/contexts/DataContext';

interface SaleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onEdit?: (sale: Sale) => void;
}

const SaleDetailsDialog: React.FC<SaleDetailsDialogProps> = ({
  isOpen,
  onClose,
  sale,
  onEdit,
}) => {
  if (!sale) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-success text-success-foreground";
      case "pendente":
        return "bg-warning text-warning-foreground";
      case "cancelada":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmada":
        return "Confirmada";
      case "pendente":
        return "Pendente";
      case "cancelada":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Detalhes da Venda
            <Badge className={getStatusColor(sale.status)}>
              {getStatusLabel(sale.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Nome:</span> {sale.client_name}
              </div>
              {sale.client_email && (
                <div>
                  <span className="font-semibold">Email:</span> {sale.client_email}
                </div>
              )}
              {sale.client_phone && (
                <div>
                  <span className="font-semibold">Telefone:</span> {sale.client_phone}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Imóvel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Endereço:</span> {sale.property_address}
              </div>
              <div>
                <span className="font-semibold">Tipo:</span> {sale.property_type}
              </div>
              <div>
                <span className="font-semibold">Produto:</span> {sale.produto || 'Não informado'}
              </div>
              <div>
                <span className="font-semibold">Estilo:</span> {sale.estilo || 'Não informado'}
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">VGV (Valor do Imóvel):</span> {formatCurrency(Number(sale.property_value))}
              </div>
              <div>
                <span className="font-semibold">VGC (Valor da Comissão Geral):</span> {formatCurrency(Number(sale.vgc))}
              </div>
              <div>
                <span className="font-semibold">Comissão do Corretor:</span> {formatCurrency(Number(sale.commission_value || 0))}
              </div>
              <div>
                <span className="font-semibold">Pagos:</span> {formatCurrency(Number(sale.pagos || 0))}
              </div>
            </CardContent>
          </Card>

          {/* Informações da Venda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Corretor:</span> {sale.broker?.name || 'Não informado'}
              </div>
              <div>
                <span className="font-semibold">Tipo de Venda:</span> {sale.sale_type || 'Não informado'}
              </div>
              <div>
                <span className="font-semibold">Data da Venda:</span> {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-BR') : 'Não informada'}
              </div>
              <div>
                <span className="font-semibold">Origem:</span> {sale.origem || 'Não informado'}
              </div>
              <div>
                <span className="font-semibold">Captador:</span> {sale.captador || 'Não informado'}
              </div>
              <div>
                <span className="font-semibold">Gerente:</span> {sale.gerente || 'Não informado'}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {sale.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{sale.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {onEdit && (
            <Button onClick={() => onEdit(sale)} variant="outline">
              Editar
            </Button>
          )}
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailsDialog;