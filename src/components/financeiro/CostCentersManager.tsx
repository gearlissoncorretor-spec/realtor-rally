import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { useCostCenters, CostCenter } from "@/hooks/useCostCenters";
import { Switch } from "@/components/ui/switch";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

export const CostCentersManager = ({ open, onOpenChange }: Props) => {
  const { costCenters, loading, createCostCenter, updateCostCenter, deleteCostCenter } = useCostCenters();
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: PALETTE[0], active: true });
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setForm({ name: "", description: "", color: PALETTE[0], active: true });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (cc: CostCenter) => {
    setEditing(cc);
    setForm({ name: cc.name, description: cc.description || "", color: cc.color || PALETTE[0], active: cc.active });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCostCenter({ id: editing.id, ...form });
      } else {
        await createCostCenter(form);
      }
      reset();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este centro de custo? Lançamentos vinculados ficarão sem centro.")) {
      await deleteCostCenter(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FolderTree className="w-5 h-5" /> Centros de Custo</DialogTitle>
          <DialogDescription>Organize os lançamentos financeiros por área, projeto ou equipe.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2" size="sm">
              <Plus className="w-4 h-4" /> Novo Centro
            </Button>
          )}

          {showForm && (
            <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Marketing Digital" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: form.color === c ? "hsl(var(--foreground))" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Ativo</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={reset} size="sm">Cancelar</Button>
                <Button onClick={save} disabled={saving || !form.name.trim()} size="sm">
                  {editing ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : costCenters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum centro de custo cadastrado.</p>
            ) : (
              costCenters.map(cc => (
                <div key={cc.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cc.color || "#64748b" }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{cc.name}</p>
                        {!cc.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                      </div>
                      {cc.description && <p className="text-xs text-muted-foreground truncate">{cc.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(cc)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(cc.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
