import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Phone, User, Video } from "lucide-react";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (contactType: string, notes?: string) => void;
}

const CONTACT_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'ligacao', label: 'Ligação', icon: Phone },
  { value: 'presencial', label: 'Presencial', icon: User },
  { value: 'videochamada', label: 'Videochamada', icon: Video },
];

export function AddContactDialog({
  open,
  onOpenChange,
  onConfirm,
}: AddContactDialogProps) {
  const [contactType, setContactType] = useState('whatsapp');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(contactType, notes || undefined);
    setContactType('whatsapp');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Contato</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo de Contato</label>
            <Select value={contactType} onValueChange={setContactType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Observação (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Breve descrição do contato..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Registrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
