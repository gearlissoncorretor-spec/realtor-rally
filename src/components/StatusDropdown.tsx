import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: 'pendente' | 'confirmada' | 'cancelada') => void;
}

const StatusDropdown = ({ currentStatus, onStatusChange }: StatusDropdownProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-success text-success-foreground";
      case "pendente":
        return "bg-warning text-warning-foreground";
      case "cancelada":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmada":
        return "Confirmada";
      case "pendente":
        return "Pendente";
      case "cancelada":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <Select value={currentStatus} onValueChange={onStatusChange}>
      <SelectTrigger className="w-32 h-8 p-0 border-none bg-transparent">
        <Badge className={getStatusColor(currentStatus)}>
          {getStatusLabel(currentStatus)}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pendente">
          <Badge className="bg-warning text-warning-foreground">
            Pendente
          </Badge>
        </SelectItem>
        <SelectItem value="confirmada">
          <Badge className="bg-success text-success-foreground">
            Confirmada
          </Badge>
        </SelectItem>
        <SelectItem value="cancelada">
          <Badge className="bg-destructive text-destructive-foreground">
            Cancelada
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default StatusDropdown;