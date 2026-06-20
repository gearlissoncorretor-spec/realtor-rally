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
        
        if (jsonData.length > 0) {
          setPreviewData(jsonData.slice(0, 5) as ExcelRow[]);
        }
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
    const nameLower = name.toLowerCase().trim();
    return brokers.find(broker => 
      broker.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(broker.name.toLowerCase())
    );
  };

  const formatDateToISO = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString().split('T')[0];
    
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    if (typeof dateValue === 'number') {
      const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
      return excelDate.toISOString().split('T')[0];
    }
    
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;

    // Brazilian format: "R$ 1.234.567,89" -> 1234567.89
    let str = String(value).replace(/[^\d,.-]/g, '');
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const VALID_ORIGEM = ['Marketplace','Tráfego Pago (Patrocinado)','Ação de Rua','Lista Imobiliária','Lista Pessoal','Anúncio Geral','Indicação','Outro'];
  const mapOrigem = (value: any): string => {
    if (!value) return 'Outro';
    const v = String(value).trim();
    const match = VALID_ORIGEM.find(o => o.toLowerCase() === v.toLowerCase());
    if (match) return match;
    const low = v.toLowerCase();
    if (low.includes('market')) return 'Marketplace';
    if (low.includes('tráfego') || low.includes('trafego') || low.includes('pago') || low.includes('ads')) return 'Tráfego Pago (Patrocinado)';
    if (low.includes('rua')) return 'Ação de Rua';
    if (low.includes('imobili')) return 'Lista Imobiliária';
    if (low.includes('pessoal')) return 'Lista Pessoal';
    if (low.includes('anúncio') || low.includes('anuncio')) return 'Anúncio Geral';
    if (low.includes('indica')) return 'Indicação';
    return 'Outro';
  };

  const formatOptionalDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
    if (typeof dateValue === 'number') {
      const d = new Date((dateValue - 25569) * 86400 * 1000);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }
    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  };

  const mapPropertyType = (tipo: any): 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'rural' => {
    if (!tipo) return 'apartamento';
    const tipoLower = String(tipo).toLowerCase();
    if (tipoLower.includes('apartamento') || tipoLower.includes('apt')) return 'apartamento';
    if (tipoLower.includes('casa')) return 'casa';
    if (tipoLower.includes('terreno') || tipoLower.includes('lote')) return 'terreno';
    if (tipoLower.includes('comercial')) return 'comercial';
    if (tipoLower.includes('rural') || tipoLower.includes('fazenda')) return 'rural';
    return 'apartamento';
  };

  const mapStatus = (status: any): 'pendente' | 'confirmada' | 'cancelada' | 'distrato' => {
    if (!status) return 'pendente';
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('fechado') || statusLower.includes('confirmada') || statusLower.includes('concluída')) return 'confirmada';
    if (statusLower.includes('cancelada') || statusLower.includes('cancelado')) return 'cancelada';
    if (statusLower.includes('distrato')) return 'distrato';
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
            
            // Tenta pegar o nome do cliente de forma mais inteligente
            let clientName = getVal(['CLIENTE', 'cliente', 'NOME', 'Nome', 'COMPRADOR', 'Comprador']);
            if (!clientName) {
               clientName = produtoParts.length > 3 ? produtoParts.slice(-2).join(' ') : `Cliente ${getVal(['GID', 'gid', 'ID']) || index + 1}`;
            }
            
            const vgv = parseNumericValue(getVal(['VGV', 'vgv', 'VALOR', 'Valor', 'PREÇO', 'Preço']));
            const vgc = parseNumericValue(getVal(['VGC', 'vgc', 'COMISSÃO', 'Comissão', 'COMISSAO', 'Comissao']));

            const saleData: any = {
              tipo: 'venda',
              client_name: String(clientName),
              client_phone: null,
              client_email: null,
              property_address: produtoStr || `Imóvel ${getVal(['GID', 'gid']) || index + 1}`,
              property_type: mapPropertyType(getVal(['TIPO', 'tipo', 'ESTILO', 'estilo', 'Estilo'])),
              property_value: vgv,
              vgv: vgv,
              vgc: vgc,
              commission_value: vgc > 0 ? vgc : null,
              broker_id: broker?.id || null,
              sale_date: formatDateToISO(getVal(['DATA COMPETÊNCIA', 'data_competencia', 'DATA COMPETENCIA', 'DATA', 'Data', 'DATA_COMPETENCIA'])),
              contract_date: formatOptionalDate(getVal(['DATA VENCIMENTO', 'data_vencimento', 'VENCIMENTO', 'Vencimento', 'DATA_VENCIMENTO'])),
              status: mapStatus(getVal(['STATUS', 'status', 'SITUAÇÃO', 'Situacao'])),
              notes: `GID: ${getVal(['GID', 'gid']) || ''} | Importado via planilha`,
              origem: mapOrigem(getVal(['ORIGEM', 'origem', 'Origem', 'FONTE'])),
              estilo: String(getVal(['ESTILO', 'estilo', 'Estilo']) || ''),
              produto: produtoStr,
              vendedor: String(vendedorName),
              captador: String(getVal(['CAPTADOR', 'captador', 'Captador']) || ''),
              gerente: String(getVal(['GERENTE', 'gerente', 'Gerente']) || ''),
              pagos: parseNumericValue(getVal(['PAGOS', 'pagos', 'Pagos'])),
              ano: Number(getVal(['ANO', 'ano', 'Ano']) || new Date().getFullYear()),
              mes: Number(getVal(['MÊS', 'MES', 'mes', 'Mês']) || new Date().getMonth() + 1),
              sale_type: 'revenda' as const,
              visibilidade: 'venda'
            };

            if (!saleData.property_address || (saleData.vgv <= 0 && saleData.vgc <= 0)) {
              errors.push(`Linha ${index + 2}: Dados insuficientes (endereço ou valores zerados)`);
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

        const message = `${successCount} vendas importadas com sucesso.${errorCount > 0 ? ` ${errorCount} erros encontrados.` : ''}`;
        
        toast({
          title: "Importação concluída",
          description: message,
          variant: successCount > 0 ? "default" : "destructive",
        });

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
              Aceita arquivos .xlsx e .xls. Formato flexível: Identifica colunas como VGV, Valor, VGC, Comissão, Corretor, etc.
            </p>
          </div>

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

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Mapeamento inteligente
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Reconhecimento:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Valores com prefixos (R$, $) e separadores (virgula/ponto)</li>
                  <li>• Datas em diversos formatos</li>
                  <li>• Nomes de colunas alternativos</li>
                </ul>
              </div>
              <div>
                <strong>Associação:</strong>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• Corretores buscados pelo nome</li>
                  <li>• Status e Tipos de imóvel aproximados</li>
                  <li>• Cliente extraído da descrição se faltar coluna</li>
                </ul>
              </div>
            </div>
          </div>

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
