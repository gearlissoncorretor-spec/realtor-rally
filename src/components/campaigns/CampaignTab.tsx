import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Plus, History } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokers } from "@/hooks/useBrokers";
import CreateCampaignDialog from "./CreateCampaignDialog";
import CampaignLivePanel from "./CampaignLivePanel";
import CampaignReportCard from "./CampaignReportCard";

const CampaignTab = () => {
  const { isDiretor, isAdmin, isGerente, profile, user } = useAuth();
  const { brokers } = useBrokers();
  const {
    campaigns,
    activeCampaign,
    participants,
    reports,
    campaignsLoading,
    createCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    finishCampaign,
    incrementCounter,
    isCreating,
  } = useCampaigns();

  const [createOpen, setCreateOpen] = useState(false);

  const canManage = isDiretor() || isAdmin() || isGerente();

  // Find current user's broker id
  const currentBrokerId = useMemo(() => {
    return brokers.find(b => b.user_id === user?.id)?.id;
  }, [brokers, user?.id]);

  // Active or most recent non-draft campaign
  const currentCampaign = activeCampaign || campaigns.find(c => c.status === 'paused') || campaigns.find(c => c.status === 'draft');

  // Finished campaigns with reports
  const finishedCampaigns = campaigns.filter(c => c.status === 'finished');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" />
          <h2 className="text-lg font-bold">Modo Ofertão</h2>
        </div>
        {canManage && !currentCampaign && (
          <Button onClick={() => setCreateOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="w-4 h-4 mr-1" /> Nova Campanha
          </Button>
        )}
      </div>

      {/* Active / Draft Campaign */}
      {currentCampaign && (
        <CampaignLivePanel
          campaign={currentCampaign}
          participants={participants}
          brokers={brokers}
          currentBrokerId={currentBrokerId}
          canManage={canManage}
          onStart={startCampaign}
          onPause={pauseCampaign}
          onResume={resumeCampaign}
          onFinish={finishCampaign}
          onIncrement={incrementCounter}
        />
      )}

      {/* No active campaign */}
      {!currentCampaign && !campaignsLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 text-amber-500/40" />
          <p className="text-lg font-medium">Nenhuma campanha ativa</p>
          <p className="text-sm mt-1">
            {canManage
              ? "Crie uma nova campanha para iniciar o Modo Ofertão"
              : "Aguarde o gestor iniciar uma campanha"}
          </p>
        </div>
      )}

      {/* Past campaigns */}
      {finishedCampaigns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4" /> Campanhas Anteriores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {finishedCampaigns.map(c => {
              const report = reports.find(r => r.campaign_id === c.id);
              return report ? (
                <CampaignReportCard key={c.id} campaign={c} report={report} />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Create dialog */}
      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        brokers={brokers}
        onSubmit={createCampaign}
        isCreating={isCreating}
      />
    </div>
  );
};

export default CampaignTab;
