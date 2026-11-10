import React from 'react';
import { Calendar, AlertCircle, ArrowUpRight, Clock, MapPin, Truck } from 'lucide-react';
import { InvoiceItem } from '../types/reconciliation';
import { formatCurrency } from '../utils/formatters';

interface DeliveryRadarProps {
  invoices: InvoiceItem[];
  onSelectInvoice: (invoice: InvoiceItem) => void;
  onFilterScheduled: () => void;
}

export const DeliveryRadar: React.FC<DeliveryRadarProps> = ({
  invoices,
  onSelectInvoice,
  onFilterScheduled,
}) => {
  // Extract scheduled shipments
  const scheduled = invoices
    .filter((inv) => inv.statusGroup === 'em_transito_agendada')
    .sort((a, b) => {
      // sort by delivery date
      return (a.previsaoEntrega || '').localeCompare(b.previsaoEntrega || '');
    });

  const totalScheduledValue = scheduled.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Radar de Entregas &amp; Agendamentos Confirmados (Manaus)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Notas fiscais em trânsito com datas e janelas de descarga estipuladas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Total Agendado</div>
            <div className="font-mono tabular-nums font-bold text-sm text-slate-900">
              {formatCurrency(totalScheduledValue)}
            </div>
          </div>
          <button
            onClick={onFilterScheduled}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Ver Todas na Planilha</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical Highlight Alert: Akzo Nobel Cabotagem */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0 mt-0.5 md:mt-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-900">
              Aporte Crítico de Cabotagem Marítima: Akzo Nobel (Mercosul Line)
            </div>
            <div className="text-xs text-blue-700 mt-0.5">
              3 notas fiscais (NFs 469714, 469715 e 469689) totalizando{' '}
              <strong className="font-mono tabular-nums">R$ 937.059,65</strong> com atracação prevista para os dias 23/11 e 26/11.
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-md shrink-0">
          Cabotagem Marítima
        </span>
      </div>

      {/* Scheduled Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
              <th className="py-2.5 px-3">Previsão / Status</th>
              <th className="py-2.5 px-3">N° NF</th>
              <th className="py-2.5 px-3">Fornecedor / Remetente</th>
              <th className="py-2.5 px-3">UF</th>
              <th className="py-2.5 px-3">Transportadora</th>
              <th className="py-2.5 px-3 text-right">Valor da Nota</th>
              <th className="py-2.5 px-3">Situação ERP</th>
              <th className="py-2.5 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scheduled.map((inv) => {
              const isToday = inv.previsaoEntrega?.includes('10/11/2026');
              const isTomorrow = inv.previsaoEntrega?.includes('11/11/2026');
              const isDelayed = inv.previsaoEntrega?.includes('09/11/2026');

              return (
                <tr
                  key={inv.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isDelayed ? 'bg-rose-50/40' : isToday ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {isDelayed ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        09/11 (Atrasado)
                      </span>
                    ) : isToday ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                        <Clock className="w-3.5 h-3.5" />
                        10/11 (Hoje)
                      </span>
                    ) : isTomorrow ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
                        11/11 (Amanhã)
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums text-slate-700">
                        {inv.previsaoEntrega}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                    {inv.numeroNF}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[220px] truncate">
                    {inv.emitente}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {inv.ufOrigem}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {inv.transportadora}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right text-slate-900 whitespace-nowrap">
                    {formatCurrency(inv.valor)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      Não Lançada
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                    >
                      Inspecionar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
