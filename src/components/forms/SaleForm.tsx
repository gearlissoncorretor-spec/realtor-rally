import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Sale, useData } from '@/contexts/DataContext';

const saleSchema = z.object({
  broker_id: z.string().min(1, 'Selecione um corretor'),
  client_name: z.string().min(2, 'Nome do cliente deve ter pelo menos 2 caracteres'),
  client_email: z.string().email('Email inválido').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  property_address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  property_type: z.enum(['apartamento', 'casa', 'comercial', 'terreno', 'rural']),
  property_value: z.number().min(1, 'Valor do imóvel deve ser maior que 0'),
  vgv: z.number().min(1, 'VGV deve ser maior que 0'),
  vgc: z.number().min(1, 'VGC deve ser maior que 0'),
  status: z.enum(['pendente', 'confirmada', 'cancelada']),
  notes: z.string().optional(),
  commission_value: z.number().optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData) => Promise<void>;
  sale?: Sale;
  title: string;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sale,
  title,
}) => {
  const { brokers } = useData();
  
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      broker_id: sale?.broker_id || undefined,
      client_name: sale?.client_name || '',
      client_email: sale?.client_email || '',
      client_phone: sale?.client_phone || '',
      property_address: sale?.property_address || '',
      property_type: sale?.property_type || 'apartamento',
      property_value: sale?.property_value || 0,
      vgv: sale?.vgv || 0,
      vgc: sale?.vgc || 0,
      status: sale?.status || 'pendente',
      notes: sale?.notes || '',
    },
  });

  const handleSubmit = async (data: SaleFormData) => {
    try {
      // Calculate commission based on broker's rate
      const selectedBroker = brokers.find(b => b.id === data.broker_id);
      const commissionRate = selectedBroker?.commission_rate || 5;
      const commission_value = (data.property_value * Number(commissionRate)) / 100;
      
      await onSubmit({
        ...data,
        commission_value,
        client_email: data.client_email || null,
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting sale form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="broker_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o corretor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brokers.map((broker) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="confirmada">Confirmada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="client_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Cliente</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="cliente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo do Imóvel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="property_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço do Imóvel</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="property_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Imóvel (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="500000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vgv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VGV (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="500000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vgc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VGC (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="450000" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite observações sobre a venda..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};