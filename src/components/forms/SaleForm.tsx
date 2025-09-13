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
  vgc: z.number().min(1, 'VGC deve ser maior que 0'),
  status: z.enum(['pendente', 'confirmada', 'cancelada']),
  notes: z.string().optional(),
  commission_value: z.number().optional(),
  // sale_type: z.enum(['lancamento', 'revenda']),
  // sale_date: z.string().min(1, 'Data da venda é obrigatória'),
  // Novos campos obrigatórios
  origem: z.string().min(1, 'Origem é obrigatória'),
  estilo: z.string().min(1, 'Estilo é obrigatório'),
  produto: z.string().min(1, 'Produto é obrigatório'),
  captador: z.string().min(1, 'Captador é obrigatório'),
  gerente: z.string().min(1, 'Gerente é obrigatório'),
  pagos: z.number().min(0, 'Pagos deve ser maior ou igual a 0'),
  ano: z.number().min(2020, 'Ano deve ser válido').max(new Date().getFullYear() + 1),
  mes: z.number().min(1, 'Mês deve ser entre 1 e 12').max(12),
  latitude: z.string().min(1, 'Latitude é obrigatória'),
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
      vgc: sale?.vgc || 0,
      status: sale?.status || 'pendente',
      notes: sale?.notes || '',
      // sale_type: sale?.sale_type || 'lancamento',
      // sale_date: sale?.sale_date || new Date().toISOString().split('T')[0],
      // Novos campos
      origem: sale?.origem || '',
      estilo: sale?.estilo || '',
      produto: sale?.produto || '',
      captador: sale?.captador || '',
      gerente: sale?.gerente || '',
      pagos: sale?.pagos || 0,
      ano: sale?.ano || new Date().getFullYear(),
      mes: sale?.mes || new Date().getMonth() + 1,
      latitude: sale?.latitude || '',
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="property_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Imóvel / VGV (R$)</FormLabel>
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
            
            {/* Comentado temporariamente até adicionar campos à base de dados
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sale_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Venda *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lancamento">Lançamento</SelectItem>
                        <SelectItem value="revenda">Revenda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Venda *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            */}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Indicação, Site, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estilo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estilo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Moderno, Clássico, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto/empreendimento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="captador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captador *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do captador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gerente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do gerente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="pagos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagos (R$) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
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
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2024" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Janeiro</SelectItem>
                        <SelectItem value="2">Fevereiro</SelectItem>
                        <SelectItem value="3">Março</SelectItem>
                        <SelectItem value="4">Abril</SelectItem>
                        <SelectItem value="5">Maio</SelectItem>
                        <SelectItem value="6">Junho</SelectItem>
                        <SelectItem value="7">Julho</SelectItem>
                        <SelectItem value="8">Agosto</SelectItem>
                        <SelectItem value="9">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude *</FormLabel>
                    <FormControl>
                      <Input placeholder="-23.550520" {...field} />
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