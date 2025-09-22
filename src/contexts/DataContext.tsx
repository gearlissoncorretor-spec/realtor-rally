import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  
  const [brokersLoading, setBrokersLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [targetsLoading, setTargetsLoading] = useState(true);
  
  const { toast } = useToast();

  // Fetch Brokers
  const fetchBrokers = async () => {
    try {
      setBrokersLoading(true);
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrokers(data || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Erro ao carregar corretores",
        description: "Não foi possível carregar a lista de corretores.",
        variant: "destructive",
      });
    } finally {
      setBrokersLoading(false);
    }
  };

  // Fetch Sales
  const fetchSales = async () => {
    try {
      setSalesLoading(true);
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Erro ao carregar vendas",
        description: "Não foi possível carregar a lista de vendas.",
        variant: "destructive",
      });
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch Targets
  const fetchTargets = async () => {
    try {
      setTargetsLoading(true);
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setTargets(data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast({
        title: "Erro ao carregar metas",
        description: "Não foi possível carregar as metas.",
        variant: "destructive",
      });
    } finally {
      setTargetsLoading(false);
    }
  };

  // Broker CRUD
  const createBroker = async (broker: BrokerInsert) => {
    try {
      const { data, error } = await supabase
        .from('brokers')
        .insert([broker])
        .select()
        .single();

      if (error) throw error;
      setBrokers(prev => [data, ...prev]);
      toast({
        title: "Corretor criado",
        description: "Corretor adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error creating broker:', error);
      toast({
        title: "Erro ao criar corretor",
        description: "Não foi possível criar o corretor.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBroker = async (id: string, broker: Partial<Broker>) => {
    try {
      const { data, error } = await supabase
        .from('brokers')
        .update(broker)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setBrokers(prev => prev.map(b => b.id === id ? data : b));
      toast({
        title: "Corretor atualizado",
        description: "Dados do corretor atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Error updating broker:', error);
      toast({
        title: "Erro ao atualizar corretor",
        description: "Não foi possível atualizar o corretor.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBroker = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brokers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBrokers(prev => prev.filter(b => b.id !== id));
      toast({
        title: "Corretor removido",
        description: "Corretor removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast({
        title: "Erro ao remover corretor",
        description: "Não foi possível remover o corretor.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sale CRUD
  const createSale = async (sale: SaleInsert) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select(`
          *,
          broker:brokers(name, email)
        `)
        .single();

      if (error) throw error;
      setSales(prev => [data, ...prev]);
      toast({
        title: "Venda criada",
        description: "Venda adicionada com sucesso.",
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Erro ao criar venda",
        description: "Não foi possível criar a venda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
    try {
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
      setSales(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: "Venda atualizada",
        description: "Dados da venda atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "Erro ao atualizar venda",
        description: "Não foi possível atualizar a venda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSales(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Venda removida",
        description: "Venda removida com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: "Erro ao remover venda",
        description: "Não foi possível remover a venda.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Target CRUD
  const createTarget = async (target: TargetInsert) => {
    try {
      const { data, error } = await supabase
        .from('targets')
        .insert([target])
        .select()
        .single();

      if (error) throw error;
      setTargets(prev => [data, ...prev]);
      toast({
        title: "Meta criada",
        description: "Meta adicionada com sucesso.",
      });
    } catch (error) {
      console.error('Error creating target:', error);
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTarget = async (id: string, target: Partial<Target>) => {
    try {
      const { data, error } = await supabase
        .from('targets')
        .update(target)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTargets(prev => prev.map(t => t.id === id ? data : t));
      toast({
        title: "Meta atualizada",
        description: "Meta atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error updating target:', error);
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTarget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTargets(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Meta removida",
        description: "Meta removida com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting target:', error);
      toast({
        title: "Erro ao remover meta",
        description: "Não foi possível remover a meta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Refresh functions
  const refreshBrokers = () => fetchBrokers();
  const refreshSales = () => fetchSales();
  const refreshTargets = () => fetchTargets();

  // Initial fetch
  useEffect(() => {
    fetchBrokers();
    fetchSales();
    fetchTargets();

    // Set up real-time subscription for sales
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
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
    };
  }, []);

  const value: DataContextType = {
    brokers,
    sales,
    targets,
    brokersLoading,
    salesLoading,
    targetsLoading,
    createBroker,
    updateBroker,
    deleteBroker,
    createSale,
    updateSale,
    deleteSale,
    createTarget,
    updateTarget,
    deleteTarget,
    refreshBrokers,
    refreshSales,
    refreshTargets,
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