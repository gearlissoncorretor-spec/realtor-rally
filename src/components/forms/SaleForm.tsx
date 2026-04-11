import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Sale, useData } from '@/contexts/DataContext';

const saleSchema = z.object({
  tipo: z.enum(['venda', 'captacao']),
  visibilidade: z.enum(['auto', 'venda', 'captacao', 'ambos']).default('auto'),
  broker_id: z.string().min(1, 'Selecione um corretor'),
  client_name: z.string().min(2, 'Nome do cliente deve ter pelo menos 2 caracteres'),
  client_email: z.string().email('Email inválido').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  property_address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  property_type: z.enum(['apartamento', 'casa', 'comercial', 'terreno', 'rural']),
  property_value: z.number().min(1, 'Valor do imóvel deve ser maior que 0'),
  vgv: z.number().optional(),
  vgc: z.number().min(1, 'VGC deve ser maior que 0'),
  status: z.enum(['pendente', 'confirmada', 'cancelada', 'distrato']),
  notes: z.string().optional(),
  commission_value: z.number().optional(),
  sale_type: z.enum(['lancamento', 'revenda']),
  sale_date: z.string().min(1, 'Data da venda é obrigatória'),
  origem: z.string().min(1, 'Origem é obrigatória'),
  estilo: z.string().min(1, 'Estilo é obrigatório'),
  produto: z.string().min(1, 'Produto é obrigatório'),
  captador: z.string().optional().default(''),
  vendedor_nome: z.string().optional().default(''),
  vendedor_telefone: z.string().optional().default(''),
  vendedor_creci: z.string().optional().default(''),
  parceria_tipo: z.enum(['Agência', 'Mercado']).optional(),
  gerente: z.string().min(1, 'Gerente é obrigatório'),
  pagos: z.number().min(0, 'Pagos deve ser maior ou igual a 0'),
  ano: z.number().min(2020, 'Ano deve ser válido').max(new Date().getFullYear() + 1),
  mes: z.number().min(1, 'Mês deve ser entre 1 e 12').max(12),
  latitude: z.string().min(1, 'Latitude é obrigatória'),
  is_partnership: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (data.sale_type === 'revenda' && (!data.captador || data.captador.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Captador é obrigatório para Revenda',
      path: ['captador'],
    });
  }
  // Lançamento não pode ser captação
  if (data.sale_type === 'lancamento' && data.tipo === 'captacao') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Lançamento não pode ser do tipo Captação',
      path: ['tipo'],
    });
  }
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SaleFormData) => Promise<void>;
  sale?: Sale;
  title: string;
  defaultSaleType?: 'lancamento' | 'revenda';
  defaultTipo?: 'venda' | 'captacao';
}

