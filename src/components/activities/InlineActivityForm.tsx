import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Check, X, Building2, Users, Phone, MapPin, ListTodo, Loader2 } from "lucide-react";

interface InlineActivityFormProps {
  onCreate: (data: {
    task_name: string;
    category: string;
    meta_semanal: number;
    period_type: 'daily' | 'weekly' | 'monthly';
  }) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: 'captacao', label: 'Captação', icon: <Building2 className="w-4 h-4" /> },
  { value: 'atendimento', label: 'Atendimento', icon: <Users className="w-4 h-4" /> },
  { value: 'ligacao', label: 'Ligações', icon: <Phone className="w-4 h-4" /> },
  { value: 'visita', label: 'Visitas', icon: <MapPin className="w-4 h-4" /> },
  { value: 'outro', label: 'Outro', icon: <ListTodo className="w-4 h-4" /> },
];

export const InlineActivityForm: React.FC<InlineActivityFormProps> = ({ onCreate, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    task_name: '',
    category: 'outro',
    meta_semanal: 10,
    period_type: 'weekly' as 'daily' | 'weekly' | 'monthly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_name.trim()) return;

    setLoading(true);
    try {
      await onCreate(formData);
      onCancel();
    } catch (error) {
      console.error('Error creating activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : <ListTodo className="w-4 h-4" />;
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 border-emerald-500 shadow-xl animate-in zoom-in-95 duration-200">
      <CardContent className="p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0 text-emerald-600">
              {getIcon(formData.category)}
            </div>
            <Input
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              placeholder="Nome da atividade..."
              className="h-8 text-sm font-medium border-emerald-200 focus:ring-emerald-500 bg-white/50"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Categoria</p>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-8 text-xs bg-white/50 border-emerald-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-xs">
                      <div className="flex items-center gap-2">
                        {cat.icon}
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Meta</p>
              <Input
                type="number"
                min="1"
                value={formData.meta_semanal}
                onChange={(e) => setFormData({ ...formData, meta_semanal: parseInt(e.target.value) || 1 })}
                className="h-8 text-xs bg-white/50 border-emerald-100"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-emerald-100/50">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-1" />
              <span className="text-xs">Cancelar</span>
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="h-8 px-2 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={loading || !formData.task_name.trim()}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  <span className="text-xs">Salvar</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
