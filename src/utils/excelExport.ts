import * as XLSX from 'xlsx';
import { InvoiceItem, ReconciliationKPIs } from '../types/reconciliation';
import { formatCurrency, getStatusLabel } from './formatters';

export const exportReconciliationToExcel = (
  invoices: InvoiceItem[],
  kpis: ReconciliationKPIs,
  filename = 'Conciliacao_Notas_Fiscais_ERP_SEFAZ_Fretes.xlsx'
) => {
  const wb = XLSX.utils.book_new();

  // 1. Resumo Executivo
  const resumoData = [
    ['CONCILIAÇÃO FISCAL & LOGÍSTICA DE NOTAS FISCAIS'],
    ['Data do Relatório:', new Date().toLocaleDateString('pt-BR')],
    [''],
    ['INDICADOR / STATUS', 'QUANTIDADE DE NOTAS', 'VALOR TOTAL (R$)', 'AÇÃO / IMPACTO'],
    [
      'Lançadas no ERP (Conferidas/Ativas)',
      kpis.lancadasConferidasQtd,
      kpis.lancadasConferidasValor,
      'Mercadorias recebidas, estoque e financeiro integrados',
    ],
    [
      'Lançadas no ERP (Não Conferidas)',
      kpis.lancadasNaoConferidasQtd,
      kpis.lancadasNaoConferidasValor,
      'Lançadas no início de nov/26; aguardam conferência física',
    ],
    [
      'Em Trânsito / Com Agendamento (Pendentes ERP)',
      kpis.emTransitoAgendadasQtd,
      kpis.emTransitoAgendadasValor,
      'Constam no controle de fretes e aguardam entrega em Manaus',
    ],
    [
      'Divergência: No Frete mas JÁ Lançadas no ERP',
      kpis.divergenciaFreteQtd,
      kpis.divergenciaFreteValor,
      'NFs 489624, 26532 e 2533546 - Necessário dar baixa no frete',
    ],
    [
      'SEFAZ Emitidas Não Lançadas (Sem Frete)',
      kpis.sefazSemFreteQtd,
      kpis.sefazSemFreteValor,
      'Fornecedores locais (AM) ou sem rastreio ativo',
    ],
    [
      'Notas Canceladas na SEFAZ',
      kpis.canceladasSefazQtd,
      kpis.canceladasSefazValor,
      'Canceladas na origem - Bloquear lançamento no ERP',
    ],
    [''],
    ['TOTAL GERAL AUDITADO', kpis.totalNotas, kpis.totalValorGeral, ''],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');

  // Helper to map invoice row
  const mapRow = (inv: InvoiceItem) => ({
    'N° NF': inv.numeroNF,
    'Série': inv.serie || '1',
    'Fornecedor / Emitente': inv.emitente,
    'CNPJ': inv.cnpj || '',
    'UF Origem': inv.ufOrigem,
    'UF Destino': inv.ufDestino,
    'Transportadora': inv.transportadora,
    'Data Emissão': inv.dataEmissao,
    'Previsão / Agendamento': inv.previsaoEntrega || '-',
    'Data Lançamento ERP': inv.dataLancamentoERP || 'Não Lançada',
    'Conferente': inv.conferente || '-',
    'Status Fiscal SEFAZ': inv.statusSefaz,
    'Situação ERP / Logística': getStatusLabel(inv.statusGroup),
    'CFOP': inv.cfop || '',
    'Valor da Nota (R$)': inv.valor,
    'Observações': inv.observacoes || '',
    'Ação Recomendada': inv.acaoRecomendada || '',
  });

  // 2. Todas as Notas
  const wsTodas = XLSX.utils.json_to_sheet(invoices.map(mapRow));
  XLSX.utils.book_append_sheet(wb, wsTodas, 'Todas as Notas');

  // 3. Em Trânsito e Agendadas
  const inTransit = invoices.filter(
    (i) => i.statusGroup === 'em_transito_agendada' || i.statusGroup === 'em_transito'
  );
  if (inTransit.length > 0) {
    const wsInTransit = XLSX.utils.json_to_sheet(inTransit.map(mapRow));
    XLSX.utils.book_append_sheet(wb, wsInTransit, 'Em Trânsito');
  }

  // 4. Lançadas no ERP
  const launched = invoices.filter(
    (i) => i.statusGroup === 'lancada_conferida' || i.statusGroup === 'lancada_pendente'
  );
  if (launched.length > 0) {
    const wsLaunched = XLSX.utils.json_to_sheet(launched.map(mapRow));
    XLSX.utils.book_append_sheet(wb, wsLaunched, 'Lançadas no ERP');
  }

  // 5. Divergências Frete (Dar Baixa)
  const divFrete = invoices.filter((i) => i.statusGroup === 'divergencia_frete');
  if (divFrete.length > 0) {
    const wsDiv = XLSX.utils.json_to_sheet(divFrete.map(mapRow));
    XLSX.utils.book_append_sheet(wb, wsDiv, 'Divergências Frete');
  }

  // 6. SEFAZ Sem Frete
  const sefazSemFrete = invoices.filter((i) => i.statusGroup === 'sefaz_sem_frete');
  if (sefazSemFrete.length > 0) {
    const wsSefaz = XLSX.utils.json_to_sheet(sefazSemFrete.map(mapRow));
    XLSX.utils.book_append_sheet(wb, wsSefaz, 'SEFAZ Não Lançadas');
  }

  // 7. Canceladas SEFAZ
  const canceladas = invoices.filter((i) => i.statusGroup === 'cancelada_sefaz');
  if (canceladas.length > 0) {
    const wsCancel = XLSX.utils.json_to_sheet(canceladas.map(mapRow));
    XLSX.utils.book_append_sheet(wb, wsCancel, 'Canceladas SEFAZ');
  }

  // Write and trigger download
  XLSX.writeFile(wb, filename);
};

export const exportToCSV = (invoices: InvoiceItem[], filename = 'Conciliacao_Notas_Fiscais.csv') => {
  const headers = [
    'Numero_NF',
    'Fornecedor',
    'UF_Origem',
    'Transportadora',
    'Emissao',
    'Previsao_Entrega',
    'Lancamento_ERP',
    'Status_ERP',
    'Status_SEFAZ',
    'Valor_Reais',
    'Acao_Recomendada',
  ];

  const rows = invoices.map((inv) => [
    `"${inv.numeroNF}"`,
    `"${inv.emitente.replace(/"/g, '""')}"`,
    `"${inv.ufOrigem}"`,
    `"${inv.transportadora.replace(/"/g, '""')}"`,
    `"${inv.dataEmissao}"`,
    `"${inv.previsaoEntrega || '-'}"`,
    `"${inv.dataLancamentoERP || 'Nao Lancada'}"`,
    `"${getStatusLabel(inv.statusGroup)}"`,
    `"${inv.statusSefaz}"`,
    inv.valor.toFixed(2),
    `"${(inv.acaoRecomendada || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
