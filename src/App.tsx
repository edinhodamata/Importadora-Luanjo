/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { KPISummary } from './components/KPISummary';
import { DeliveryRadar } from './components/DeliveryRadar';
import { FreightDivergenceNotice } from './components/FreightDivergenceNotice';
import { ComparisonSpreadsheet } from './components/ComparisonSpreadsheet';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { ImportSpreadsheetModal } from './components/ImportSpreadsheetModal';
import { ChartsView } from './components/ChartsView';
import { INITIAL_INVOICES } from './data/reconciliationData';
import { InvoiceItem, NFStatusGroup, ReconciliationKPIs } from './types/reconciliation';
import { exportReconciliationToExcel } from './utils/excelExport';

export default function App() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(() => {
    const saved = localStorage.getItem('conciliacao_invoices_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_INVOICES;
      }
    }
    return INITIAL_INVOICES;
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'spreadsheet' | 'calendar' | 'charts'>('dashboard');
  const [selectedFilter, setSelectedFilter] = useState<NFStatusGroup | 'all' | 'agendadas_proximas'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Sync with local storage
  useEffect(() => {
    localStorage.setItem('conciliacao_invoices_v1', JSON.stringify(invoices));
  }, [invoices]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  // Recalculate KPIs dynamically
  const kpis: ReconciliationKPIs = useMemo(() => {
    let lancadasConferidasQtd = 0;
    let lancadasConferidasValor = 0;
    let lancadasNaoConferidasQtd = 0;
    let lancadasNaoConferidasValor = 0;
    let emTransitoAgendadasQtd = 0;
    let emTransitoAgendadasValor = 0;
    let divergenciaFreteQtd = 0;
    let divergenciaFreteValor = 0;
    let sefazSemFreteQtd = 0;
    let sefazSemFreteValor = 0;
    let canceladasSefazQtd = 0;
    let canceladasSefazValor = 0;
    let totalValorGeral = 0;

    invoices.forEach((inv) => {
      totalValorGeral += inv.valor;
      switch (inv.statusGroup) {
        case 'lancada_conferida':
          lancadasConferidasQtd += 1;
          lancadasConferidasValor += inv.valor;
          break;
        case 'lancada_pendente':
          lancadasNaoConferidasQtd += 1;
          lancadasNaoConferidasValor += inv.valor;
          break;
        case 'em_transito_agendada':
        case 'em_transito':
          emTransitoAgendadasQtd += 1;
          emTransitoAgendadasValor += inv.valor;
          break;
        case 'divergencia_frete':
          divergenciaFreteQtd += 1;
          divergenciaFreteValor += inv.valor;
          break;
        case 'sefaz_sem_frete':
          sefazSemFreteQtd += 1;
          sefazSemFreteValor += inv.valor;
          break;
        case 'cancelada_sefaz':
          canceladasSefazQtd += 1;
          canceladasSefazValor += inv.valor;
          break;
      }
    });

    return {
      totalNotas: invoices.length,
      totalValorGeral,
      lancadasConferidasQtd,
      lancadasConferidasValor,
      lancadasNaoConferidasQtd,
      lancadasNaoConferidasValor,
      emTransitoAgendadasQtd,
      emTransitoAgendadasValor,
      divergenciaFreteQtd,
      divergenciaFreteValor,
      sefazSemFreteQtd,
      sefazSemFreteValor,
      canceladasSefazQtd,
      canceladasSefazValor,
    };
  }, [invoices]);

  // Handlers
  const handleExportExcel = () => {
    exportReconciliationToExcel(invoices, kpis);
    showToast('Planilha Excel (.xlsx) exportada com sucesso!');
  };

  const handleResetData = () => {
    if (confirm('Deseja recarregar os dados originais da auditoria fiscal das 3 planilhas?')) {
      setInvoices(INITIAL_INVOICES);
      localStorage.removeItem('conciliacao_invoices_v1');
      showToast('Dados originais restaurados com sucesso.');
    }
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, newStatus: NFStatusGroup) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const nowStr = new Date().toLocaleDateString('pt-BR');
          return {
            ...inv,
            statusGroup: newStatus,
            dataLancamentoERP:
              newStatus === 'lancada_conferida' || newStatus === 'lancada_pendente'
                ? inv.dataLancamentoERP || nowStr
                : inv.dataLancamentoERP,
            conferente:
              newStatus === 'lancada_conferida'
                ? inv.conferente || 'Edinho (Almoxarifado)'
                : inv.conferente,
          };
        }
        return inv;
      })
    );
    showToast(`Nota Fiscal atualizada para: ${newStatus.replace('_', ' ')}.`);
  };

  const handleClearFreight = (invoiceId: string) => {
    handleUpdateInvoiceStatus(invoiceId, 'lancada_conferida');
    showToast('Baixa efetuada no controle de fretes.');
  };

  const handleImportSuccess = (newItems: InvoiceItem[]) => {
    setInvoices((prev) => {
      // deduplicate by numeroNF
      const existingNFs = new Set(prev.map((i) => i.numeroNF));
      const fresh = newItems.filter((i) => !existingNFs.has(i.numeroNF));
      return [...fresh, ...prev];
    });
    showToast(`${newItems.length} notas processadas e integradas na conciliação!`);
    setActiveView('spreadsheet');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Header (compliant with Top Bar Contract) */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onExportExcel={handleExportExcel}
        onOpenImport={() => setIsImportOpen(true)}
        onResetData={handleResetData}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Strip (always available for instant high-level visibility) */}
        <KPISummary
          kpis={kpis}
          activeFilter={selectedFilter}
          onSelectFilter={(filter) => {
            setSelectedFilter(filter);
            setActiveView('spreadsheet');
          }}
        />

        {/* Dynamic Views */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Divergence Notification Banner (If 3 invoices require freight clearance) */}
            <FreightDivergenceNotice
              invoices={invoices}
              onClearFreight={handleClearFreight}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            />

            {/* Radar de Entregas & Agendamentos */}
            <DeliveryRadar
              invoices={invoices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onFilterScheduled={() => {
                setSelectedFilter('em_transito_agendada');
                setActiveView('spreadsheet');
              }}
            />

            {/* Comparison Spreadsheet Section */}
            <ComparisonSpreadsheet
              invoices={invoices}
              selectedFilter={selectedFilter}
              onFilterChange={(f) => setSelectedFilter(f)}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            />
          </div>
        )}

        {activeView === 'spreadsheet' && (
          <div className="space-y-4">
            <ComparisonSpreadsheet
              invoices={invoices}
              selectedFilter={selectedFilter}
              onFilterChange={(f) => setSelectedFilter(f)}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            />
          </div>
        )}

        {activeView === 'calendar' && (
          <div className="space-y-6">
            <DeliveryRadar
              invoices={invoices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onFilterScheduled={() => {
                setSelectedFilter('em_transito_agendada');
                setActiveView('spreadsheet');
              }}
            />

            <ComparisonSpreadsheet
              invoices={invoices.filter((i) => i.statusGroup === 'em_transito_agendada')}
              selectedFilter="em_transito_agendada"
              onFilterChange={(f) => setSelectedFilter(f)}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            />
          </div>
        )}

        {activeView === 'charts' && (
          <ChartsView invoices={invoices} kpis={kpis} />
        )}
      </main>

      {/* Invoice Detail Inspector Drawer/Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdateStatus={handleUpdateInvoiceStatus}
      />

      {/* Spreadsheet Import Modal */}
      <ImportSpreadsheetModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <span>{feedbackToast}</span>
        </div>
      )}
    </div>
  );
}
