import { formatCurrency } from '@/utils/formatting';

const CARD_SIZE = 600;
const PIXEL_RATIO = 2;
const CANVAS_SIZE = CARD_SIZE * PIXEL_RATIO;

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  return [canvas, ctx];
}

function drawGradientBackground(ctx: CanvasRenderingContext2D, colors: string[]) {
  const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_SIZE, CARD_SIZE, 24);
  ctx.fill();
}

function drawSubtleCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  progress: number, bgColor: string, fgColors: string[]
) {
  // Background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height / 2);
  ctx.fill();
  // Foreground
  const fillWidth = Math.max(height, width * (progress / 100));
  const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
  gradient.addColorStop(0, fgColors[0]);
  gradient.addColorStop(1, fgColors[1]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, fillWidth, height, height / 2);
  ctx.fill();
}

function drawInitialsAvatar(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, size: number) {
  // Circle
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Initials
  const parts = name.trim().split(' ').filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size * 0.4}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x + size / 2, y + size / 2);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  opts: {
    font?: string; color?: string; align?: CanvasTextAlign;
    maxWidth?: number; baseline?: CanvasTextBaseline;
  } = {}
) {
  ctx.fillStyle = opts.color || '#fff';
  ctx.font = opts.font || '16px "Segoe UI", sans-serif';
  ctx.textAlign = opts.align || 'left';
  ctx.textBaseline = opts.baseline || 'top';
  ctx.fillText(text, x, y, opts.maxWidth);
}

function downloadCanvas(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.92);
}

// ─── Goal Card ────────────────────────────────────────────────

export function generateGoalCard(opts: {
  brokerName: string;
  goalTitle: string;
  currentValue: number;
  targetValue: number;
  motivationalPhrase: string;
}) {
  const [canvas, ctx] = createCanvas();
  const { brokerName, goalTitle, currentValue, targetValue, motivationalPhrase } = opts;
  const progress = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const remaining = Math.max(targetValue - currentValue, 0);

  // Background
  drawGradientBackground(ctx, ['#0f172a', '#1e3a8a', '#1e40af']);
  drawSubtleCircle(ctx, 520, 80, 120, 'rgba(59,130,246,0.08)');
  drawSubtleCircle(ctx, 80, 520, 80, 'rgba(34,197,94,0.06)');

  // Header
  drawInitialsAvatar(ctx, brokerName, 40, 36, 56);
  drawText(ctx, '🎯  LEMBRETE DE META', 110, 38, {
    font: '600 12px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
  });
  drawText(ctx, brokerName, 110, 58, {
    font: 'bold 22px "Segoe UI", sans-serif',
    maxWidth: 440,
  });

  // Main value
  drawText(ctx, 'Falta apenas', CARD_SIZE / 2, 140, {
    font: '16px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.8)',
    align: 'center',
  });
  drawText(ctx, formatCurrency(remaining), CARD_SIZE / 2, 170, {
    font: 'bold 42px "Segoe UI", sans-serif',
    color: '#22c55e',
    align: 'center',
  });
  drawText(ctx, 'para bater a meta:', CARD_SIZE / 2, 225, {
    font: '16px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.8)',
    align: 'center',
  });
  drawText(ctx, goalTitle, CARD_SIZE / 2, 255, {
    font: '600 20px "Segoe UI", sans-serif',
    color: '#93c5fd',
    align: 'center',
    maxWidth: 500,
  });

  // Progress section
  const barY = 320;
  drawText(ctx, formatCurrency(currentValue), 50, barY, {
    font: '13px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
  });
  drawText(ctx, formatCurrency(targetValue), CARD_SIZE - 50, barY, {
    font: '13px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
    align: 'right',
  });
  drawProgressBar(ctx, 50, barY + 22, 500, 12, progress, 'rgba(255,255,255,0.12)', ['#22c55e', '#4ade80']);
  drawText(ctx, `${progress.toFixed(0)}%`, CARD_SIZE / 2, barY + 46, {
    font: 'bold 20px "Segoe UI", sans-serif',
    color: '#4ade80',
    align: 'center',
  });

  // Motivational phrase
  drawText(ctx, `"${motivationalPhrase}"`, CARD_SIZE / 2, 440, {
    font: 'italic 14px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.7)',
    align: 'center',
    maxWidth: 500,
  });

  // Footer
  drawText(ctx, 'AXIS CRM', CARD_SIZE / 2, 555, {
    font: '600 11px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.3)',
    align: 'center',
  });

  downloadCanvas(canvas, `meta-${Date.now()}.jpg`);
}

// ─── Ranking Card ─────────────────────────────────────────────

