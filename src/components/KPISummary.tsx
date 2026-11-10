import React from 'react';
import { CheckCircle2, Clock, Truck, AlertTriangle, FileX, ArrowRight } from 'lucide-react';
import { ReconciliationKPIs, NFStatusGroup } from '../types/reconciliation';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface KPISummaryProps {
  kpis: ReconciliationKPIs;
  activeFilter: NFStatusGroup | 'all' | 'agendadas_proximas';
  onSelectFilter: (filter: NFStatusGroup | 'all' | 'agendadas_proximas') => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  kpis,
  activeFilter,
  onSelectFilter,
}) => {
  const totalLancadas = kpis.lancadasConferidasQtd + kpis.lancadasNaoConferidasQtd;
  const totalLancadasValor = kpis.lancadasConferidasValor + kpis.lancadasNaoConferidasValor;

  return (
    <div className="space-y-4">
      {/* Top Banner Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Período Auditado:</span>
          <span>Julho a Novembro de 2026</span>
          <span aria-hidden="true">·</span>
          <span>Base Integrada: SEFAZ / ERP / Fretes em Trânsito</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Total Geral Auditado:</span>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {formatNumber(kpis.totalNotas)} notas
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {formatCurrency(kpis.totalValorGeral)}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Lançadas no ERP */}
        <button
          onClick={() => onSelectFilter('lancada_conferida')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
            activeFilter === 'lancada_conferida'
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Lançadas no ERP
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono tabular-nums text-xl font-bold text-slate-900 mb-1">
            {formatNumber(totalLancadas)} <span className="text-xs font-normal text-slate-500">NFs</span>
          </div>
          <div className="font-mono tabular-nums text-xs font-medium text-emerald-700 mb-2">
            {formatCurrency(totalLancadasValor)}
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            <span className="font-semibold text-slate-700">{kpis.lancadasConferidasQtd}</span> conferidas ·{' '}
            <span className="font-semibold text-slate-700">{kpis.lancadasNaoConferidasQtd}</span> aguardando conf.
          </div>
        </button>

        {/* 2. Em Trânsito & Agendadas */}
        <button
          onClick={() => onSelectFilter('em_transito_agendada')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
            activeFilter === 'em_transito_agendada'
              ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Em Trânsito / Previstas
            </span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono tabular-nums text-xl font-bold text-slate-900 mb-1">
            {formatNumber(kpis.emTransitoAgendadasQtd)} <span className="text-xs font-normal text-slate-500">NFs</span>
          </div>
          <div className="font-mono tabular-nums text-xs font-medium text-blue-700 mb-2">
            {formatCurrency(kpis.emTransitoAgendadasValor)}
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            <span className="font-semibold text-blue-900">11</span> com data confirmada ·{' '}
            <span>42</span> em rota fluvial/rodov.
          </div>
        </button>

        {/* 3. Divergência: Baixa no Frete */}
        <button
          onClick={() => onSelectFilter('divergencia_frete')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-amber-50/40 relative overflow-hidden group ${
            activeFilter === 'divergencia_frete'
              ? 'border-amber-600 ring-2 ring-amber-600/20 shadow-sm'
              : 'border-amber-200 hover:border-amber-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Divergência no Frete
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono tabular-nums text-xl font-bold text-amber-950 mb-1">
            {formatNumber(kpis.divergenciaFreteQtd)} <span className="text-xs font-normal text-amber-700">NFs</span>
          </div>
          <div className="font-mono tabular-nums text-xs font-medium text-amber-800 mb-2">
            {formatCurrency(kpis.divergenciaFreteValor)}
          </div>
          <div className="text-[11px] text-amber-800 leading-tight font-medium">
            Já lançadas no ERP! Dar baixa urgente na planilha de frete.
          </div>
        </button>

        {/* 4. SEFAZ Sem Frete Mapeado */}
        <button
          onClick={() => onSelectFilter('sefaz_sem_frete')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
            activeFilter === 'sefaz_sem_frete'
              ? 'border-orange-600 ring-2 ring-orange-600/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              SEFAZ Não Lançadas
            </span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="font-mono tabular-nums text-xl font-bold text-slate-900 mb-1">
            {formatNumber(kpis.sefazSemFreteQtd)} <span className="text-xs font-normal text-slate-500">NFs</span>
          </div>
          <div className="font-mono tabular-nums text-xs font-medium text-orange-700 mb-2">
            {formatCurrency(kpis.sefazSemFreteValor)}
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            Sem registro na planilha de fretes (locais Manaus + interesse).
          </div>
        </button>

        {/* 5. Canceladas na SEFAZ */}
        <button
          onClick={() => onSelectFilter('cancelada_sefaz')}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
            activeFilter === 'cancelada_sefaz'
              ? 'border-rose-600 ring-2 ring-rose-600/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Canceladas SEFAZ
            </span>
            <FileX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono tabular-nums text-xl font-bold text-slate-900 mb-1">
            {formatNumber(kpis.canceladasSefazQtd)} <span className="text-xs font-normal text-slate-500">NFs</span>
          </div>
          <div className="font-mono tabular-nums text-xs font-medium text-rose-700 mb-2">
            {formatCurrency(kpis.canceladasSefazValor)}
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            Bloquear no ERP para prevenir lançamentos indevidos.
          </div>
        </button>
      </div>
    </div>
  );
};
