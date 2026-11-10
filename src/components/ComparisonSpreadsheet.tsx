import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Check,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  Truck,
  CheckCircle2,
  Clock,
  FileX,
  X,
} from 'lucide-react';
import { InvoiceItem, NFStatusGroup } from '../types/reconciliation';
import {
  formatCurrency,
  formatNumber,
  getStatusLabel,
  getStatusBadgeStyle,
  getSefazStatusStyle,
} from '../utils/formatters';
import { exportToCSV } from '../utils/excelExport';

interface ComparisonSpreadsheetProps {
  invoices: InvoiceItem[];
  selectedFilter: NFStatusGroup | 'all' | 'agendadas_proximas';
  onFilterChange: (filter: NFStatusGroup | 'all' | 'agendadas_proximas') => void;
  onSelectInvoice: (invoice: InvoiceItem) => void;
  onUpdateInvoiceStatus: (invoiceId: string, newStatus: NFStatusGroup) => void;
}

type SortField = 'numeroNF' | 'emitente' | 'ufOrigem' | 'dataEmissao' | 'previsaoEntrega' | 'valor' | 'statusGroup';
type SortOrder = 'asc' | 'desc';

export const ComparisonSpreadsheet: React.FC<ComparisonSpreadsheetProps> = ({
  invoices,
  selectedFilter,
  onFilterChange,
  onSelectInvoice,
  onUpdateInvoiceStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('ALL');
  const [ufFilter, setUfFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('dataEmissao');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 25;

  // Extract unique carriers and UFs
  const carriers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.transportadora && inv.transportadora !== 'N/A') {
        set.add(inv.transportadora);
      }
    });
    return Array.from(set).sort();
  }, [invoices]);

  const ufs = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.ufOrigem) set.add(inv.ufOrigem);
    });
    return Array.from(set).sort();
  }, [invoices]);

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Status group filter
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'agendadas_proximas') {
          if (inv.statusGroup !== 'em_transito_agendada') return false;
        } else if (inv.statusGroup !== selectedFilter) {
          return false;
        }
      }

      // 2. Carrier filter
      if (carrierFilter !== 'ALL' && inv.transportadora !== carrierFilter) {
        return false;
      }

      // 3. UF filter
      if (ufFilter !== 'ALL' && inv.ufOrigem !== ufFilter) {
        return false;
      }

      // 4. Search query
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchNF = inv.numeroNF.toLowerCase().includes(query);
        const matchEmitente = inv.emitente.toLowerCase().includes(query);
        const matchCarrier = inv.transportadora.toLowerCase().includes(query);
        const matchCnpj = inv.cnpj?.toLowerCase().includes(query) ?? false;
        const matchObs = inv.observacoes?.toLowerCase().includes(query) ?? false;
        if (!matchNF && !matchEmitente && !matchCarrier && !matchCnpj && !matchObs) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, selectedFilter, carrierFilter, ufFilter, searchTerm]);

  // Sorting Logic
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'valor') {
        return sortOrder === 'asc' ? a.valor - b.valor : b.valor - a.valor;
      }

      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInvoices, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedInvoices.length / rowsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedInvoices.slice(start, start + rowsPerPage);
  }, [sortedInvoices, page, rowsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedInvoices.map((i) => i.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    const selected = invoices.filter((i) => selectedIds.includes(i.id));
    if (selected.length > 0) {
      exportToCSV(selected, `NFs_Selecionadas_${selected.length}.csv`);
    }
  };

  // Status counts for tab labels
  const counts = useMemo(() => {
    return {
      all: invoices.length,
      lancada_conferida: invoices.filter((i) => i.statusGroup === 'lancada_conferida').length,
      lancada_pendente: invoices.filter((i) => i.statusGroup === 'lancada_pendente').length,
      em_transito_agendada: invoices.filter((i) => i.statusGroup === 'em_transito_agendada').length,
      em_transito: invoices.filter((i) => i.statusGroup === 'em_transito').length,
      divergencia_frete: invoices.filter((i) => i.statusGroup === 'divergencia_frete').length,
      sefaz_sem_frete: invoices.filter((i) => i.statusGroup === 'sefaz_sem_frete').length,
      cancelada_sefaz: invoices.filter((i) => i.statusGroup === 'cancelada_sefaz').length,
    };
  }, [invoices]);

  const subtotalFiltered = useMemo(() => {
    return filteredInvoices.reduce((sum, i) => sum + i.valor, 0);
  }, [filteredInvoices]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* 1. Header Toolbar & Segmented Tabs */}
      <div className="p-4 border-b border-slate-200 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Matriz Comparativa de Notas Fiscais (ERP x SEFAZ x Fretes)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifique rapidamente o status de integração no ERP, trânsito fluvial/rodoviário e desembaraço fiscal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleExportSelected}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar ({selectedIds.length})</span>
              </button>
            )}
            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Total Filtrado:{' '}
              <strong className="font-mono tabular-nums text-slate-900 font-bold">
                {formatCurrency(subtotalFiltered)}
              </strong>{' '}
              ({filteredInvoices.length} NFs)
            </div>
          </div>
        </div>

        {/* Status Segmented Tabs (§1.A: Functional button filters, unboxed candy badges banned) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => {
              onFilterChange('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Todas ({counts.all})
          </button>
          <button
            onClick={() => {
              onFilterChange('em_transito_agendada');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'em_transito_agendada'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Com Agendamento ({counts.em_transito_agendada})
          </button>
          <button
            onClick={() => {
              onFilterChange('em_transito');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'em_transito'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Em Trânsito Geral ({counts.em_transito})
          </button>
          <button
            onClick={() => {
              onFilterChange('lancada_conferida');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'lancada_conferida'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Lançadas &amp; Conferidas ({counts.lancada_conferida})
          </button>
          <button
            onClick={() => {
              onFilterChange('lancada_pendente');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'lancada_pendente'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Lançadas Aguardando Conf. ({counts.lancada_pendente})
          </button>
          <button
            onClick={() => {
              onFilterChange('divergencia_frete');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'divergencia_frete'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-slate-100 text-amber-900 hover:bg-amber-100'
            }`}
          >
            Divergência Frete ({counts.divergencia_frete})
          </button>
          <button
            onClick={() => {
              onFilterChange('sefaz_sem_frete');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'sefaz_sem_frete'
                ? 'bg-orange-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            SEFAZ Não Lançadas ({counts.sefaz_sem_frete})
          </button>
          <button
            onClick={() => {
              onFilterChange('cancelada_sefaz');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === 'cancelada_sefaz'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Canceladas SEFAZ ({counts.cancelada_sefaz})
          </button>
        </div>

        {/* 2. Search & Select Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por N° NF, Fornecedor, CNPJ, Transportadora..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={carrierFilter}
              onChange={(e) => {
                setCarrierFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Todas as Transportadoras ({carriers.length})</option>
              {carriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={ufFilter}
              onChange={(e) => {
                setUfFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Todos os Estados ({ufs.length} UFs)</option>
              {ufs.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. The Grid / Table */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
              <th className="py-2.5 px-3 w-8 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {selectedIds.length === paginatedInvoices.length && paginatedInvoices.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-slate-900" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              <th
                onClick={() => handleSort('numeroNF')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>N° NF</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort('emitente')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>Fornecedor / Remetente</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort('ufOrigem')}
                className="py-2.5 px-2 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <span>UF</span>
              </th>

              <th className="py-2.5 px-3 whitespace-nowrap">Transportadora</th>

              <th
                onClick={() => handleSort('dataEmissao')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Emissão</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort('previsaoEntrega')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Previsão / Trânsito</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th className="py-2.5 px-3 whitespace-nowrap">Lançamento ERP</th>

              <th
                onClick={() => handleSort('statusGroup')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Situação Integrada</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => handleSort('valor')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Valor NF (R$)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th className="py-2.5 px-3 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Nenhuma nota encontrada</p>
                    <p className="text-xs text-slate-400">
                      Tente alterar os termos de busca ou selecionar outra categoria no filtro.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => {
                const isSelected = selectedIds.includes(inv.id);
                const isLaunched =
                  inv.statusGroup === 'lancada_conferida' || inv.statusGroup === 'lancada_pendente';
                const isDivergence = inv.statusGroup === 'divergencia_frete';
                const isCanceled = inv.statusGroup === 'cancelada_sefaz';

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/90 transition-colors ${
                      isSelected
                        ? 'bg-slate-100/70'
                        : isDivergence
                        ? 'bg-amber-50/30'
                        : isCanceled
                        ? 'bg-rose-50/20'
                        : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => toggleSelectRow(inv.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-slate-900" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* NF Number */}
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {inv.numeroNF}
                    </td>

                    {/* Fornecedor */}
                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[240px]">
                      <div className="truncate" title={inv.emitente}>
                        {inv.emitente}
                      </div>
                      {inv.cnpj && (
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          {inv.cnpj}
                        </div>
                      )}
                    </td>

                    {/* UF */}
                    <td className="py-2.5 px-2 font-mono text-slate-600 whitespace-nowrap">
                      {inv.ufOrigem}
                    </td>

                    {/* Transportadora */}
                    <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate" title={inv.transportadora}>
                      {inv.transportadora}
                    </td>

                    {/* Data Emissão */}
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {inv.dataEmissao}
                    </td>

                    {/* Previsão Entrega */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {inv.previsaoEntrega ? (
                        <span
                          className={`font-mono tabular-nums ${
                            inv.previsaoEntrega.includes('10/11')
                              ? 'font-bold text-emerald-800'
                              : inv.previsaoEntrega.includes('09/11')
                              ? 'font-bold text-rose-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {inv.previsaoEntrega}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Lançamento ERP */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {inv.dataLancamentoERP ? (
                        <span className="font-mono tabular-nums text-emerald-700 font-medium">
                          {inv.dataLancamentoERP}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">Não Lançada</span>
                      )}
                    </td>

                    {/* Situação Integrada (Zero-Pill: Clean unboxed text with subtle typographic marker) */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {inv.statusGroup === 'lancada_conferida' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                        )}
                        {inv.statusGroup === 'lancada_pendente' && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                        )}
                        {inv.statusGroup === 'em_transito_agendada' && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        )}
                        {inv.statusGroup === 'em_transito' && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                        )}
                        {inv.statusGroup === 'divergencia_frete' && (
                          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                        )}
                        {inv.statusGroup === 'sefaz_sem_frete' && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                        )}
                        {inv.statusGroup === 'cancelada_sefaz' && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
                        )}

                        <span className="font-medium text-slate-800 text-[11px]">
                          {getStatusLabel(inv.statusGroup)}
                        </span>
                      </div>
                    </td>

                    {/* Valor da Nota */}
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-right text-slate-900 whitespace-nowrap">
                      {formatCurrency(inv.valor)}
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          title="Inspecionar detalhes da NF"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isLaunched && !isCanceled && (
                          <button
                            onClick={() => onUpdateInvoiceStatus(inv.id, 'lancada_conferida')}
                            title="Marcar como lançada no ERP"
                            className="px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Lançar
                          </button>
                        )}
                        {isDivergence && (
                          <button
                            onClick={() => onUpdateInvoiceStatus(inv.id, 'lancada_conferida')}
                            title="Dar baixa no frete"
                            className="px-2 py-1 text-[11px] font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors cursor-pointer"
                          >
                            Baixar Frete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Footer Pagination & Counters */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Exibindo{' '}
          <strong className="font-mono tabular-nums text-slate-800">
            {paginatedInvoices.length}
          </strong>{' '}
          de{' '}
          <strong className="font-mono tabular-nums text-slate-800">
            {sortedInvoices.length}
          </strong>{' '}
          notas filtradas
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
          >
            Anterior
          </button>
          <span className="font-mono tabular-nums text-xs">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};
