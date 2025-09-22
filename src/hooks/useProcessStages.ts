import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProcessStage {
  id: string;
  title: string;
  color: string;
  order_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useProcessStages = () => {
  const [stages, setStages] = useState<ProcessStage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('process_stages')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching process stages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar etapas do processo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStage = async (title: string, color: string) => {
    try {
      const maxOrder = Math.max(...stages.map(s => s.order_index), -1);
      const { data, error } = await supabase
        .from('process_stages')
        .insert({
          title,
          color,
          order_index: maxOrder + 1,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;
      
      setStages(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Etapa criada com sucesso",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating stage:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar etapa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStage = async (id: string, updates: Partial<ProcessStage>) => {
    try {
      const { data, error } = await supabase
        .from('process_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setStages(prev => prev.map(stage => stage.id === id ? data : stage));
      toast({
        title: "Sucesso",
        description: "Etapa atualizada com sucesso",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar etapa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStage = async (id: string) => {
    try {
      // Move all sales from this stage to the first default stage
      const firstDefaultStage = stages.find(s => s.is_default && s.order_index === 0);
      if (firstDefaultStage) {
        await supabase
          .from('sales')
          .update({ process_stage_id: firstDefaultStage.id })
          .eq('process_stage_id', id);
      }

      const { error } = await supabase
        .from('process_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setStages(prev => prev.filter(stage => stage.id !== id));
      toast({
        title: "Sucesso",
        description: "Etapa removida com sucesso",
      });
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover etapa",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSaleStage = async (saleId: string, stageId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ process_stage_id: stageId })
        .eq('id', saleId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Venda movida para nova etapa",
      });
    } catch (error) {
      console.error('Error updating sale stage:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover venda",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchStages();

    // Set up real-time subscription
    const channel = supabase
      .channel('process_stages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'process_stages'
        },
        () => {
          fetchStages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    stages,
    loading,
    createStage,
    updateStage,
    deleteStage,
    updateSaleStage,
    refreshStages: fetchStages
  };
};