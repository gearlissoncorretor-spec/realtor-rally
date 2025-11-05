import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSales } from "@/hooks/useSales";
import { useBrokers } from "@/hooks/useBrokers";
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  onImportComplete?: () => void;
}

interface ExcelRow {
  [key: string]: any;
}

const ExcelImport = ({ onImportComplete }: ExcelImportProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createSale } = useSales();
  const { brokers } = useBrokers();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
      } catch (error) {
        toast({
          title: "Erro ao ler arquivo",
          description: "Formato de arquivo inválido. Use arquivos Excel (.xlsx, .xls).",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const findBrokerByName = (name: string) => {
    if (!name) return null;
    return brokers.find(broker => 
      broker.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(broker.name.toLowerCase())
    );
  };

  const formatDateToISO = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    // If it's already a string in the format YYYY-MM-DD, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's an Excel date number
    if (typeof dateValue === 'number') {
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }
    
    // Try to parse as regular date
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const mapPropertyType = (tipo: string): 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural' => {
    if (!tipo) return 'apartamento';
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('apartamento') || tipoLower.includes('apt')) return 'apartamento';
    if (tipoLower.includes('casa')) return 'casa';
    if (tipoLower.includes('terreno')) return 'terreno';
    if (tipoLower.includes('comercial')) return 'comercial';
    if (tipoLower.includes('rural')) return 'rural';
    return 'apartamento';
  };

  const mapStatus = (status: string): 'pendente' | 'confirmada' | 'cancelada' => {
    if (!status) return 'pendente';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('fechado') || statusLower.includes('confirmada')) return 'confirmada';
    if (statusLower.includes('cancelada') || statusLower.includes('cancelado')) return 'cancelada';
    return 'pendente';
  };

  const processExcelData = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const [index, row] of jsonData.entries()) {
          try {
            // Map broker based on VENDEDOR field
            const vendedorName = row.VENDEDOR || row.vendedor || row.VENDEDOR || '';
            const broker = findBrokerByName(vendedorName);
            
            // Extract client name from PRODUTO field (everything after the last space)
            const produto = row.PRODUTO || row.produto || '';
            const produtoParts = produto.split(' ');
            const clientName = produtoParts.length > 3 ? produtoParts.slice(-2).join(' ') : `Cliente ${row.GID || index + 1}`;
            
            const saleData = {
              client_name: clientName,
              client_phone: null,
              client_email: null,
              property_address: produto || `Imóvel ${row.GID || index + 1}`,
              property_type: mapPropertyType(row.TIPO || row.ESTILO || row.tipo || row.estilo),
              property_value: Number(row.VGV || 0),
              vgv: Number(row.VGV || 0),
              vgc: Number(row.VGC || 0),
              commission_value: Number(row.VGC || 0) * 0.1, // Assuming 10% commission
              broker_id: broker?.id || null,
              sale_date: formatDateToISO(row['DATA COMPETÊNCIA'] || row.data_competencia || row.DATA_COMPETENCIA),
              contract_date: formatDateToISO(row['DATA VENCIMENTO'] || row.data_vencimento || row.DATA_VENCIMENTO),
              status: mapStatus(row.STATUS || row.status || ''),
              notes: `GID: ${row.GID || ''} | Importado automaticamente`,
              origem: row.ORIGEM || row.origem || '',
              estilo: row.ESTILO || row.estilo || '',
              produto: produto,
              vendedor: row.VENDEDOR || row.vendedor || '',
              captador: row.CAPTADOR || row.captador || '',
              gerente: row.GERENTE || row.gerente || '',
              pagos: Number(row.PAGOS || row.pagos || 0),
              ano: Number(row.ANO || row.ano || new Date().getFullYear()),
              mes: Number(row.MÊS || row.MES || row.mes || new Date().getMonth() + 1),
              latitude: row.LATITUDE || row.latitude || '',
              sale_type: 'lancamento'
            };

            // Validation
            if (!saleData.property_address || saleData.property_value <= 0) {
              errors.push(`Linha ${index + 2}: Dados insuficientes (endereço ou valor inválido)`);
              errorCount++;
              continue;
            }

            await createSale(saleData);
            successCount++;
          } catch (error) {
            console.error('Erro ao processar linha:', row, error);
            errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            errorCount++;
          }
        }

        // Show detailed results
        const message = `${successCount} vendas importadas com sucesso.${errorCount > 0 ? ` ${errorCount} erros encontrados.` : ''}`;
        
        toast({
          title: "Importação concluída",
          description: message,
          variant: successCount > 0 ? "default" : "destructive",
        });

        // Log errors to console for debugging
        if (errors.length > 0) {
          console.log('Erros de importação:', errors);
        }

        setIsOpen(false);
        setSelectedFile(null);
        setPreviewData([]);
        onImportComplete?.();
      };
      
      reader.readAsBinaryString(selectedFile);
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Vendas do Excel
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Selecionar arquivo Excel</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            <p className="text-sm text-muted-foreground">
              Aceita arquivos .xlsx e .xls. Formato esperado: GID, DATA COMPETÊNCIA, DATA VENCIMENTO, ORIGEM, ESTILO, PRODUTO, VGV, VGC, TIPO, VENDEDOR, CAPTADOR, GERENTE, STATUS, PAGOS, ANO, MÊS, LATITUDE.
            </p>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Prévia dos dados (primeiras 5 linhas)</Label>
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-60 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="p-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t">
                          {Object.values(row).map((value, valueIndex) => (
                            <td key={valueIndex} className="p-2">
                              {String(value).slice(0, 50)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Mapping Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Mapeamento de colunas da planilha
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Colunas principais:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• GID - Identificador único</li>
                  <li>• DATA COMPETÊNCIA - Data da venda</li>
                  <li>• DATA VENCIMENTO - Data do contrato</li>
                  <li>• PRODUTO - Endereço do imóvel</li>
                  <li>• VGV - Valor do imóvel</li>
                  <li>• VGC - Valor da comissão</li>
                </ul>
              </div>
              <div>
                <strong>Informações adicionais:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• TIPO/ESTILO - Tipo do imóvel</li>
                  <li>• VENDEDOR - Nome do corretor</li>
                  <li>• STATUS - Status da venda</li>
                  <li>• ORIGEM - Origem da venda</li>
                  <li>• CAPTADOR/GERENTE - Equipe</li>
                  <li>• ANO/MÊS - Período da venda</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Importante:</strong> O sistema irá mapear automaticamente os corretores pelo campo VENDEDOR. 
                Vendas sem corretor correspondente serão importadas sem associação.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSelectedFile(null);
                setPreviewData([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={processExcelData}
              disabled={!selectedFile || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Importar Vendas
                </>
              )}
            </Button>
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;