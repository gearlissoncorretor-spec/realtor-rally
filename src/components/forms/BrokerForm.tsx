import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { Broker } from '@/contexts/DataContext';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';

const brokerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  creci: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'ferias']),
  team_id: z.string().min(1, 'Equipe é obrigatória'),
  observations: z.string().max(200, 'Observação deve ter no máximo 200 caracteres').optional(),
  meta_monthly: z.number().min(0).optional(),
  avatar_url: z.string().optional(),
});

type BrokerFormData = z.infer<typeof brokerSchema>;

interface BrokerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BrokerFormData) => Promise<void>;
  broker?: Broker;
  title: string;
}

export const BrokerForm: React.FC<BrokerFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  broker,
  title,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(broker?.avatar_url || null);
  const { teams } = useTeams();
  const { profile, isGerente, isDiretor } = useAuth();
  
  // Filtrar equipes disponíveis baseado na role do usuário
  const availableTeams = useMemo(() => {
    // Se for gerente, só pode atribuir à sua própria equipe
    if (isGerente() && profile?.team_id) {
      return teams.filter(team => team.id === profile.team_id);
    }
    // Diretores e admins veem todas as equipes
    return teams;
  }, [teams, isGerente, isDiretor, profile]);
  
  // Sincronizar avatar com dados do broker
  React.useEffect(() => {
    if (broker?.avatar_url) {
      setAvatarUrl(broker.avatar_url);
    }
  }, [broker]);
  
  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerSchema),
    values: {
      name: broker?.name || '',
      email: broker?.email || '',
      phone: broker?.phone || '',
      cpf: broker?.cpf || '',
      creci: broker?.creci || '',
      status: broker?.status || 'ativo',
      team_id: broker?.team_id || '',
      observations: broker?.observations || '',
      meta_monthly: broker?.meta_monthly || 0,
      avatar_url: broker?.avatar_url || '',
    },
  });

  const handleSubmit = async (data: BrokerFormData) => {
    try {
      const submitData = {
        ...data,
        // Convert empty strings to null for unique constraint fields
        cpf: data.cpf?.trim() || null,
        phone: data.phone?.trim() || null,
        creci: data.creci?.trim() || null,
        avatar_url: avatarUrl || null,
      };
      await onSubmit(submitData);
      form.reset();
      setAvatarUrl(null);
      onClose();
    } catch (error) {
      console.error('Error submitting broker form:', error);
      // Re-throw to let parent handle the toast
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Upload de Foto */}
            <div className="flex justify-center">
              <ImageUpload
                currentImage={avatarUrl || undefined}
                onImageChange={setAvatarUrl}
                placeholder="Foto do Corretor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Digite o email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRECI</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o CRECI" {...field} />
                    </FormControl>
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
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="ferias">Férias</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="team_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipe *</FormLabel>
                  {availableTeams.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhuma equipe disponível. {isGerente() ? 'Você precisa estar associado a uma equipe primeiro.' : 'Crie uma equipe na página de Equipes.'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma equipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isGerente() && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Como gerente, você só pode atribuir corretores à sua equipe
                        </p>
                      )}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="meta_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000" 
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
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite observações sobre o corretor (máximo 200 caracteres)"
                      className="resize-none"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {(field.value?.length || 0)}/200 caracteres
                  </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};