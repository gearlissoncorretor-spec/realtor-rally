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

        for (const row of jsonData) {
          try {
            // Map common Excel column names to our database fields
            const broker = findBrokerByName(row.corretor || row.vendedor || row.broker || '');
            
            const saleData = {
              client_name: row.cliente || row.client_name || row.nome_cliente || '',
              client_phone: row.telefone || row.phone || row.cliente_telefone || '',
              client_email: row.email || row.client_email || row.cliente_email || '',
              property_address: row.endereco || row.address || row.imovel_endereco || row.property_address || '',
              property_type: (row.tipo_imovel || row.property_type || row.tipo || 'apartamento').toLowerCase(),
              property_value: Number(row.valor_imovel || row.property_value || row.valor || 0),
              vgv: Number(row.vgv || row.valor_imovel || row.property_value || 0),
              vgc: Number(row.vgc || row.comissao || row.commission || 0),
              commission_value: Number(row.comissao_corretor || row.broker_commission || 0),
              broker_id: broker?.id || null,
              sale_date: row.data_venda || row.sale_date || new Date().toISOString().split('T')[0],
              status: (row.status || 'pendente').toLowerCase(),
              notes: row.observacoes || row.notes || row.obs || '',
              origem: row.origem || row.origin || '',
              captador: row.captador || '',
              sale_type: row.tipo_venda || row.sale_type || 'lancamento'
            };

            await createSale(saleData);
            successCount++;
          } catch (error) {
            console.error('Erro ao processar linha:', row, error);
            errorCount++;
          }
        }

        toast({
          title: "Importação concluída",
          description: `${successCount} vendas importadas com sucesso. ${errorCount} erros encontrados.`,
          variant: successCount > 0 ? "default" : "destructive",
        });

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
              Aceita arquivos .xlsx e .xls. Colunas esperadas: cliente, telefone, email, endereco, tipo_imovel, valor_imovel, corretor, etc.
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
              Mapeamento de colunas
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Colunas reconhecidas:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• cliente, client_name, nome_cliente</li>
                  <li>• telefone, phone, cliente_telefone</li>
                  <li>• email, client_email, cliente_email</li>
                  <li>• endereco, address, property_address</li>
                </ul>
              </div>
              <div>
                <ul className="mt-6 space-y-1 text-muted-foreground">
                  <li>• tipo_imovel, property_type, tipo</li>
                  <li>• valor_imovel, property_value, valor</li>
                  <li>• corretor, vendedor, broker</li>
                  <li>• vgc, comissao, commission</li>
                </ul>
              </div>
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