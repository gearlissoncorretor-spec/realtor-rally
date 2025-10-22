import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

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

// Query keys
export const queryKeys = {
  brokers: ['brokers'] as const,
  sales: ['sales'] as const,
  targets: ['targets'] as const,
};

// Fetch functions
const fetchBrokers = async (): Promise<Broker[]> => {
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
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
    .order('sale_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchTargets = async (): Promise<Target[]> => {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Hooks
export const useBrokersQuery = () => {
  return useQuery({
    queryKey: queryKeys.brokers,
    queryFn: fetchBrokers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSalesQuery = () => {
  return useQuery({
    queryKey: queryKeys.sales,
    queryFn: fetchSales,
    staleTime: 1000 * 60 * 2, // 2 minutes (sales change more frequently)
  });
};

export const useTargetsQuery = () => {
  return useQuery({
    queryKey: queryKeys.targets,
    queryFn: fetchTargets,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Mutation hooks
export const useBrokerMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (broker: BrokerInsert) => {
      const { data, error } = await supabase
        .from('brokers')
        .insert([broker])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers });
      toast({ title: "Corretor criado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar corretor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Broker> }) => {
      const { error } = await supabase
        .from('brokers')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers });
      toast({ title: "Corretor atualizado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar corretor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brokers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brokers });
      toast({ title: "Corretor removido com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover corretor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createBroker: createMutation.mutateAsync,
    updateBroker: (id: string, data: Partial<Broker>) => 
      updateMutation.mutateAsync({ id, data }),
    deleteBroker: deleteMutation.mutateAsync,
  };
};

export const useSaleMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (sale: SaleInsert) => {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales });
      toast({ title: "Venda criada com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Sale> }) => {
      const { error } = await supabase
        .from('sales')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales });
      toast({ title: "Venda atualizada com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales });
      toast({ title: "Venda removida com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createSale: createMutation.mutateAsync,
    updateSale: (id: string, data: Partial<Sale>) => 
      updateMutation.mutateAsync({ id, data }),
    deleteSale: deleteMutation.mutateAsync,
  };
};
