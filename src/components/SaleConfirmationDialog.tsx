import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Home, User, DollarSign, Calendar, MapPin } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting';
import type { Sale } from '@/contexts/DataContext';

interface SaleConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale & { broker?: { name: string; email: string } };
  isEdit?: boolean;
}

const SaleConfirmationDialog: React.FC<SaleConfirmationDialogProps> = ({
  isOpen,
  onClose,
  sale,
  isEdit = false
}) => {
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Venda {isEdit ? 'Atualizada' : 'Cadastrada'} com Sucesso!
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Confira os detalhes da venda abaixo
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Informações do Cliente</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{sale.client_name}</p>
              </div>
              {sale.client_email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{sale.client_email}</p>
                </div>
              )}
              {sale.client_phone && (
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{sale.client_phone}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Informações do Imóvel */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Informações do Imóvel</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-muted-foreground">Endereço:</span>
                  <p className="font-medium">{sale.property_address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <p className="font-medium capitalize">{sale.property_type || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(sale.status)}>
                    {getStatusLabel(sale.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Informações Financeiras */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Informações Financeiras</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valor do Imóvel:</span>
                <p className="font-bold text-foreground text-lg">
                  {formatCurrency(sale.property_value)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">VGV:</span>
                <p className="font-medium">{formatCurrency(sale.vgv)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">VGC:</span>
                <p className="font-medium">{formatCurrency(sale.vgc)}</p>
              </div>
              {sale.commission_value && (
                <div>
                  <span className="text-muted-foreground">Comissão:</span>
                  <p className="font-medium text-success">
                    {formatCurrency(sale.commission_value)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Informações do Corretor */}
          {sale.broker && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Corretor Responsável</h3>
              </div>
              <div className="text-sm">
                <p className="font-medium">{sale.broker.name}</p>
                <p className="text-muted-foreground">{sale.broker.email}</p>
              </div>
            </Card>
          )}

          {/* Data da Venda */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Data da Venda</h3>
            </div>
            <p className="text-sm font-medium">
              {new Date(sale.sale_date || sale.created_at).toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </Card>

          {/* Observações */}
          {sale.notes && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm text-muted-foreground">{sale.notes}</p>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="bg-gradient-primary">
            Finalizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleConfirmationDialog;