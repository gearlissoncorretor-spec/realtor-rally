import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import type { Database } from '@/integrations/supabase/types';

// Use Supabase types directly
export type Broker = Database['public']['Tables']['brokers']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'] & {
  broker?: {
    name: string;
    email: string;
  };
};
export type Target = Database['public']['Tables']['targets']['Row'];

type BrokerInsert = Database['public']['Tables']['brokers']['Insert'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type TargetInsert = Database['public']['Tables']['targets']['Insert'];

interface DataContextType {
  // Data
  brokers: Broker[];
  sales: Sale[];
  targets: Target[];
  
  // Loading states
  brokersLoading: boolean;
  salesLoading: boolean;
  targetsLoading: boolean;
  
  // Error states
  brokersError: Error | null;
  salesError: Error | null;
  targetsError: Error | null;
  
  // CRUD functions
  createBroker: (broker: BrokerInsert & { password?: string }) => Promise<void>;
  updateBroker: (id: string, broker: Partial<Broker>) => Promise<void>;
  deleteBroker: (id: string) => Promise<void>;
  
  createSale: (sale: SaleInsert) => Promise<any>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  createTarget: (target: TargetInsert) => Promise<void>;
  updateTarget: (id: string, target: Partial<Target>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  
  // Refresh functions
  refreshBrokers: () => Promise<void>;
  refreshSales: () => Promise<void>;
  refreshTargets: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, teamHierarchy, getUserRole, loading: authLoading } = useAuth();
  const userRole = getUserRole();
  
  // Stable query key - use primitive values only
  const teamId = teamHierarchy?.team_id ?? null;
  
  // Queries com React Query - com filtros por hierarquia
  const { 
    data: brokers = [], 
    isLoading: brokersLoading,
    error: brokersError 
  } = useQuery({
    queryKey: ['brokers', user?.id, teamId, userRole],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        let query = supabase
          .from('brokers')
          .select('*')
          .order('created_at', { ascending: false });
        
        const role = getUserRole();
        
        // Gerente vê apenas corretores da sua equipe
        if (role === 'gerente' && teamHierarchy?.team_id) {
          query = query.eq('team_id', teamHierarchy.team_id);
        }
        // Corretor vê apenas seus próprios dados
        else if (role === 'corretor') {
          query = query.eq('user_id', user.id);
        }
        // Diretor e Admin veem tudo
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching brokers:', error);
          throw new Error(`Erro ao carregar corretores: ${error.message}`);
        }
        return data as Broker[];
      } catch (err) {
        console.error('Brokers query failed:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user && !authLoading,
  });

  const { 
    data: sales = [], 
    isLoading: salesLoading,
    error: salesError 
  } = useQuery({
    queryKey: ['sales', user?.id, teamId, userRole],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const role = getUserRole();
        
        // Pre-fetch role-based broker filter
        let brokerFilter: { type: 'eq' | 'in' | 'none'; value?: string | string[] } = { type: 'none' };
        
        if (role === 'corretor') {
          const { data: brokerData } = await supabase
            .from('brokers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (brokerData) {
            brokerFilter = { type: 'eq', value: brokerData.id };
          } else {
            return [];
          }
        } else if (role === 'gerente' && teamHierarchy?.team_id) {
          const { data: teamBrokers } = await supabase
            .from('brokers')
            .select('id')
            .eq('team_id', teamHierarchy.team_id);
          
          if (teamBrokers && teamBrokers.length > 0) {
            brokerFilter = { type: 'in', value: teamBrokers.map(b => b.id) };
          }
        }
        
        // Helper to build a fresh query each time
        const buildQuery = () => {
          let q = supabase
            .from('sales')
            .select(`
              *,
              broker:brokers(name, email)
            `)
            .order('created_at', { ascending: false });
          
          if (brokerFilter.type === 'eq') {
            q = q.eq('broker_id', brokerFilter.value as string);
          } else if (brokerFilter.type === 'in') {
            q = q.in('broker_id', brokerFilter.value as string[]);
          }
          
          return q;
        };
        
        // Single query with limit — most users won't have >1000 sales
        const { data, error } = await buildQuery().limit(1000);
        
        if (error) {
          console.error('Error fetching sales:', error);
          throw new Error(`Erro ao carregar vendas: ${error.message}`);
        }
        
        return (data as Sale[]) || [];
      } catch (err) {
        console.error('Sales query failed:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user && !authLoading,
  });

  const { 
    data: targets = [], 
    isLoading: targetsLoading,
    error: targetsError 
  } = useQuery({
    queryKey: ['targets', user?.id, teamId, userRole],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Confia no RLS para filtrar dados por perfil
        const query = supabase
          .from('targets')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching targets:', error);
          throw new Error(`Erro ao carregar metas: ${error.message}`);
        }
        
        // RLS já faz o filtro correto no banco
        return data as Target[];
      } catch (err) {
        console.error('Targets query failed:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });

  // Broker Mutations
  const createBrokerMutation = useMutation({
    mutationFn: async (broker: BrokerInsert & { password?: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) throw new Error('Usuário não autenticado');

      const generateRandomPassword = () => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
        const digits = '23456789';
        const all = letters + digits + '!@#$%';
        const rng = crypto.getRandomValues(new Uint8Array(12));
        return [
          letters[rng[0] % letters.length],
          digits[rng[1] % digits.length],
          ...Array.from(rng.slice(2)).map(b => all[b % all.length]),
        ].sort(() => Math.random() - 0.5).join('');
      };

      const finalPassword = broker.password || generateRandomPassword();

      const response = await fetch(
        'https://kwsnnwiwflsvsqiuzfja.supabase.co/functions/v1/create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: broker.name,
            email: broker.email,
            password: finalPassword,
            role: 'corretor',
            allowed_screens: ['dashboard', 'vendas', 'negociacoes', 'follow-up', 'metas', 'atividades', 'configuracoes', 'agenda', 'comissoes', 'instalar'],
            team_id: broker.team_id,
            phone: broker.phone,
            cpf: broker.cpf,
            creci: broker.creci,
            avatar_url: broker.avatar_url,
            meta_monthly: broker.meta_monthly,
            observations: broker.observations,
            status: broker.status || 'ativo',
            created_by: user?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar corretor');
      }
      return { ...(await response.json()), tempPassword: finalPassword };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast({
        title: "Corretor criado",
        description: `Corretor adicionado com sucesso. Senha temporária: ${data.tempPassword} — Anote e envie ao corretor de forma segura.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar corretor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBrokerMutation = useMutation({
    mutationFn: async ({ id, broker }: { id: string; broker: Partial<Broker> }) => {
      const { data, error } = await supabase
        .from('brokers')
        .update(broker)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Sync changes to linked profile
      if (data.user_id) {
        const profileUpdate: Record<string, any> = {};
        if (broker.name) profileUpdate.full_name = broker.name;
        if (broker.email) profileUpdate.email = broker.email;
        if (broker.phone !== undefined) profileUpdate.phone = broker.phone;
        if (broker.avatar_url !== undefined) profileUpdate.avatar_url = broker.avatar_url;
        if (broker.team_id !== undefined) profileUpdate.team_id = broker.team_id;
        if (broker.birthday !== undefined) profileUpdate.birth_date = broker.birthday;

        if (Object.keys(profileUpdate).length > 0) {
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', data.user_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-usuarios'] });
      toast({
        title: "Corretor atualizado",
        description: "Dados do corretor atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar corretor",
        description: "Não foi possível atualizar o corretor.",
        variant: "destructive",
      });
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Usuário não autenticado');

      const response = await fetch(
        'https://kwsnnwiwflsvsqiuzfja.supabase.co/functions/v1/delete-broker',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ broker_id: id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir corretor');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Corretor excluído",
        description: "Corretor e todos os dados relacionados foram removidos com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir corretor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sale Mutations
  const createSaleMutation = useMutation({
    mutationFn: async (sale: SaleInsert) => {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select(`
          *,
          broker:brokers(name, email)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      const isCaptacao = data?.tipo === 'captacao';
      toast({
        title: isCaptacao ? "Captação criada" : "Venda criada",
        description: isCaptacao ? "Captação adicionada com sucesso." : "Venda adicionada com sucesso.",
      });

      if (!isCaptacao) {
        import('@/hooks/useSlackNotify').then(({ sendSlackNotification }) => {
          sendSlackNotification({
            event_type: 'nova_venda',
            data: {
              broker_name: data?.broker?.name || 'N/A',
              client_name: data?.client_name,
              property_address: data?.property_address,
              property_type: data?.property_type,
              property_value: data?.property_value,
              vgv: data?.vgv,
              sale_date: data?.sale_date,
              is_partnership: data?.is_partnership ? 'Sim' : 'Não',
            },
          }).catch(console.error);
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro ao criar registro",
        description: "Não foi possível salvar o registro.",
        variant: "destructive",
      });
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: async ({ id, sale }: { id: string; sale: Partial<Sale> }) => {
      const { data, error } = await supabase
        .from('sales')
        .update(sale)
        .eq('id', id)
        .select(`
          *,
          broker:brokers(name, email)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      const isCaptacao = data?.tipo === 'captacao';
      toast({
        title: isCaptacao ? "Captação atualizada" : "Venda atualizada",
        description: isCaptacao ? "Dados da captação atualizados com sucesso." : "Dados da venda atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar registro",
        description: "Não foi possível atualizar o registro.",
        variant: "destructive",
      });
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Venda removida",
        description: "Venda removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover venda",
        description: "Não foi possível remover a venda.",
        variant: "destructive",
      });
    },
  });

  // Target Mutations
  const createTargetMutation = useMutation({
    mutationFn: async (target: TargetInsert) => {
      const { data, error } = await supabase
        .from('targets')
        .insert([target])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast({
        title: "Meta criada",
        description: "Meta adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta.",
        variant: "destructive",
      });
    },
  });

  const updateTargetMutation = useMutation({
    mutationFn: async ({ id, target }: { id: string; target: Partial<Target> }) => {
      const { data, error } = await supabase
        .from('targets')
        .update(target)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast({
        title: "Meta atualizada",
        description: "Meta atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
    },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast({
        title: "Meta removida",
        description: "Meta removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover meta",
        description: "Não foi possível remover a meta.",
        variant: "destructive",
      });
    },
  });

  // Real-time subscriptions are now handled by useRealtimeSync in App.tsx

  const value: DataContextType = {
    brokers,
    sales,
    targets,
    brokersLoading,
    salesLoading,
    targetsLoading,
    brokersError: brokersError as Error | null,
    salesError: salesError as Error | null,
    targetsError: targetsError as Error | null,
    createBroker: async (broker: BrokerInsert & { password?: string }) => {
      await createBrokerMutation.mutateAsync(broker);
    },
    updateBroker: async (id: string, broker: Partial<Broker>) => {
      await updateBrokerMutation.mutateAsync({ id, broker });
    },
    deleteBroker: async (id: string) => {
      await deleteBrokerMutation.mutateAsync(id);
    },
    createSale: async (sale: SaleInsert) => {
      return await createSaleMutation.mutateAsync(sale);
    },
    updateSale: async (id: string, sale: Partial<Sale>) => {
      await updateSaleMutation.mutateAsync({ id, sale });
    },
    deleteSale: async (id: string) => {
      await deleteSaleMutation.mutateAsync(id);
    },
    createTarget: async (target: TargetInsert) => {
      await createTargetMutation.mutateAsync(target);
    },
    updateTarget: async (id: string, target: Partial<Target>) => {
      await updateTargetMutation.mutateAsync({ id, target });
    },
    deleteTarget: async (id: string) => {
      await deleteTargetMutation.mutateAsync(id);
    },
    refreshBrokers: () => queryClient.invalidateQueries({ queryKey: ['brokers'] }),
    refreshSales: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
    refreshTargets: () => queryClient.invalidateQueries({ queryKey: ['targets'] }),
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
