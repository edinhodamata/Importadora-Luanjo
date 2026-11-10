import React from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { InvoiceItem } from '../types/reconciliation';
import { formatCurrency } from '../utils/formatters';

interface FreightDivergenceNoticeProps {
  invoices: InvoiceItem[];
  onClearFreight: (invoiceId: string) => void;
  onSelectInvoice: (invoice: InvoiceItem) => void;
}

export const FreightDivergenceNotice: React.FC<FreightDivergenceNoticeProps> = ({
  invoices,
  onClearFreight,
  onSelectInvoice,
}) => {
  const divergences = invoices.filter((inv) => inv.statusGroup === 'divergencia_frete');

  if (divergences.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs text-emerald-900">
          <strong>Planilha de Fretes Saneada:</strong> Todas as notas lançadas no ERP já foram devidamente baixadas do controle logístico de fretes em trânsito.
        </div>
      </div>
    );
  }

  const totalValue = divergences.reduce((sum, i) => sum + i.valor, 0);

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <h3 className="text-sm font-bold text-amber-950">
            Ação Imediata de Saneamento: Constam no Frete, mas JÁ foram Lançadas no ERP
          </h3>
        </div>
        <div className="text-xs text-amber-900 font-medium">
          {divergences.length} notas divergentes ·{' '}
          <span className="font-mono tabular-nums font-bold">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      <p className="text-xs text-amber-900/90 leading-relaxed">
        Estas mercadorias já foram <strong>recebidas fisicamente no armazém e escrituradas no sistema ERP pelo conferente Edinho</strong> em outubro. No entanto, continuam constando como "Em Trânsito" no controle de fretes. É essencial <strong>dar baixa na planilha de frete</strong> para evitar cobrança indevida de frete e duplicidade de conferência.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {divergences.map((inv) => (
          <div
            key={inv.id}
            className="bg-white border border-amber-200 rounded-lg p-3.5 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                  NF {inv.numeroNF}
                </span>
                <span className="text-[11px] font-mono tabular-nums font-semibold text-amber-900">
                  {formatCurrency(inv.valor)}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 truncate">
                {inv.emitente}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                <div>Transportadora: <strong className="text-slate-700">{inv.transportadora}</strong></div>
                <div>Entrada ERP: <strong className="text-emerald-700">{inv.dataLancamentoERP}</strong> ({inv.conferente})</div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectInvoice(inv)}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Auditar
              </button>
              <button
                onClick={() => onClearFreight(inv.id)}
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>Dar Baixa no Frete</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
