import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Truck, MapPin, DollarSign, Layers } from 'lucide-react';
import { InvoiceItem, ReconciliationKPIs } from '../types/reconciliation';
import { formatCurrency, formatNumber, getStatusLabel } from '../utils/formatters';

interface ChartsViewProps {
  invoices: InvoiceItem[];
  kpis: ReconciliationKPIs;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ invoices, kpis }) => {
  // 1. Volume by Carrier
  const carrierVolumes = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    invoices.forEach((inv) => {
      const carrier = inv.transportadora || 'NÃO INFORMADA';
      const current = map.get(carrier) || { count: 0, total: 0 };
      map.set(carrier, { count: current.count + 1, total: current.total + inv.valor });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8
  }, [invoices]);

  const maxCarrierTotal = carrierVolumes[0]?.total || 1;

  // 2. Volume by Origin State (UF)
  const ufVolumes = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    invoices.forEach((inv) => {
      const uf = inv.ufOrigem || 'OUTROS';
      const current = map.get(uf) || { count: 0, total: 0 };
      map.set(uf, { count: current.count + 1, total: current.total + inv.valor });
    });

    return Array.from(map.entries())
      .map(([uf, data]) => ({ uf, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [invoices]);

  const maxUfTotal = ufVolumes[0]?.total || 1;

  // 3. Top Suppliers in Transit
  const topInTransitSuppliers = useMemo(() => {
    const inTransit = invoices.filter(
      (i) => i.statusGroup === 'em_transito_agendada' || i.statusGroup === 'em_transito'
    );
    const map = new Map<string, { count: number; total: number; carrier: string }>();

    inTransit.forEach((inv) => {
      const current = map.get(inv.emitente) || { count: 0, total: 0, carrier: inv.transportadora };
      map.set(inv.emitente, {
        count: current.count + 1,
        total: current.total + inv.valor,
        carrier: inv.transportadora,
      });
    });

    return Array.from(map.entries())
      .map(([supplier, data]) => ({ supplier, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Faturado Auditado
            </span>
            <DollarSign className="w-4 h-4 text-slate-700" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-slate-900">
            {formatCurrency(kpis.totalValorGeral)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Distribuído entre {formatNumber(kpis.totalNotas)} notas fiscais
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Capital em Trânsito / Balsa
            </span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-blue-900">
            {formatCurrency(kpis.emTransitoAgendadasValor)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {kpis.emTransitoAgendadasQtd} cargas a caminho de Manaus
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Já Escriturado no Estoque
            </span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-emerald-900">
            {formatCurrency(kpis.lancadasConferidasValor + kpis.lancadasNaoConferidasValor)}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            {kpis.lancadasConferidasQtd + kpis.lancadasNaoConferidasQtd} NFs integradas no ERP
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Financial Volume by Carrier */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Volume Financeiro por Transportadora (Top 8)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição de valor por operador logístico e fluvial
              </p>
            </div>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {carrierVolumes.map((c) => {
              const percentage = Math.round((c.total / maxCarrierTotal) * 100);
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={c.name}>
                      {c.name}
                    </span>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">({c.count} NFs)</span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {formatCurrency(c.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Volume by Origin State (UF) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Origem das Cargas por Estado / UF (Top 8)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Montante financeiro de mercadorias por unidade federativa
              </p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {ufVolumes.map((u) => {
              const percentage = Math.round((u.total / maxUfTotal) * 100);
              return (
                <div key={u.uf} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{u.uf}</span>
                      <span className="text-slate-400 text-[11px]">({u.count} NFs)</span>
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {formatCurrency(u.total)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Suppliers in Transit Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Fornecedores com Maior Volume Financeiro em Trânsito para Manaus
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Concentração de capital pendente de desembaraço e recebimento
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topInTransitSuppliers.map((item, idx) => (
            <div
              key={item.supplier}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] text-slate-400 font-mono">
                  #{idx + 1} em Volume Pendente
                </div>
                <div className="font-bold text-xs text-slate-900 mt-1 truncate" title={item.supplier}>
                  {item.supplier}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Operador:{' '}
                  <strong className="text-slate-700">{item.carrier}</strong>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">{item.count} notas</span>
                <span className="font-mono tabular-nums font-bold text-sm text-slate-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
