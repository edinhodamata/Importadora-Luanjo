import React from 'react';
import { X, CheckCircle2, AlertTriangle, Truck, FileText, Calendar, Building, DollarSign } from 'lucide-react';
import { InvoiceItem, NFStatusGroup } from '../types/reconciliation';
import { formatCurrency, getStatusLabel } from '../utils/formatters';

interface InvoiceDetailModalProps {
  invoice: InvoiceItem | null;
  onClose: () => void;
  onUpdateStatus: (invoiceId: string, newStatus: NFStatusGroup) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onUpdateStatus,
}) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              NF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Nota Fiscal N° {invoice.numeroNF}
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Série {invoice.serie || '1'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Auditoria de Conciliação ERP, SEFAZ e Fretes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Key Value Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Valor Total da Nota
              </span>
              <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-0.5">
                {formatCurrency(invoice.valor)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Situação Fiscal SEFAZ
              </span>
              <div
                className={`font-semibold text-sm mt-0.5 ${
                  invoice.statusSefaz === 'CANCELADA'
                    ? 'text-rose-700'
                    : invoice.statusSefaz === 'SELADA'
                    ? 'text-sky-700'
                    : 'text-emerald-700'
                }`}
              >
                {invoice.statusSefaz}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emitente / Fornecedor */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Building className="w-3.5 h-3.5 text-slate-700" />
                <span>Dados do Emitente</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{invoice.emitente}</div>
              {invoice.cnpj && (
                <div className="font-mono tabular-nums text-slate-500">CNPJ: {invoice.cnpj}</div>
              )}
              <div className="text-slate-500">
                Origem: <strong className="text-slate-700">{invoice.ufOrigem}</strong> → Destino:{' '}
                <strong className="text-slate-700">{invoice.ufDestino}</strong>
              </div>
            </div>

            {/* Logística & Frete */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Truck className="w-3.5 h-3.5 text-slate-700" />
                <span>Logística &amp; Transporte</span>
              </div>
              <div>
                Transportadora: <strong className="text-slate-800">{invoice.transportadora}</strong>
              </div>
              <div>
                Data de Emissão:{' '}
                <strong className="font-mono tabular-nums text-slate-800">
                  {invoice.dataEmissao}
                </strong>
              </div>
              <div>
                Previsão de Entrega:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {invoice.previsaoEntrega || 'Não estipulada'}
                </strong>
              </div>
            </div>

            {/* ERP Status */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                <span>Integração ERP Interno</span>
              </div>
              <div>
                Data Entrada ERP:{' '}
                <strong className="font-mono tabular-nums text-slate-800">
                  {invoice.dataLancamentoERP || 'Pendente (Não Lançada)'}
                </strong>
              </div>
              {invoice.conferente && (
                <div>
                  Conferente:{' '}
                  <strong className="text-slate-800">{invoice.conferente}</strong>
                </div>
              )}
              {invoice.cfop && (
                <div>
                  CFOP Escriturado: <strong className="font-mono">{invoice.cfop}</strong>
                </div>
              )}
            </div>

            {/* Situação Atual */}
            <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                <span>Classificação Auditada</span>
              </div>
              <div className="font-semibold text-slate-900 text-xs">
                {getStatusLabel(invoice.statusGroup)}
              </div>
              <div className="text-[11px] text-slate-500">
                {invoice.prioridade && (
                  <span>
                    Prioridade de Tratativa:{' '}
                    <strong className="uppercase font-semibold">{invoice.prioridade}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Observações & Ação Recomendada */}
          <div className="space-y-3 pt-2">
            {invoice.observacoes && (
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-950 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Diagnóstico da Auditoria:</span>
                </div>
                <p className="leading-relaxed">{invoice.observacoes}</p>
              </div>
            )}

            {invoice.acaoRecomendada && (
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs space-y-1">
                <div className="font-bold">Ação Operacional Recomendada:</div>
                <p className="leading-relaxed">{invoice.acaoRecomendada}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {invoice.statusGroup !== 'lancada_conferida' &&
              invoice.statusGroup !== 'cancelada_sefaz' && (
                <button
                  onClick={() => {
                    onUpdateStatus(invoice.id, 'lancada_conferida');
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                  Marcar como Lançada &amp; Conferida no ERP
                </button>
              )}

            {invoice.statusGroup === 'divergencia_frete' && (
              <button
                onClick={() => {
                  onUpdateStatus(invoice.id, 'lancada_conferida');
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer"
              >
                Dar Baixa na Planilha de Frete
              </button>
            )}

            {invoice.statusGroup !== 'lancada_pendente' &&
              invoice.statusGroup !== 'cancelada_sefaz' && (
                <button
                  onClick={() => {
                    onUpdateStatus(invoice.id, 'lancada_pendente');
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Mover p/ Aguardando Conferência
                </button>
              )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
