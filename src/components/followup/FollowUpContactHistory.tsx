import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare, Phone, User, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTACT_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  ligacao: Phone,
  presencial: User,
  videochamada: Video,
};

const CONTACT_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  presencial: "Presencial",
  videochamada: "Videochamada",
};

interface FollowUpContactHistoryProps {
  followUpId: string;
  className?: string;
}

export function FollowUpContactHistory({ followUpId, className }: FollowUpContactHistoryProps) {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['follow-up-contacts', followUpId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follow_up_contacts')
        .select('*')
        .eq('follow_up_id', followUpId)
        .order('contact_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
  }

  if (contacts.length === 0) {
    return <span className="text-xs text-muted-foreground italic">Sem contatos</span>;
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {contacts.map((contact) => {
        const Icon = CONTACT_ICONS[contact.contact_type] || Phone;
        return (
          <div key={contact.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3 h-3 shrink-0" />
            <span>{CONTACT_LABELS[contact.contact_type] || contact.contact_type}</span>
            <span className="text-muted-foreground/60">
              {format(parseISO(contact.contact_date), "dd/MM", { locale: ptBR })}
            </span>
            {contact.notes && (
              <span className="truncate max-w-[120px]" title={contact.notes}>
                — {contact.notes}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
