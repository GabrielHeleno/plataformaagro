import { ProdutorRural, SolicitacaoServico, StatusServico, EstatisticasProdutor } from '../types';
import { PRODUTORES_INICIAIS, SERVICOS_INICIAIS } from '../data/initialData';

const PRODUTORES_KEY = 'agro_produtores_rurais_v1';
const SERVICOS_KEY = 'agro_servicos_rurais_v2';
const SERVICOS_KEY_V1 = 'agro_servicos_rurais_v1';

const MAPA_SERVICOS_LEGADOS: Record<string, string> = {
  'Preparo de Solo e Gradagem': 'Grade Aradora',
  'Gradagem e Preparo de Solo': 'Grade Aradora',
  'Plantio Mecanizado': 'Arado',
  'Plantio Mecanizado de Soja': 'Grade Leve',
  'Pulverização e Aplicação de Defensivos': 'Arado',
  'Adubação e Calagem de Solo': 'Sulcador',
  'Adubação de Cobertura': 'Roçadeira',
  'Análise de Solo e Calagem': 'Sulcador',
  'Colheita Mecanizada': 'Ensiladeira',
  'Análise de Solo e Vistoria Agronômica': 'Sulcador',
  'Manutenção de Maquinário Agrícola': 'Batedor de Cereais (Milho)',
  'Poda e Manejo Fitossanitário': 'Carroça (lenha)',
  'Poda e Desbrota de Cafezais': 'Carroça (lenha)',
  'Transporte e Frete de Safra': 'Carroça (Silagem)',
  'Manejo de Pastagem e Silagem': 'Carroça (Silagem)',
  'Consultoria Agronômica e Manejo de Pastagem': 'Carroça (Silagem)',
  'Subsolagem e Descompactação': 'Trator (corrente para arrasto)',
  'Vistoria Fitossanitária': 'Batedor de Cereais (Feijão)',
};

export function getStoredProdutores(): ProdutorRural[] {
  try {
    const data = localStorage.getItem(PRODUTORES_KEY);
    if (!data) {
      localStorage.setItem(PRODUTORES_KEY, JSON.stringify(PRODUTORES_INICIAIS));
      return PRODUTORES_INICIAIS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler produtores do localStorage:', err);
    return PRODUTORES_INICIAIS;
  }
}

export function saveStoredProdutores(produtores: ProdutorRural[]): void {
  try {
    localStorage.setItem(PRODUTORES_KEY, JSON.stringify(produtores));
  } catch (err) {
    console.error('Erro ao salvar produtores:', err);
  }
}

export function getStoredServicos(): SolicitacaoServico[] {
  try {
    const data = localStorage.getItem(SERVICOS_KEY);
    if (!data) {
      // Migração suave se existia v1
      const oldData = localStorage.getItem(SERVICOS_KEY_V1);
      if (oldData) {
        try {
          const parsedOld: SolicitacaoServico[] = JSON.parse(oldData);
          const migrated = parsedOld.map((s) => ({
            ...s,
            tipoServico: MAPA_SERVICOS_LEGADOS[s.tipoServico] || s.tipoServico,
          }));
          localStorage.setItem(SERVICOS_KEY, JSON.stringify(migrated));
          return migrated;
        } catch {
          // fallback para inicial
        }
      }
      localStorage.setItem(SERVICOS_KEY, JSON.stringify(SERVICOS_INICIAIS));
      return SERVICOS_INICIAIS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler serviços do localStorage:', err);
    return SERVICOS_INICIAIS;
  }
}

export function saveStoredServicos(servicos: SolicitacaoServico[]): void {
  try {
    localStorage.setItem(SERVICOS_KEY, JSON.stringify(servicos));
  } catch (err) {
    console.error('Erro ao salvar serviços:', err);
  }
}

export function resetToDefaults(): { produtores: ProdutorRural[]; servicos: SolicitacaoServico[] } {
  localStorage.setItem(PRODUTORES_KEY, JSON.stringify(PRODUTORES_INICIAIS));
  localStorage.setItem(SERVICOS_KEY, JSON.stringify(SERVICOS_INICIAIS));
  return { produtores: PRODUTORES_INICIAIS, servicos: SERVICOS_INICIAIS };
}

// Verifica se o produtor possui alguma solicitação com pendência de pagamento
export function verificarPendenciaProdutor(produtorId: string, servicos: SolicitacaoServico[]): boolean {
  const servicosProdutor = servicos.filter((s) => s.produtorId === produtorId);
  return servicosProdutor.some(
    (s) => s.status === 'sem pagamento confirmado' || s.status === 'cobrança realizada'
  );
}

// Calcula o resumo estatístico exigido pelo enunciado
export function calcularEstatisticasProdutor(
  produtorId: string,
  servicos: SolicitacaoServico[]
): EstatisticasProdutor {
  const servicosProdutor = servicos.filter((s) => s.produtorId === produtorId);
  
  const totalSolicitados = servicosProdutor.length;
  // Serviços realizados (que foram executados: realizada, cobrança realizada ou pago)
  const realizados = servicosProdutor.filter(
    (s) => s.status === 'realizada' || s.status === 'cobrança realizada' || s.status === 'pago'
  ).length;
  
  const cobrancaEmitida = servicosProdutor.filter((s) => s.status === 'cobrança realizada').length;
  const pagos = servicosProdutor.filter((s) => s.status === 'pago').length;
  const semPagamentoConfirmado = servicosProdutor.filter(
    (s) => s.status === 'sem pagamento confirmado'
  ).length;
  
  const temPendencia = semPagamentoConfirmado > 0 || cobrancaEmitida > 0;

  return {
    totalSolicitados,
    realizados,
    cobrancaEmitida,
    pagos,
    semPagamentoConfirmado,
    temPendencia,
  };
}

// Configurações visuais dos status com cores semafóricas e bordas elegantes
export const STATUS_CONFIG: Record<
  StatusServico,
  { label: string; bg: string; text: string; border: string; dotColor: string }
> = {
  agendada: {
    label: 'Agendada',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
  adiada: {
    label: 'Adiada',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  cancelada: {
    label: 'Cancelada',
    bg: 'bg-zinc-100 dark:bg-zinc-800/40',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-300 dark:border-zinc-700',
    dotColor: 'bg-zinc-400',
  },
  'não realizada': {
    label: 'Não Realizada',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    dotColor: 'bg-orange-500',
  },
  realizada: {
    label: 'Realizada',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800',
    dotColor: 'bg-teal-500',
  },
  'cobrança realizada': {
    label: 'Cobrança Realizada',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dotColor: 'bg-purple-500',
  },
  pago: {
    label: 'Pago',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  'sem pagamento confirmado': {
    label: 'Sem Pagamento Confirmado',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500',
  },
};

export const LISTA_STATUS: StatusServico[] = [
  'agendada',
  'adiada',
  'cancelada',
  'não realizada',
  'realizada',
  'cobrança realizada',
  'pago',
  'sem pagamento confirmado',
];

// Funções de formatação e limpeza
export function formatarCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatarTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function formatarMoeda(valor?: number): string {
  if (valor === undefined || isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarDataBR(dataStr: string): string {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  if (!ano || !mes || !dia) return dataStr;
  return `${dia}/${mes}/${ano}`;
}

export function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
