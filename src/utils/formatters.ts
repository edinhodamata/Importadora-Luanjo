import { NFStatusGroup, SefazStatus } from '../types/reconciliation';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val: number): string => {
  return new Intl.NumberFormat('pt-BR').format(val);
};

export const getStatusLabel = (status: NFStatusGroup): string => {
  switch (status) {
    case 'lancada_conferida':
      return 'Lançada no ERP (Conferida)';
    case 'lancada_pendente':
      return 'Lançada no ERP (Aguardando Conf.)';
    case 'em_transito_agendada':
      return 'Em Trânsito (Com Agendamento)';
    case 'em_transito':
      return 'Em Trânsito (Sem Agendamento)';
    case 'divergencia_frete':
      return 'Divergência: Baixar no Frete';
    case 'sefaz_sem_frete':
      return 'SEFAZ Não Lançada (Sem Frete)';
    case 'cancelada_sefaz':
      return 'Cancelada na SEFAZ';
    default:
      return status;
  }
};

export const getStatusBadgeStyle = (status: NFStatusGroup): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'lancada_conferida':
      return {
        bg: 'bg-emerald-50 text-emerald-800',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'lancada_pendente':
      return {
        bg: 'bg-teal-50 text-teal-800',
        text: 'text-teal-700',
        border: 'border-teal-200',
      };
    case 'em_transito_agendada':
      return {
        bg: 'bg-blue-50 text-blue-800',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'em_transito':
      return {
        bg: 'bg-indigo-50 text-indigo-800',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'divergencia_frete':
      return {
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'sefaz_sem_frete':
      return {
        bg: 'bg-orange-50 text-orange-800',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    case 'cancelada_sefaz':
      return {
        bg: 'bg-rose-50 text-rose-800',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
  }
};

export const getSefazStatusStyle = (status: SefazStatus): { text: string; bg: string } => {
  switch (status) {
    case 'AUTORIZADA':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50' };
    case 'SELADA':
      return { text: 'text-sky-700', bg: 'bg-sky-50' };
    case 'CANCELADA':
      return { text: 'text-rose-700', bg: 'bg-rose-50' };
  }
};
