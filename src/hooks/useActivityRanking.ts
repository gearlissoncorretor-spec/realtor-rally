import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Broker = Database['public']['Tables']['brokers']['Row'];

export interface ActivityRankingEntry {
  id: string;
  name: string;
  avatar: string;
  activityCount: number;
  weightedScore: number;
  position: number;
  growth: number | null;
  userId: string | null;
  teamId: string | null;
  teamName: string | null;
  breakdown: Record<string, number>;
}

export interface ActivityWeight {
  name: string;
  weight: number;
  icon: string;
}

const DEFAULT_ACTIVITY_WEIGHTS: ActivityWeight[] = [
  { name: 'Ligações', weight: 1, icon: '📞' },
  { name: 'Visitas', weight: 3, icon: '🏠' },
  { name: 'Atendimentos', weight: 2, icon: '🤝' },
  { name: 'Captações', weight: 4, icon: '📋' },
  { name: 'Follow-ups', weight: 2, icon: '🔄' },
  { name: 'Propostas', weight: 5, icon: '📄' },
];

export const useActivityRanking = (
  brokers: Broker[],
  teams: { id: string; name: string }[],
  period: 'week' | 'month' | 'year',
  selectedActivity: string, // 'all' or specific activity name
  teamFilter: string,
  managerUserIds: string[],
) => {
  const { user } = useAuth();

  // Fetch weekly activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-ranking-data', period],
    queryFn: async () => {
      const now = new Date();
      let startDate: string;

      if (period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
      } else if (period === 'month') {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else {
        startDate = `${now.getFullYear()}-01-01`;
      }

      const { data, error } = await supabase
        .from('broker_weekly_activities')
        .select('*')
        .gte('week_start', startDate)
        .order('week_start', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Get unique activity names
  const activityNames = useMemo(() => {
    const names = new Set<string>();
    activities.forEach(a => names.add(a.task_name));
    return Array.from(names).sort();
  }, [activities]);

  // Get weights (from localStorage or defaults)
  const activityWeights = useMemo((): ActivityWeight[] => {
    try {
      const saved = localStorage.getItem('activity-weights');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVITY_WEIGHTS;
  }, []);

  const getWeight = (activityName: string): number => {
    const found = activityWeights.find(
      w => w.name.toLowerCase() === activityName.toLowerCase()
    );
    return found?.weight || 1;
  };

  // Build rankings
  const rankings = useMemo((): ActivityRankingEntry[] => {
    let filteredBrokers = brokers.filter(b => b.status === 'ativo');
    
    // Exclude managers
    filteredBrokers = filteredBrokers.filter(
      b => !b.user_id || !managerUserIds.includes(b.user_id)
    );

    // Team filter
    if (teamFilter !== 'all') {
      filteredBrokers = filteredBrokers.filter(b => b.team_id === teamFilter);
    }

    const entries = filteredBrokers.map(broker => {
      const brokerActivities = activities.filter(a => a.broker_id === broker.id);
      
      // Build breakdown
      const breakdown: Record<string, number> = {};
      let totalCount = 0;
      let weightedScore = 0;

      brokerActivities.forEach(a => {
        const count = a.realizado || 0;
        breakdown[a.task_name] = (breakdown[a.task_name] || 0) + count;
        
        if (selectedActivity === 'all' || a.task_name === selectedActivity) {
          totalCount += count;
          weightedScore += count * getWeight(a.task_name);
        }
      });

      // If filtering by specific activity, only count that one
      if (selectedActivity !== 'all') {
        totalCount = breakdown[selectedActivity] || 0;
        weightedScore = totalCount * getWeight(selectedActivity);
      }

      const team = teams.find(t => t.id === broker.team_id);

      return {
        id: broker.id,
        name: broker.name,
        avatar: broker.avatar_url || '',
        activityCount: totalCount,
        weightedScore,
        position: 0,
        growth: null,
        userId: broker.user_id,
        teamId: broker.team_id,
        teamName: team?.name || null,
        breakdown,
      };
    });

    return entries
      .filter(e => e.activityCount > 0 || selectedActivity === 'all')
      .sort((a, b) => b.weightedScore - a.weightedScore || b.activityCount - a.activityCount)
      .map((e, i) => ({ ...e, position: i + 1 }));
  }, [brokers, activities, selectedActivity, teamFilter, managerUserIds, teams, activityWeights]);

  // Top performer insight
  const insight = useMemo(() => {
    if (rankings.length === 0) return null;
    const top = rankings[0];
    const periodLabel = period === 'week' ? 'semana' : period === 'month' ? 'mês' : 'ano';
    return {
      brokerName: top.name,
      count: top.activityCount,
      periodLabel,
      message: `${top.name} lidera com ${top.activityCount} atividades neste ${periodLabel}!`,
    };
  }, [rankings, period]);

  return {
    rankings,
    activityNames,
    activityWeights,
    isLoading,
    insight,
  };
};

export const saveActivityWeights = (weights: ActivityWeight[]) => {
  localStorage.setItem('activity-weights', JSON.stringify(weights));
};
