import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const severityIcon: Record<AppNotification['severity'], React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
};

const severityColor: Record<AppNotification['severity'], string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  error: 'text-destructive',
  success: 'text-green-500',
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, remove, hasMore, loadMore, isFetching } = useNotifications();


  const handleClick = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link_to) navigate(n.link_to);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative rounded-lg h-9 w-9 p-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="text-sm font-semibold">Notificações</h3>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead()}>
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Alertas inteligentes aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = severityIcon[n.severity] || Info;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'group relative flex gap-3 px-4 py-3 transition-colors',
                      !n.read && 'bg-primary/[0.03]',
                      n.link_to && 'cursor-pointer hover:bg-accent/60'
                    )}
                    onClick={() => handleClick(n)}
                  >
                    {!n.read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', severityColor[n.severity])} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug', !n.read && 'font-medium')}>{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                      aria-label="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {hasMore && notifications.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-8"
                onClick={() => loadMore()}
                disabled={isFetching}
              >
                {isFetching ? 'Carregando…' : 'Carregar mais'}
              </Button>
            </div>
          )}
        </ScrollArea>

      </PopoverContent>
    </Popover>
  );
};
