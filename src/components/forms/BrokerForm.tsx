import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const { teams, loading: teamsLoading } = useTeams();
  const { profile, isGerente, isDiretor } = useAuth();
  
  const availableTeams = useMemo(() => {
    if (isGerente() && profile?.team_id) {
      return teams.filter(team => team.id === profile.team_id);
    }
    return teams;
  }, [teams, isGerente, isDiretor, profile]);
  
  React.useEffect(() => {
    if (broker?.avatar_url) {
      setAvatarUrl(broker.avatar_url);
    } else if (!broker) {
      setAvatarUrl(null);
    }
  }, [broker]);

  // Auto-select team for managers with only one team
  const defaultTeamId = useMemo(() => {
    if (broker?.team_id) return broker.team_id;
    if (isGerente() && profile?.team_id) return profile.team_id;
    if (availableTeams.length === 1) return availableTeams[0].id;
    return '';
  }, [broker, isGerente, profile, availableTeams]);
  
  const form = useForm<BrokerFormData>({
    resolver: zodResolver(brokerSchema),
    values: {
      name: broker?.name || '',
      email: broker?.email || '',
      phone: broker?.phone || '',
      cpf: broker?.cpf || '',
      creci: broker?.creci || '',
      status: broker?.status || 'ativo',
      team_id: broker?.team_id || defaultTeamId,
      observations: broker?.observations || '',
      meta_monthly: broker?.meta_monthly || 0,
      avatar_url: broker?.avatar_url || '',
    },
  });

  const handleSubmit = async (data: BrokerFormData) => {
    setSubmitting(true);
    try {
      const submitData = {
        ...data,
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      form.reset();
      setAvatarUrl(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Upload de Foto */}
              <div className="flex justify-center py-2">
                <ImageUpload
                  currentImage={avatarUrl || undefined}
                  onImageChange={setAvatarUrl}
                  placeholder="Foto do Corretor"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} className="h-9" />
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
                      <FormLabel className="text-xs">Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} className="h-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} className="h-9" />
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
                      <FormLabel className="text-xs">CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} className="h-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="creci"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CRECI</FormLabel>
                      <FormControl>
                        <Input placeholder="CRECI" {...field} className="h-9" />
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
                      <FormLabel className="text-xs">Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "ativo"}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione" />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="team_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Equipe *</FormLabel>
                      {teamsLoading ? (
                        <div className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Carregando...
                        </div>
                      ) : availableTeams.length === 0 ? (
                        <Alert className="py-2">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            {isGerente() ? 'Você precisa estar associado a uma equipe.' : 'Crie uma equipe primeiro.'}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione" />
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
                            <p className="text-[10px] text-muted-foreground">
                              Atribuição restrita à sua equipe
                            </p>
                          )}
                        </>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Meta Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-9"
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
                    <FormLabel className="text-xs">Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações (máx 200 caracteres)"
                        className="resize-none h-16"
                        maxLength={200}
                        {...field}
                      />
                    </FormControl>
                    <div className="text-[10px] text-muted-foreground text-right">
                      {(field.value?.length || 0)}/200
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={submitting}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={submitting || availableTeams.length === 0}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Salvando...
                    </>
                  ) : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};