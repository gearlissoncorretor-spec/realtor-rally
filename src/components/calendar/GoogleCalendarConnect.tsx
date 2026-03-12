import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Loader2, Link, Unlink } from 'lucide-react';

const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="15" cy="15" r="2" fill="#4285F4" />
  </svg>
);

interface GoogleCalendarConnectProps {
  startDate?: string;
  endDate?: string;
}

const GoogleCalendarConnect = ({ startDate, endDate }: GoogleCalendarConnectProps) => {
  const {
    isConnected,
    connectedEmail,
    isLoadingStatus,
    connect,
    disconnect,
  } = useGoogleCalendar(startDate, endDate);

  if (isLoadingStatus) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Google
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
          <GoogleCalendarIcon />
          {connectedEmail || 'Google Calendar'}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => disconnect.mutate()}
          disabled={disconnect.isPending}
          title="Desconectar Google Calendar"
        >
          {disconnect.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
      onClick={connect}
    >
      <Link className="w-3.5 h-3.5" />
      Conectar Google Calendar
    </Button>
  );
};

export default GoogleCalendarConnect;
