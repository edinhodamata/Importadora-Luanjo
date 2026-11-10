import React from 'react';
import { FileSpreadsheet, Download, Upload, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeView: 'dashboard' | 'spreadsheet' | 'calendar' | 'charts';
  setActiveView: (view: 'dashboard' | 'spreadsheet' | 'calendar' | 'charts') => void;
  onExportExcel: () => void;
  onOpenImport: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onExportExcel,
  onOpenImport,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              NF
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('dashboard');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
            >
              Conciliação Fiscal &amp; Logística
            </a>
          </div>

          {/* Zone 2: 4-5 clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'dashboard' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveView('spreadsheet')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'spreadsheet' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Planilha Comparativa
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'calendar' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Radar de Entregas
            </button>
            <button
              onClick={() => setActiveView('charts')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'charts' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Análise Financeira
            </button>
          </nav>

          {/* Zone 3: 1 primary action (with secondary tool buttons) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenImport}
              title="Importar novas planilhas para conciliação"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 text-xs font-medium flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={onResetData}
              title="Recarregar base original auditada"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onExportExcel}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
