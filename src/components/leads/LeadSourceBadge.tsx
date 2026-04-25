import { Badge } from '@/components/ui/badge';
import { Facebook, Globe, Instagram, MessageCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Facebook; className: string }> = {
  facebook: { label: 'Facebook', icon: Facebook, className: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400' },
  instagram: { label: 'Instagram', icon: Instagram, className: 'bg-pink-500/15 text-pink-600 border-pink-500/30 dark:text-pink-400' },
  site: { label: 'Site', icon: Globe, className: 'bg-violet-500/15 text-violet-600 border-violet-500/30 dark:text-violet-400' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' },
  manual: { label: 'Manual', icon: UserPlus, className: 'bg-muted text-muted-foreground border-border' },
};

export const LeadSourceBadge = ({ source }: { source: string }) => {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.manual;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', cfg.className)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
};

export const LEAD_SOURCES = Object.keys(SOURCE_CONFIG);
