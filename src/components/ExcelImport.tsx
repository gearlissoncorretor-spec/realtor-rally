import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    // If it's a string, remove currency symbols and non-numeric characters except for , and .
    const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const mapPropertyType = (tipo: string): 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural' => {

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
            // Helper to get value from row with multiple possible keys
            const getVal = (keys: string[]) => {
              for (const key of keys) {
                if (row[key] !== undefined) return row[key];
              }
              return null;
            };

            const vendedorName = getVal(['VENDEDOR', 'vendedor', 'Vendedor', 'CORRETOR', 'Corretor']) || '';
            const broker = findBrokerByName(String(vendedorName));
            
            const produto = getVal(['PRODUTO', 'produto', 'Produto', 'IMOVEL', 'Imóvel', 'Imovel', 'DESCRIÇÃO']) || '';
            const produtoStr = String(produto);
            const produtoParts = produtoStr.split(' ');
            const clientName = produtoParts.length > 3 ? produtoParts.slice(-2).join(' ') : `Cliente ${getVal(['GID', 'gid', 'ID']) || index + 1}`;
            
            const vgv = Number(getVal(['VGV', 'vgv', 'VALOR', 'Valor', 'PREÇO', 'Preço']) || 0);
            const vgc = Number(getVal(['VGC', 'vgc', 'COMISSÃO', 'Comissão', 'COMISSAO', 'Comissao']) || 0);

            const saleData = {
              client_name: clientName,
              client_phone: null,
              client_email: null,
              property_address: produtoStr || `Imóvel ${getVal(['GID', 'gid']) || index + 1}`,
              property_type: mapPropertyType(String(getVal(['TIPO', 'tipo', 'ESTILO', 'estilo', 'Estilo']) || '')),
              property_value: vgv,
              vgv: vgv,
              vgc: vgc,
              commission_value: vgc * 0.1, // assuming 10%
              broker_id: broker?.id || null,
              sale_date: formatDateToISO(getVal(['DATA COMPETÊNCIA', 'data_competencia', 'DATA COMPETENCIA', 'DATA', 'Data', 'DATA_COMPETENCIA'])),
              contract_date: formatDateToISO(getVal(['DATA VENCIMENTO', 'data_vencimento', 'DATA VENCIMENTO', 'VENCIMENTO', 'Vencimento', 'DATA_VENCIMENTO'])),
              status: mapStatus(String(getVal(['STATUS', 'status', 'SITUAÇÃO', 'Situacao']) || '')),
              notes: `GID: ${getVal(['GID', 'gid']) || ''} | Importado automaticamente`,
              origem: String(getVal(['ORIGEM', 'origem', 'Origem', 'FONTE']) || 'Importado'),
              estilo: String(getVal(['ESTILO', 'estilo', 'Estilo']) || ''),
              produto: produtoStr,
              vendedor: String(vendedorName),
              captador: String(getVal(['CAPTADOR', 'captador', 'Captador']) || ''),
              gerente: String(getVal(['GERENTE', 'gerente', 'Gerente']) || ''),
              pagos: Number(getVal(['PAGOS', 'pagos', 'Pagos']) || 0),
              ano: Number(getVal(['ANO', 'ano', 'Ano']) || new Date().getFullYear()),
              mes: Number(getVal(['MÊS', 'MES', 'mes', 'Mês']) || new Date().getMonth() + 1),
              latitude: String(getVal(['LATITUDE', 'latitude', 'Latitude']) || ''),
              sale_type: 'revenda' as const // Default to revenda for imported data usually
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Vendas do Excel
          </DialogTitle>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;