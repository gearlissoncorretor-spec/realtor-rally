import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Handshake, Building2, CalendarCheck, Clock, TrendingUp, FileText } from "lucide-react";
import { Campaign, CampaignReport } from "@/hooks/useCampaigns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignReportCardProps {
  campaign: Campaign;
  report: CampaignReport;
}

const CampaignReportCard = ({ campaign, report }: CampaignReportCardProps) => {
  const hours = Math.floor(report.duration_minutes / 60);
  const mins = report.duration_minutes % 60;
  const duration = hours > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${mins}min`;

  const stats = [
    { label: 'Ligações', value: report.total_calls, icon: Phone, color: 'text-blue-500' },
    { label: 'Negociações', value: report.total_negotiations, icon: Handshake, color: 'text-amber-500' },
    { label: 'Captações', value: report.total_captures, icon: Building2, color: 'text-emerald-500' },
    { label: 'Convites', value: report.total_appointments, icon: CalendarCheck, color: 'text-purple-500' },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            {campaign.title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {campaign.finished_at
              ? format(new Date(campaign.finished_at), "dd/MM/yyyy", { locale: ptBR })
              : 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center p-2 bg-muted/50 rounded-lg">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Duração: {duration}</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Conversão: {report.conversion_rate}%</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignReportCard;
