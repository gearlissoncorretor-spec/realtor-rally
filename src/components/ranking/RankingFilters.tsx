import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export const TeamFilter = ({
  teams,
  selectedTeam,
  onTeamChange,
}: {
  teams: { id: string; name: string }[];
  selectedTeam: string;
  onTeamChange: (t: string) => void;
}) => (
  <div className="flex flex-wrap gap-2 mb-4">
    <Button
      variant={selectedTeam === 'all' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onTeamChange('all')}
      className="text-xs h-8"
    >
      <Users className="w-3 h-3 mr-1" />
      Geral
    </Button>
    {teams.map(team => (
      <Button
        key={team.id}
        variant={selectedTeam === team.id ? 'default' : 'outline'}
        size="sm"
        onClick={() => onTeamChange(team.id)}
        className="text-xs h-8"
      >
        {team.name}
      </Button>
    ))}
  </div>
);

export const QuickPeriodButtons = ({
  activePeriod,
  onPeriodChange,
}: {
  activePeriod: string;
  onPeriodChange: (p: string) => void;
}) => {
  const periods = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Ano' },
    { key: 'all', label: 'Histórico' },
  ];

  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {periods.map(p => (
        <Button
          key={p.key}
          variant={activePeriod === p.key ? 'default' : 'ghost'}
          size="sm"
          className="text-xs h-7 px-3"
          onClick={() => onPeriodChange(p.key)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
};
