import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Agency {
  id: string;
  name: string;
  status: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export const useAgencies = () => {
  const { profile } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgencies = useCallback(async () => {
    if (!profile?.company_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      setAgencies(data || []);
    } catch (error: any) {
      console.error('Error fetching agencies:', error);
      toast({
        title: "Erro ao carregar lojas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, toast]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  return {
    agencies,
    loading,
    refreshAgencies: fetchAgencies,
  };
};
