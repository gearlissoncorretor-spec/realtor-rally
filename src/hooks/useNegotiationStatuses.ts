import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NegotiationStatus {
  id: string;
  value: string;
  label: string;
  color: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  is_system: boolean; // System statuses cannot be deleted
  created_at: string;
}

// Default statuses (these will be the initial ones)
export const DEFAULT_NEGOTIATION_STATUSES: Omit<NegotiationStatus, 'id' | 'created_at'>[] = [
  { 
    value: 'em_contato', 
    label: 'Em Contato', 
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: '📞',
    order_index: 0,
    is_active: true,
    is_system: true,
  },
  { 
    value: 'em_aprovacao', 
    label: 'Em Aprovação', 
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: '🟡',
    order_index: 1,
    is_active: true,
    is_system: true,
  },
  { 
    value: 'cliente_reprovado', 
    label: 'Cliente Reprovado', 
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: '🔴',
    order_index: 2,
    is_active: true,
    is_system: true,
  },
  { 
    value: 'cliente_aprovado', 
    label: 'Cliente Aprovado', 
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: '🟢',
    order_index: 3,
    is_active: true,
    is_system: true,
  },
  { 
    value: 'perdida', 
    label: 'Perdida', 
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: '❌',
    order_index: 98,
    is_active: true,
    is_system: true,
  },
  { 
    value: 'venda_concluida', 
    label: 'Venda Concluída', 
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    icon: '💰',
    order_index: 99,
    is_active: true,
    is_system: true,
  },
];

// For now, we'll use local storage to persist custom statuses
// In the future, this can be migrated to a database table
const STORAGE_KEY = 'negotiation_statuses';

export const useNegotiationStatuses = () => {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<NegotiationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Load statuses from localStorage on mount
  useEffect(() => {
    const loadStatuses = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setStatuses(parsed);
        } else {
          // Initialize with defaults
          const defaultWithIds = DEFAULT_NEGOTIATION_STATUSES.map((s, i) => ({
            ...s,
            id: `default-${i}`,
            created_at: new Date().toISOString(),
          }));
          setStatuses(defaultWithIds);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWithIds));
        }
      } catch (error) {
        console.error('Error loading statuses:', error);
        // Fallback to defaults
        const defaultWithIds = DEFAULT_NEGOTIATION_STATUSES.map((s, i) => ({
          ...s,
          id: `default-${i}`,
          created_at: new Date().toISOString(),
        }));
        setStatuses(defaultWithIds);
      } finally {
        setLoading(false);
      }
    };
    
    loadStatuses();
  }, []);

  // Save statuses to localStorage
  const saveStatuses = (newStatuses: NegotiationStatus[]) => {
    setStatuses(newStatuses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStatuses));
  };

  // Add a new custom status
  const addStatus = (status: Omit<NegotiationStatus, 'id' | 'created_at' | 'is_system'>) => {
    const newStatus: NegotiationStatus = {
      ...status,
      id: `custom-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_system: false,
    };
    
    const updated = [...statuses, newStatus].sort((a, b) => a.order_index - b.order_index);
    saveStatuses(updated);
    
    toast({
      title: 'Status criado',
      description: `O status "${status.label}" foi adicionado com sucesso.`,
    });
    
    return newStatus;
  };

  // Update an existing status
  const updateStatus = (id: string, updates: Partial<NegotiationStatus>) => {
    const updated = statuses.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ).sort((a, b) => a.order_index - b.order_index);
    
    saveStatuses(updated);
    
    toast({
      title: 'Status atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
  };

  // Deactivate a status (soft delete)
  const deactivateStatus = (id: string) => {
    const status = statuses.find(s => s.id === id);
    if (status?.is_system) {
      toast({
        title: 'Erro',
        description: 'Status do sistema não podem ser desativados.',
        variant: 'destructive',
      });
      return;
    }
    
    const updated = statuses.map(s => 
      s.id === id ? { ...s, is_active: false } : s
    );
    
    saveStatuses(updated);
    
    toast({
      title: 'Status desativado',
      description: 'O status foi desativado e não aparecerá mais na lista.',
    });
  };

  // Reactivate a status
  const reactivateStatus = (id: string) => {
    const updated = statuses.map(s => 
      s.id === id ? { ...s, is_active: true } : s
    );
    
    saveStatuses(updated);
    
    toast({
      title: 'Status reativado',
      description: 'O status foi reativado e voltou a aparecer na lista.',
    });
  };

  // Delete a custom status permanently
  const deleteStatus = (id: string) => {
    const status = statuses.find(s => s.id === id);
    if (status?.is_system) {
      toast({
        title: 'Erro',
        description: 'Status do sistema não podem ser excluídos.',
        variant: 'destructive',
      });
      return;
    }
    
    const updated = statuses.filter(s => s.id !== id);
    saveStatuses(updated);
    
    toast({
      title: 'Status excluído',
      description: 'O status foi removido permanentemente.',
    });
  };

  // Get only active statuses for dropdowns
  const activeStatuses = statuses.filter(s => s.is_active);
  
  // Get statuses for the negotiation flow (excluding terminal states)
  const flowStatuses = activeStatuses.filter(s => 
    !['perdida', 'venda_concluida'].includes(s.value)
  );

  // Get status by value
  const getStatusByValue = (value: string) => {
    return statuses.find(s => s.value === value);
  };

  return {
    statuses,
    activeStatuses,
    flowStatuses,
    loading,
    addStatus,
    updateStatus,
    deactivateStatus,
    reactivateStatus,
    deleteStatus,
    getStatusByValue,
  };
};
