import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap } from "lucide-react";

interface Broker {
  id: string;
  name: string;
}

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokers: Broker[];
  onSubmit: (data: { title: string; meta_calls: number; broker_ids: string[] }) => Promise<any>;
  isCreating: boolean;
}

const CreateCampaignDialog = ({
  open,
  onOpenChange,
  brokers,
  onSubmit,
  isCreating,
}: CreateCampaignDialogProps) => {
  const [title, setTitle] = useState("");
  const [metaCalls, setMetaCalls] = useState(500);
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]);

  const toggleBroker = (brokerId: string) => {
    setSelectedBrokers(prev =>
      prev.includes(brokerId)
        ? prev.filter(id => id !== brokerId)
        : [...prev, brokerId]
    );
  };

  const selectAll = () => {
    if (selectedBrokers.length === brokers.length) {
      setSelectedBrokers([]);
    } else {
      setSelectedBrokers(brokers.map(b => b.id));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || selectedBrokers.length === 0) return;
    await onSubmit({ title: title.trim(), meta_calls: metaCalls, broker_ids: selectedBrokers });
    setTitle("");
    setMetaCalls(500);
    setSelectedBrokers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-amber-500" />
            Nova Campanha Ofertão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-title">Nome da Campanha</Label>
            <Input
              id="campaign-title"
              placeholder="Ex: Ofertão Abril 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-calls">Meta de Ligações</Label>
            <Input
              id="meta-calls"
              type="number"
              min={1}
              value={metaCalls}
              onChange={(e) => setMetaCalls(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Participantes</Label>
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                {selectedBrokers.length === brokers.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>
            <ScrollArea className="h-48 rounded-md border p-2">
              {brokers.map((broker) => (
                <label
                  key={broker.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedBrokers.includes(broker.id)}
                    onCheckedChange={() => toggleBroker(broker.id)}
                  />
                  <span className="text-sm font-medium">{broker.name}</span>
                </label>
              ))}
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              {selectedBrokers.length} de {brokers.length} selecionados
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || selectedBrokers.length === 0 || isCreating}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Criar Campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
