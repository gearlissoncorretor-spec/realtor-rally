import React from 'react';
import { formatCurrency } from '@/utils/formatting';

interface GoalCardData {
  brokerName: string;
  avatarUrl?: string | null;
  goalTitle: string;
  currentValue: number;
  targetValue: number;
  motivationalPhrase: string;
}

interface RankingCardData {
  brokerName: string;
  avatarUrl?: string | null;
  position: number;
  totalSales: number;
  vgv: number;
  motivationalPhrase: string;
}

interface SaleCardData {
  brokerName: string;
  avatarUrl?: string | null;
  clientName: string;
  propertyValue: number;
  propertyType?: string;
  motivationalPhrase: string;
}

const cardBase: React.CSSProperties = {
  width: 600,
  height: 600,
  padding: 40,
  borderRadius: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  position: 'absolute',
  left: '-9999px',
  top: '-9999px',
};

const avatarStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid rgba(255,255,255,0.3)',
};

const avatarFallback: React.CSSProperties = {
  ...avatarStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: 28,
  fontWeight: 700,
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const AvatarElement: React.FC<{ name: string; url?: string | null }> = ({ name, url }) => {
  if (url) {
    return <img src={url} alt={name} style={avatarStyle} crossOrigin="anonymous" />;
  }
  return <div style={avatarFallback}>{getInitials(name)}</div>;
};

// ─── Goal Card Template ───────────────────────────────────────

export const GoalCardTemplate = React.forwardRef<HTMLDivElement, GoalCardData>(
  ({ brokerName, avatarUrl, goalTitle, currentValue, targetValue, motivationalPhrase }, ref) => {
    const progress = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
    const remaining = targetValue - currentValue;

    return (
      <div
        ref={ref}
        style={{
          ...cardBase,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarElement name={brokerName} url={avatarUrl} />
          <div>
            <div style={{ fontSize: 14, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase' }}>
              🎯 Lembrete de Meta
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{brokerName}</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, opacity: 0.8 }}>Falta apenas</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#22c55e', margin: '8px 0' }}>
            {formatCurrency(Math.max(remaining, 0))}
          </div>
          <div style={{ fontSize: 16, opacity: 0.8 }}>para bater a meta:</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 8, color: '#93c5fd' }}>
            {goalTitle}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.7, marginBottom: 6 }}>
            <span>{formatCurrency(currentValue)}</span>
            <span>{formatCurrency(targetValue)}</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                borderRadius: 5,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginTop: 8, color: '#4ade80' }}>
            {progress.toFixed(0)}%
          </div>
        </div>

        {/* Motivational phrase */}
        <div style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.8, textAlign: 'center', lineHeight: 1.5 }}>
          "{motivationalPhrase}"
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' }}>
          Axis CRM
        </div>
      </div>
    );
  }
);
GoalCardTemplate.displayName = 'GoalCardTemplate';

// ─── Ranking Card Template ────────────────────────────────────

export const RankingCardTemplate = React.forwardRef<HTMLDivElement, RankingCardData>(
  ({ brokerName, avatarUrl, position, totalSales, vgv, motivationalPhrase }, ref) => {
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`;

    return (
      <div
        ref={ref}
        style={{
          ...cardBase,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
          🏆 Ranking Semanal
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, margin: '0 auto' }}>{medal}</div>
          <div style={{ margin: '12px auto' }}>
            <AvatarElement name={brokerName} url={avatarUrl} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{brokerName}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{totalSales}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Vendas</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>{formatCurrency(vgv)}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>VGV</div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.8, textAlign: 'center', lineHeight: 1.5 }}>
          "{motivationalPhrase}"
        </div>

        <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' }}>
          Axis CRM
        </div>
      </div>
    );
  }
);
RankingCardTemplate.displayName = 'RankingCardTemplate';

// ─── Sale Card Template ───────────────────────────────────────

export const SaleCardTemplate = React.forwardRef<HTMLDivElement, SaleCardData>(
  ({ brokerName, avatarUrl, clientName, propertyValue, propertyType, motivationalPhrase }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          ...cardBase,
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.7, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>
          🎉 Venda Fechada!
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <AvatarElement name={brokerName} url={avatarUrl} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{brokerName}</div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Corretor</div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, opacity: 0.8 }}>Cliente: {clientName}</div>
          {propertyType && <div style={{ fontSize: 14, opacity: 0.6, marginTop: 4 }}>Tipo: {propertyType}</div>}
          <div style={{ fontSize: 48, fontWeight: 800, color: '#86efac', margin: '12px 0' }}>
            {formatCurrency(propertyValue)}
          </div>
        </div>

        <div style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.8, textAlign: 'center', lineHeight: 1.5 }}>
          "{motivationalPhrase}"
        </div>

        <div style={{ fontSize: 11, opacity: 0.4, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' }}>
          Axis CRM
        </div>
      </div>
    );
  }
);
SaleCardTemplate.displayName = 'SaleCardTemplate';
