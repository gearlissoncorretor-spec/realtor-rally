import React from 'react';
import { Phone, MapPin, Users, RotateCcw } from 'lucide-react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format } from 'date-fns';

interface AgendaSummaryCardsProps {
  events: CalendarEvent[];
  currentDate: Date;
}

const AgendaSummaryCards = ({ events, currentDate }: AgendaSummaryCardsProps) => {
  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const todayEvents = events.filter(e => e.event_date === todayStr);

  const counts = {
    ligacao: todayEvents.filter(e => e.event_type === 'reuniao' || e.event_type === 'lembrete').length,
    visita: todayEvents.filter(e => e.event_type === 'visita' || e.event_type === 'captacao').length,
    reuniao: todayEvents.filter(e => e.event_type === 'reuniao' || e.event_type === 'meta').length,
    followup: todayEvents.filter(e => e.event_type === 'follow_up').length,
  };

  const cards = [
    {
      label: 'Ligações',
      count: counts.ligacao,
      icon: Phone,
      gradient: 'from-blue-500/20 to-blue-600/5',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      glow: 'shadow-blue-500/10',
    },
    {
      label: 'Visitas',
      count: counts.visita,
      icon: MapPin,
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
    {
      label: 'Reuniões',
      count: counts.reuniao,
      icon: Users,
      gradient: 'from-purple-500/20 to-purple-600/5',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      glow: 'shadow-purple-500/10',
    },
    {
      label: 'Follow-ups',
      count: counts.followup,
      icon: RotateCcw,
      gradient: 'from-orange-500/20 to-orange-600/5',
      border: 'border-orange-500/30',
      iconColor: 'text-orange-400',
      glow: 'shadow-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-4 shadow-lg ${card.glow} transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{card.count}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.iconColor} opacity-80`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgendaSummaryCards;