export function generateRankingCard(opts: {
  brokerName: string;
  position: number;
  totalSales: number;
  vgv: number;
  motivationalPhrase: string;
}) {
  const [canvas, ctx] = createCanvas();
  const { brokerName, position, totalSales, vgv, motivationalPhrase } = opts;
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`;

  drawGradientBackground(ctx, ['#1a1a2e', '#16213e', '#0f3460']);
  drawSubtleCircle(ctx, 300, 100, 160, 'rgba(245,158,11,0.05)');

  // Header
  drawText(ctx, '🏆  RANKING SEMANAL', CARD_SIZE / 2, 40, {
    font: '600 13px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
    align: 'center',
  });

  // Medal
  drawText(ctx, medal, CARD_SIZE / 2, 80, {
    font: '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif',
    align: 'center',
  });

  // Avatar + name
  drawInitialsAvatar(ctx, brokerName, CARD_SIZE / 2 - 36, 170, 72);
  drawText(ctx, brokerName, CARD_SIZE / 2, 260, {
    font: 'bold 28px "Segoe UI", sans-serif',
    align: 'center',
    maxWidth: 500,
  });

  // Stats
  drawText(ctx, String(totalSales), CARD_SIZE / 2 - 80, 320, {
    font: 'bold 36px "Segoe UI", sans-serif',
    color: '#f59e0b',
    align: 'center',
  });
  drawText(ctx, 'Vendas', CARD_SIZE / 2 - 80, 362, {
    font: '13px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
    align: 'center',
  });
  drawText(ctx, formatCurrency(vgv), CARD_SIZE / 2 + 80, 320, {
    font: 'bold 28px "Segoe UI", sans-serif',
    color: '#22c55e',
    align: 'center',
    maxWidth: 220,
  });
  drawText(ctx, 'VGV', CARD_SIZE / 2 + 80, 362, {
    font: '13px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
    align: 'center',
  });

  // Phrase
  drawText(ctx, `"${motivationalPhrase}"`, CARD_SIZE / 2, 440, {
    font: 'italic 14px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.7)',
    align: 'center',
    maxWidth: 500,
  });

  // Footer
  drawText(ctx, 'AXIS CRM', CARD_SIZE / 2, 555, {
    font: '600 11px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.3)',
    align: 'center',
  });

  downloadCanvas(canvas, `ranking-${Date.now()}.jpg`);
}

// ─── Sale Card ────────────────────────────────────────────────

export function generateSaleCard(opts: {
  brokerName: string;
  clientName: string;
  propertyValue: number;
  propertyType?: string;
  motivationalPhrase: string;
}) {
  const [canvas, ctx] = createCanvas();
  const { brokerName, clientName, propertyValue, propertyType, motivationalPhrase } = opts;

  drawGradientBackground(ctx, ['#064e3b', '#065f46', '#047857']);
  drawSubtleCircle(ctx, 500, 100, 140, 'rgba(134,239,172,0.06)');
  drawSubtleCircle(ctx, 100, 500, 100, 'rgba(134,239,172,0.04)');

  // Header
  drawText(ctx, '🎉  VENDA FECHADA!', CARD_SIZE / 2, 40, {
    font: '600 14px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.7)',
    align: 'center',
  });

  // Broker
  drawInitialsAvatar(ctx, brokerName, 40, 90, 56);
  drawText(ctx, brokerName, 110, 96, {
    font: 'bold 24px "Segoe UI", sans-serif',
    maxWidth: 440,
  });
  drawText(ctx, 'Corretor', 110, 126, {
    font: '14px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.6)',
  });

  // Client info
  drawText(ctx, `Cliente: ${clientName}`, CARD_SIZE / 2, 210, {
    font: '16px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.8)',
    align: 'center',
    maxWidth: 500,
  });
  if (propertyType) {
    drawText(ctx, `Tipo: ${propertyType}`, CARD_SIZE / 2, 240, {
      font: '14px "Segoe UI", sans-serif',
      color: 'rgba(255,255,255,0.6)',
      align: 'center',
    });
  }

  // Value
  drawText(ctx, formatCurrency(propertyValue), CARD_SIZE / 2, 290, {
    font: 'bold 48px "Segoe UI", sans-serif',
    color: '#86efac',
    align: 'center',
  });

  // Phrase
  drawText(ctx, `"${motivationalPhrase}"`, CARD_SIZE / 2, 420, {
    font: 'italic 14px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.7)',
    align: 'center',
    maxWidth: 500,
  });

  // Footer
  drawText(ctx, 'AXIS CRM', CARD_SIZE / 2, 555, {
    font: '600 11px "Segoe UI", sans-serif',
    color: 'rgba(255,255,255,0.3)',
    align: 'center',
  });

  downloadCanvas(canvas, `venda-${Date.now()}.jpg`);
}
