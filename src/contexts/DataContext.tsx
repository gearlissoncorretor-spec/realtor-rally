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
  
  // CRUD functions
  createBroker: (broker: BrokerInsert) => Promise<void>;
  updateBroker: (id: string, broker: Partial<Broker>) => Promise<void>;
  deleteBroker: (id: string) => Promise<void>;
  
  createSale: (sale: SaleInsert) => Promise<void>;
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
  const { user, teamHierarchy, getUserRole } = useAuth();

  // Queries com React Query - com filtros por hierarquia
  const { data: brokers = [], isLoading: brokersLoading } = useQuery({
    queryKey: ['brokers', user?.id, teamHierarchy],
    queryFn: async () => {
      if (!user) return [];
      
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
      
      if (error) throw error;
      return data as Broker[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', user?.id, teamHierarchy],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('sales')
        .select(`
          *,
          broker:brokers(name, email),
          process_stages (
            id,
            title,
            color,
            order_index
          )
        `)
        .order('created_at', { ascending: false });
      
      const role = getUserRole();
      
      // Filtros aplicados no frontend para complementar RLS
      // RLS já controla acesso no banco, mas aplicamos filtros aqui para performance
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Gerente filtra vendas da sua equipe
      if (role === 'gerente' && teamHierarchy?.team_members) {
        const teamBrokerIds = brokers
          .filter(b => b.team_id === teamHierarchy.team_id)
          .map(b => b.id);
        return (data as Sale[]).filter(sale => 
          sale.broker_id && teamBrokerIds.includes(sale.broker_id)
        );
      }
      
      return data as Sale[];
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!user,
  });

  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['targets', user?.id, teamHierarchy],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('targets')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      const role = getUserRole();
      
      // Gerente vê apenas metas dos corretores da sua equipe
      if (role === 'gerente' && teamHierarchy?.team_id) {
        const teamBrokerIds = brokers
          .filter(b => b.team_id === teamHierarchy.team_id)
          .map(b => b.id);
        
        query = query.in('broker_id', teamBrokerIds);
      }
      // Corretor vê apenas suas próprias metas
      else if (role === 'corretor') {
        const myBroker = brokers.find(b => b.user_id === user.id);
        if (myBroker) {
          query = query.eq('broker_id', myBroker.id);
        }
      }
      // Diretor e Admin veem tudo
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Target[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!user,
  });

  // Broker Mutations
  const createBrokerMutation = useMutation({
    mutationFn: async (broker: BrokerInsert) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) throw new Error('Usuário não autenticado');

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
            password: 'TempPass123!',
            role: 'corretor',
            allowed_screens: ['dashboard', 'vendas'],
            team_id: broker.team_id,
            phone: broker.phone,
            cpf: broker.cpf,
            creci: broker.creci,
            avatar_url: broker.avatar_url,
            meta_monthly: broker.meta_monthly,
            observations: broker.observations,
            status: broker.status || 'ativo',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar corretor');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast({
        title: "Corretor criado",
        description: "Corretor adicionado com sucesso. Senha temporária: TempPass123!",
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
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
      const { error } = await supabase
        .from('brokers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      toast({
        title: "Corretor removido",
        description: "Corretor removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover corretor",
        description: "Não foi possível remover o corretor.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Venda criada",
        description: "Venda adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar venda",
        description: "Não foi possível criar a venda.",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast({
        title: "Venda atualizada",
        description: "Dados da venda atualizados com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar venda",
        description: "Não foi possível atualizar a venda.",
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

  // Set up real-time subscriptions para todas as tabelas
  useEffect(() => {
    if (!user) return;

    const salesChannel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sales'] });
        }
      )
      .subscribe();

    const brokersChannel = supabase
      .channel('brokers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brokers'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['brokers'] });
        }
      )
      .subscribe();

    const targetsChannel = supabase
      .channel('targets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'targets'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['targets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(brokersChannel);
      supabase.removeChannel(targetsChannel);
    };
  }, [queryClient, user]);

  const value: DataContextType = {
    brokers,
    sales,
    targets,
    brokersLoading,
    salesLoading,
    targetsLoading,
    createBroker: async (broker: BrokerInsert) => {
      await createBrokerMutation.mutateAsync(broker);
    },
    updateBroker: async (id: string, broker: Partial<Broker>) => {
      await updateBrokerMutation.mutateAsync({ id, broker });
    },
    deleteBroker: async (id: string) => {
      await deleteBrokerMutation.mutateAsync(id);
    },
    createSale: async (sale: SaleInsert) => {
      await createSaleMutation.mutateAsync(sale);
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