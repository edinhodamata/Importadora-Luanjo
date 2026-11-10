import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { InvoiceItem, NFStatusGroup } from '../types/reconciliation';

interface ImportSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newInvoices: InvoiceItem[]) => void;
}

export const ImportSpreadsheetModal: React.FC<ImportSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [sheetType, setSheetType] = useState<'fretes' | 'erp' | 'sefaz'>('fretes');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setErrorMsg('A planilha selecionada está vazia ou ilegível.');
          setIsProcessing(false);
          return;
        }

        setParsedRows(json);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Erro ao ler planilha:', err);
        setErrorMsg('Erro ao ler o arquivo. Certifique-se de que é um arquivo válido (.xlsx ou .csv).');
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleApplyImport = () => {
    if (parsedRows.length === 0) return;

    const importedInvoices: InvoiceItem[] = parsedRows.map((row, idx) => {
      // Intelligent key finding
      const numNF =
        row['Número da Nota Fiscal'] ||
        row['Numero_NF'] ||
        row['N° NF'] ||
        row['NF'] ||
        row['Nota'] ||
        row['Numero'] ||
        `IMP-${idx + 1}`;

      const emitente =
        row['Fornecedor / Remetente'] ||
        row['Fornecedor'] ||
        row['Remetente'] ||
        row['Razão Social'] ||
        row['Emitente'] ||
        'Fornecedor Importado';

      const valorRaw = row['Valor da Nota (R$)'] || row['Valor'] || row['Valor_Reais'] || row['Total'] || 0;
      const valor = typeof valorRaw === 'number' ? valorRaw : parseFloat(String(valorRaw).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      const transportadora = row['Transportadora'] || row['Transp'] || 'Não Informada';
      const ufOrigem = row['UF Origem'] || row['UF'] || 'SP';
      const emissao = row['Data Emissão'] || row['Emissão'] || row['Emissao'] || new Date().toLocaleDateString('pt-BR');
      const previsao = row['Previsão / Agendamento'] || row['Previsão Entrega'] || row['Previsao'] || 'Em Trânsito';

      let defaultGroup: NFStatusGroup = 'em_transito';
      if (sheetType === 'erp') defaultGroup = 'lancada_conferida';
      if (sheetType === 'fretes' && previsao !== 'Em Trânsito') defaultGroup = 'em_transito_agendada';

      return {
        id: `import-${Date.now()}-${idx}`,
        numeroNF: String(numNF),
        emitente: String(emitente),
        ufOrigem: String(ufOrigem),
        ufDestino: 'AM',
        transportadora: String(transportadora),
        dataEmissao: String(emissao),
        previsaoEntrega: String(previsao),
        valor: isNaN(valor) ? 0 : valor,
        statusGroup: defaultGroup,
        statusSefaz: 'AUTORIZADA',
        observacoes: `Importado de planilha externa (${sheetType.toUpperCase()}) em ${new Date().toLocaleDateString('pt-BR')}`,
      };
    });

    onImportSuccess(importedInvoices);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Importar Planilha para Conciliação
              </h3>
              <p className="text-xs text-slate-500">
                Carregue arquivos .xlsx ou .csv de Fretes, ERP ou SEFAZ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Select Sheet Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Planilha Carregada:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSheetType('fretes')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-center ${
                  sheetType === 'fretes'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                Controle de Fretes
              </button>
              <button
                type="button"
                onClick={() => setSheetType('erp')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-center ${
                  sheetType === 'erp'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                Relatório ERP
              </button>
              <button
                type="button"
                onClick={() => setSheetType('sefaz')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-center ${
                  sheetType === 'sefaz'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                SEFAZ Destinadas
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-6 text-center bg-slate-50/50">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
              id="spreadsheet-upload-input"
            />
            <label
              htmlFor="spreadsheet-upload-input"
              className="flex flex-col items-center justify-center cursor-pointer space-y-2"
            >
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
              <div>
                <span className="font-semibold text-slate-900 hover:underline">
                  Clique para selecionar
                </span>{' '}
                <span className="text-slate-500">ou arraste o arquivo aqui</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Formatos suportados: Excel (.xlsx, .xls) ou Texto delimitado (.csv)
              </p>
            </label>
          </div>

          {fileName && (
            <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between text-xs">
              <span className="font-mono text-slate-800 truncate">{fileName}</span>
              <span className="font-semibold text-emerald-700 shrink-0">
                {parsedRows.length} linhas detectadas
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleApplyImport}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Conciliar {parsedRows.length} Notas
          </button>
        </div>
      </div>
    </div>
  );
};
