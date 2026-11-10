export type NFStatusGroup = 
  | 'lancada_conferida'      // Lançada no ERP e conferida
  | 'lancada_pendente'       // Lançada no ERP aguardando conferência física
  | 'em_transito_agendada'   // Em trânsito com previsão/agendamento de entrega (não lançada no ERP)
  | 'em_transito'            // Em trânsito sem agendamento fixo (não lançada no ERP)
  | 'divergencia_frete'      // Consta no frete mas JÁ lançada no ERP (dar baixa no frete)
  | 'sefaz_sem_frete'        // SEFAZ autorizada não lançada no ERP e sem frete mapeado
  | 'cancelada_sefaz';       // Cancelada na SEFAZ (não lançar)

export type SefazStatus = 'AUTORIZADA' | 'SELADA' | 'CANCELADA';

export interface InvoiceItem {
  id: string;
  numeroNF: string;
  serie?: string;
  emitente: string;
  cnpj?: string;
  ufOrigem: string;
  ufDestino: string;
  transportadora: string;
  dataEmissao: string; // YYYY-MM-DD or DD/MM/YYYY
  previsaoEntrega?: string; // DD/MM/YYYY or 'Em Trânsito'
  dataLancamentoERP?: string;
  conferente?: string;
  valor: number;
  statusGroup: NFStatusGroup;
  statusSefaz: SefazStatus;
  cfop?: string;
  chaveAcesso?: string;
  observacoes?: string;
  acaoRecomendada?: string;
  prioridade?: 'alta' | 'media' | 'baixa';
  dataBaixaFrete?: string;
}

export interface ReconciliationKPIs {
  totalNotas: number;
  totalValorGeral: number;
  lancadasConferidasQtd: number;
  lancadasConferidasValor: number;
  lancadasNaoConferidasQtd: number;
  lancadasNaoConferidasValor: number;
  emTransitoAgendadasQtd: number;
  emTransitoAgendadasValor: number;
  divergenciaFreteQtd: number;
  divergenciaFreteValor: number;
  sefazSemFreteQtd: number;
  sefazSemFreteValor: number;
  canceladasSefazQtd: number;
  canceladasSefazValor: number;
}
