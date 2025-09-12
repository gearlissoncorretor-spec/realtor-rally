import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  onDataImported: (data: any[], type: 'sales' | 'brokers') => Promise<void>;
}

interface ImportProgress {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'success' | 'error';
}

const ExcelImport = ({ onDataImported }: ExcelImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [importType, setImportType] = useState<'sales' | 'brokers'>('sales');
  const [progress, setProgress] = useState<ImportProgress>({ current: 0, total: 0, status: 'idle' });
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({});
  const [showMapping, setShowMapping] = useState(false);

  const salesColumns = [
    { key: 'client_name', label: 'Nome do Cliente', required: true },
    { key: 'property_address', label: 'Endereço do Imóvel', required: true },
    { key: 'property_value', label: 'Valor do Imóvel', required: true },
    { key: 'property_type', label: 'Tipo do Imóvel', required: true },
    { key: 'sale_date', label: 'Data da Venda', required: false },
    { key: 'client_email', label: 'Email do Cliente', required: false },
    { key: 'client_phone', label: 'Telefone do Cliente', required: false },
    { key: 'vgv', label: 'VGV', required: true },
    { key: 'vgc', label: 'VGC', required: true },
  ];

  const brokersColumns = [
    { key: 'name', label: 'Nome', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Telefone', required: false },
    { key: 'creci', label: 'CRECI', required: false },
    { key: 'commission_rate', label: 'Taxa de Comissão (%)', required: false },
    { key: 'meta_monthly', label: 'Meta Mensal', required: false },
  ];

  const currentColumns = importType === 'sales' ? salesColumns : brokersColumns;

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        setParsedData(json);
        setShowMapping(true);
        setProgress({ current: 0, total: json.length, status: 'idle' });

        toast({
          title: "Arquivo carregado",
          description: `${json.length} registros encontrados. Configure o mapeamento das colunas.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível processar o arquivo. Verifique o formato.",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    // Validate required fields are mapped
    const requiredColumns = currentColumns.filter(col => col.required);
    const missingMappings = requiredColumns.filter(col => !columnMapping[col.key]);

    if (missingMappings.length > 0) {
      toast({
        title: "Mapeamento incompleto",
        description: `Configure o mapeamento para: ${missingMappings.map(col => col.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setProgress({ current: 0, total: parsedData.length, status: 'processing' });

    try {
      // Transform data according to mapping
      const transformedData = parsedData.map((row: any) => {
        const transformed: any = {};
        
        Object.entries(columnMapping).forEach(([key, excelColumn]) => {
          if (excelColumn && row[excelColumn] !== undefined) {
            let value = row[excelColumn];
            
            // Type conversions
            if (key === 'property_value' || key === 'vgv' || key === 'vgc' || key === 'commission_rate' || key === 'meta_monthly') {
              value = Number(value) || 0;
            }
            
            if (key === 'sale_date' && value) {
              // Try to parse date
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0];
              }
            }
            
            if (key === 'property_type' && value) {
              value = value.toLowerCase();
            }
            
            transformed[key] = value;
          }
        });

        // Set default values for sales
        if (importType === 'sales') {
          transformed.status = 'pendente';
          transformed.ano = new Date().getFullYear();
          transformed.mes = new Date().getMonth() + 1;
        }

        // Set default values for brokers
        if (importType === 'brokers') {
          transformed.status = 'ativo';
          transformed.commission_rate = transformed.commission_rate || 5;
          transformed.meta_monthly = transformed.meta_monthly || 0;
        }

        return transformed;
      });

      // Import data in batches
      const batchSize = 10;
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        await onDataImported(batch, importType);
        setProgress(prev => ({ ...prev, current: i + batch.length }));
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProgress(prev => ({ ...prev, status: 'success' }));
      
      toast({
        title: "Importação concluída",
        description: `${transformedData.length} registros importados com sucesso.`,
      });

      // Reset state
      setTimeout(() => {
        setIsOpen(false);
        setParsedData([]);
        setColumnMapping({});
        setShowMapping(false);
        setProgress({ current: 0, total: 0, status: 'idle' });
      }, 2000);

    } catch (error) {
      setProgress(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação dos dados.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const templateData = currentColumns.reduce((acc, col) => {
      acc[col.label] = col.key === 'property_value' || col.key === 'vgv' || col.key === 'vgc' ? 100000 : 
                      col.key === 'sale_date' ? '2024-01-15' :
                      col.key === 'property_type' ? 'apartamento' :
                      col.key === 'commission_rate' ? 5 :
                      col.key === 'meta_monthly' ? 50000 :
                      `Exemplo ${col.label}`;
      return acc;
    }, {} as any);

    const ws = XLSX.utils.json_to_sheet([templateData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, `modelo_${importType}.xlsx`);

    toast({
      title: "Template baixado",
      description: "Use este arquivo como modelo para importação.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Dados do Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Dados</label>
            <Select value={importType} onValueChange={(value: 'sales' | 'brokers') => setImportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="brokers">Corretores</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Baixar Modelo</h4>
                <p className="text-sm text-muted-foreground">
                  Use este modelo para organizar seus dados
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>

          {/* File Selection */}
          <div className="space-y-4">
            <Button onClick={handleFileSelect} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Column Mapping */}
          {showMapping && (
            <Card className="p-4 space-y-4">
              <h4 className="font-medium">Mapeamento de Colunas</h4>
              <p className="text-sm text-muted-foreground">
                Configure qual coluna do Excel corresponde a cada campo do sistema
              </p>
              
              <div className="grid gap-3">
                {currentColumns.map((column) => (
                  <div key={column.key} className="flex items-center gap-3">
                    <label className="text-sm min-w-[120px]">
                      {column.label}
                      {column.required && <span className="text-destructive">*</span>}
                    </label>
                    <Select
                      value={columnMapping[column.key] || ''}
                      onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [column.key]: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData.length > 0 && Object.keys(parsedData[0]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Progress */}
          {progress.status === 'processing' && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Importando dados...</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
              <p className="text-sm text-muted-foreground">
                {progress.current} de {progress.total} registros processados
              </p>
            </Card>
          )}

          {/* Success/Error Status */}
          {progress.status === 'success' && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Importação concluída com sucesso!</span>
              </div>
            </Card>
          )}

          {progress.status === 'error' && (
            <Card className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Erro durante a importação</span>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!showMapping || progress.status === 'processing'}
              className="flex-1"
            >
              {progress.status === 'processing' ? 'Importando...' : 'Importar Dados'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;