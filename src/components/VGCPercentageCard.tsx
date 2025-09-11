import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatPercentage, formatCurrency } from "@/utils/formatting";
import type { Sale } from "@/contexts/DataContext";

interface VGCPercentageCardProps {
  sales: Sale[];
  className?: string;
}

const VGCPercentageCard = ({ sales, className }: VGCPercentageCardProps) => {
  // Calcular totais de VGV e VGC
  const totalVGV = sales.reduce((sum, sale) => sum + sale.vgv, 0);
  const totalVGC = sales.reduce((sum, sale) => sum + sale.vgc, 0);
  
  // Calcular porcentagem do VGC em relação ao VGV
  const vgcPercentage = totalVGV > 0 ? (totalVGC / totalVGV) * 100 : 0;
  
  // Calcular mudança em relação ao mês anterior (mock - seria calculado com dados históricos)
  const monthlyChange = 2.3; // Mock value
  
  return (
    <Card className={`p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Porcentagem VGC
          </p>
          <p className="text-3xl font-bold text-success mb-2">
            {formatPercentage(vgcPercentage)}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-success font-medium">
              +{formatPercentage(monthlyChange)}
            </span>
            <span className="text-muted-foreground">vs mês anterior</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>VGC Total: {formatCurrency(totalVGC)}</p>
          </div>
        </div>
        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-success" />
        </div>
      </div>
    </Card>
  );
};

export default VGCPercentageCard;