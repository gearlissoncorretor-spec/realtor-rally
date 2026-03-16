import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from './UserCard';

interface TransferTeamDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: { id: string; name: string }[];
  onSaved: () => void;
}

const TransferTeamDialog: React.FC<TransferTeamDialogProps> = ({ user, open, onOpenChange, teams, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState('');
  const { toast } = useToast();

  const handleTransfer = async () => {
    if (!user) return;
    setLoading(true);

    const nextTeamId = teamId === 'none' ? null : teamId;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team_id: nextTeamId })
        .eq('id', user.id);

      if (error) throw error;

      const { error: brokerError } = await supabase
        .from('brokers')
        .update({ team_id: nextTeamId })
        .eq('user_id', user.id);

      if (brokerError) throw brokerError;

      toast({ title: "Usuário transferido com sucesso!" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao transferir", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferir Equipe</DialogTitle>
          <DialogDescription>Mover {user?.full_name} para outra equipe</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nova Equipe</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue placeholder="Selecionar equipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem equipe</SelectItem>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleTransfer} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
            Transferir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferTeamDialog;