export const SaleForm: React.FC<SaleFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sale,
  title,
  defaultSaleType,
  defaultTipo = 'venda',
}) => {
  const { brokers } = useData();

  // Fetch managers (gerentes) for dropdown
  const [managers, setManagers] = useState<{ id: string; full_name: string; team_id: string | null }[]>([]);
  useEffect(() => {
    const fetchManagers = async () => {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, team_id');
      const profileIds = (profilesData || []).map(p => p.id);
      if (profileIds.length === 0) return;
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profileIds)
        .eq('role', 'gerente');
      const gerenteIds = new Set((rolesData || []).map(r => r.user_id));
      setManagers((profilesData || []).filter(p => gerenteIds.has(p.id)).map(p => ({
        id: p.id,
        full_name: p.full_name,
        team_id: p.team_id,
      })));
    };
    if (isOpen) fetchManagers();
  }, [isOpen]);

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      tipo: defaultTipo,
      visibilidade: 'auto',
      broker_id: undefined,
      client_name: '',
      client_email: '',
      client_phone: '',
      property_address: '',
      property_type: 'apartamento',
      property_value: 0,
      vgc: 0,
      status: 'pendente',
      notes: '',
      sale_type: defaultSaleType || 'lancamento',
      sale_date: new Date().toISOString().split('T')[0],
      origem: '',
      estilo: '',
      produto: '',
      captador: '',
      vendedor_nome: '',
      vendedor_telefone: '',
      vendedor_creci: '',
      parceria_tipo: undefined,
      gerente: '',
      pagos: 0,
      ano: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      latitude: '',
      is_partnership: false,
    },
  });

  const watchSaleType = form.watch('sale_type');
  const watchTipo = form.watch('tipo');
  const watchBrokerId = form.watch('broker_id');

  // Auto-fill gerente when broker is selected
  useEffect(() => {
    if (!watchBrokerId || !managers.length) return;
    const selectedBroker = brokers.find(b => b.id === watchBrokerId);
    if (selectedBroker?.team_id) {
      const manager = managers.find(m => m.team_id === selectedBroker.team_id);
      if (manager) {
        form.setValue('gerente', manager.full_name);
      }
    }
  }, [watchBrokerId, managers, brokers, form]);

  // When sale_type is 'lancamento', force tipo to 'venda' (lançamento não tem captação)
  React.useEffect(() => {
    if (watchSaleType === 'lancamento') {
      form.setValue('captador', '');
      form.setValue('tipo', 'venda');
    }
  }, [watchSaleType, form]);

  // Reset form when sale data changes
  React.useEffect(() => {
    if (isOpen) {
      if (sale) {
        // Editing existing sale - populate form with sale data
        form.reset({
          tipo: (sale.tipo as 'venda' | 'captacao') || 'venda',
          visibilidade: ((sale as any).visibilidade as 'auto' | 'venda' | 'captacao' | 'ambos') || 'auto',
          broker_id: sale.broker_id || undefined,
          client_name: sale.client_name || '',
          client_email: sale.client_email || '',
          client_phone: sale.client_phone || '',
          property_address: sale.property_address || '',
          property_type: sale.property_type || 'apartamento',
          property_value: Number(sale.property_value) || 0,
          vgv: Number(sale.vgv) || 0,
          vgc: Number(sale.vgc) || 0,
          status: sale.status || 'pendente',
          notes: sale.notes || '',
          sale_type: (sale.sale_type as 'lancamento' | 'revenda') || 'lancamento',
          sale_date: sale.sale_date || new Date().toISOString().split('T')[0],
          origem: sale.origem || '',
          estilo: sale.estilo || '',
          produto: sale.produto || '',
          captador: sale.captador || '',
          vendedor_nome: sale.vendedor_nome || '',
          vendedor_telefone: sale.vendedor_telefone || '',
          vendedor_creci: sale.vendedor_creci || '',
          parceria_tipo: (sale.parceria_tipo as 'Agência' | 'Mercado') || undefined,
          gerente: sale.gerente || '',
          pagos: Number(sale.pagos) || 0,
          ano: sale.ano || new Date().getFullYear(),
          mes: sale.mes || new Date().getMonth() + 1,
          latitude: sale.latitude || '',
          is_partnership: !!sale.is_partnership,
        });
      } else {
        // New sale - reset to default values
        form.reset({
          tipo: defaultTipo,
          visibilidade: 'auto',
          broker_id: undefined,
          client_name: '',
          client_email: '',
          client_phone: '',
          property_address: '',
          property_type: 'apartamento',
          property_value: 0,
          vgv: 0,
          vgc: 0,
          status: 'pendente',
          notes: '',
          sale_type: defaultSaleType || 'lancamento',
          sale_date: new Date().toISOString().split('T')[0],
          origem: '',
          estilo: '',
          produto: '',
          captador: '',
          vendedor_nome: '',
          vendedor_telefone: '',
          vendedor_creci: '',
          parceria_tipo: undefined,
          gerente: '',
          pagos: 0,
          ano: new Date().getFullYear(),
          mes: new Date().getMonth() + 1,
          latitude: '',
          is_partnership: false,
        });
      }
    }
  }, [isOpen, sale, form]);

  const handleSubmit = async (data: SaleFormData) => {
    try {
      const selectedBroker = brokers.find(b => b.id === data.broker_id);
      const commissionRate = selectedBroker?.commission_rate || 5;
      const vgcValue = data.vgc > 0 ? data.vgc : data.property_value;
      const isVenda = data.tipo === 'venda';
      const commission_value = isVenda ? (vgcValue * Number(commissionRate)) / 100 : 0;
      
      await onSubmit({
        ...data,
        vgv: isVenda ? data.property_value : 0,
        vgc: vgcValue,
        commission_value,
        client_email: data.client_email || null,
      });
      
      if (!sale) {
        // Only reset form for new sales, not edits
        form.reset();
      }
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
                    <FormLabel>Valor do Imóvel / VGV</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        value={field.value || 0}
                        onChange={field.onChange}
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
                    <FormLabel>VGC - Valor da Comissão Geral</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        value={field.value || 0}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Valor base para cálculo da comissão. Se não informado, será usado o VGV.
                    </p>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Tipo: Venda ou Captação — bloqueado para Lançamento */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "venda"}
                    disabled={watchSaleType === 'lancamento'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="venda">🟢 Venda</SelectItem>
                      {watchSaleType !== 'lancamento' && (
                        <SelectItem value="captacao">🔵 Captação</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {watchSaleType === 'lancamento' && (
                    <p className="text-xs text-muted-foreground">Lançamento é sempre do tipo Venda</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibilidade: onde o registro aparece */}
            <FormField
              control={form.control}
              name="visibilidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exibir em</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "auto"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Automático" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="auto">🔄 Automático (segue o tipo)</SelectItem>
                      <SelectItem value="venda">🟢 Somente Vendas</SelectItem>
                      <SelectItem value="captacao">🔵 Somente Captação</SelectItem>
                      <SelectItem value="ambos">🟣 Vendas e Captação</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {field.value === 'auto' ? 'Aparece na tela correspondente ao tipo' : 
                     field.value === 'ambos' ? 'Aparece nas duas telas' :
                     field.value === 'venda' ? 'Aparece somente na tela de Vendas' :
                     'Aparece somente na tela de Captação'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              
              <FormField
                control={form.control}
                name="is_partnership"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Venda em Parceria
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Marque se esta venda foi realizada em parceria com outra imobiliária/corretor.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => {
                  const origemOptions = [
                    'Indicação', 'Site', 'Redes Sociais', 'Plantão', 'Portal Imobiliário',
                    'WhatsApp', 'Telefone', 'Stand de Vendas', 'Evento', 'Parceiro',
                    'Google Ads', 'Facebook Ads', 'Instagram', 'Placa', 'Outros'
                  ];
                  const [showOrigemDropdown, setShowOrigemDropdown] = useState(false);
                  const filteredOptions = origemOptions.filter(opt =>
                    opt.toLowerCase().includes((field.value || '').toLowerCase())
                  );
                  return (
                    <FormItem className="relative">
                      <FormLabel>Origem *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite ou selecione a origem..."
                          {...field}
                          onFocus={() => setShowOrigemDropdown(true)}
                          onBlur={() => setTimeout(() => setShowOrigemDropdown(false), 200)}
                          onChange={(e) => {
                            field.onChange(e);
                            setShowOrigemDropdown(true);
                          }}
                          autoComplete="off"
                        />
                      </FormControl>
                      {showOrigemDropdown && filteredOptions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                          {filteredOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors text-popover-foreground"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                field.onChange(opt);
                                setShowOrigemDropdown(false);
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

            <div className={`grid ${watchSaleType === 'lancamento' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {watchSaleType !== 'lancamento' && (
                <>
                  <FormField
                    control={form.control}
                    name="captador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Captador *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o captador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brokers
                              .filter(b => b.status === 'ativo')
                              .map((broker) => (
                                <SelectItem key={broker.id} value={broker.name}>
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
                    name="vendedor_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendedor na Captação</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome de quem vendeu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vendedor_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone do Vendedor</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendedor_creci"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRECI do Vendedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do CRECI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parceria_tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Parceria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Agência">Agência</SelectItem>
                            <SelectItem value="Mercado">Mercado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <FormField
                control={form.control}
                name="gerente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gerente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gerente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.full_name}>
                            {manager.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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