import { ProdutorRural, SolicitacaoServico, StatusServico, EstatisticasProdutor } from '../types';
import { PRODUTORES_INICIAIS, SERVICOS_INICIAIS } from '../data/initialData';
import { idbGet, idbSet } from './indexedDB';
import { saveDocumentFile, getDocumentFile, removeDocumentFile } from './documentStorage';

// Chaves principais e imutáveis para evitar qualquer perda em novas versões
const PRODUTORES_MASTER_KEY = 'agro_produtores_rurais_master';
const SERVICOS_MASTER_KEY = 'agro_servicos_rurais_master';

// Chaves de segurança para snapshot automático e proteção contra falhas em cascata
const PRODUTORES_SNAPSHOT_KEY = 'produtores_safety_snapshot';
const SERVICOS_SNAPSHOT_KEY = 'servicos_safety_snapshot';

// Chaves legadas para busca retroativa e migração automática
const PRODUTORES_FALLBACK_KEYS = [
  PRODUTORES_MASTER_KEY,
  'agro_produtores_rurais_v1',
  'agro_produtores_rurais_v2',
  'agro_produtores_rurais',
];

const SERVICOS_FALLBACK_KEYS = [
  SERVICOS_MASTER_KEY,
  'agro_servicos_rurais_v2',
  'agro_servicos_rurais_v1',
  'agro_servicos_rurais',
];

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

/**
 * Lê os produtores procurando primeiro na chave master e depois em todas as versões anteriores.
 * IMPORTANTE: Nunca sobrescreve o armazenamento local com dados iniciais se falhar ou estiver vazio.
 */
export function getStoredProdutores(): ProdutorRural[] {
  try {
    for (const key of PRODUTORES_FALLBACK_KEYS) {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
    // Retorna apenas em memória caso seja a primeira vez absoluta, SEM sobrescrever ou forçar gravação
    return PRODUTORES_INICIAIS;
  } catch (err) {
    console.warn('Aviso seguro ao ler produtores do localStorage:', err);
    return PRODUTORES_INICIAIS;
  }
}

/**
 * Salva com blindagem quádrupla:
 * 1. O IndexedDB guarda os dados completos e sem limite de fotos em alta resolução.
 * 2. As imagens/documentos são gravados em store dedicado (documentStorage) para nunca poluir a base.
 * 3. Cria um Snapshot automático de segurança em segundo plano para recuperação de desastres.
 * 4. O localStorage armazena APENAS os metadados de texto (fotos pesadas são substituídas por ponteiro 'idb:ID'),
 *    garantindo que o localStorage NUNCA estoure a cota de 5MB nem provoque erros em cascata.
 */
export function saveStoredProdutores(produtores: ProdutorRural[], isExplicitReset = false): void {
  // Trava de segurança: impede que listas vazias acidentais apaguem uma base existente
  if ((!produtores || produtores.length === 0) && !isExplicitReset) {
    console.warn('Proteção de dados ativada: tentativa de salvar lista vazia de produtores bloqueada.');
    return;
  }

  try {
    // 1. Salva ou limpa cópias dos documentos no repositório isolado do IndexedDB
    for (const p of produtores) {
      if (p.documentoFotoUrl && p.documentoFotoUrl.startsWith('data:')) {
        saveDocumentFile(p.id, p.documentoFotoUrl);
      } else if (!p.documentoFotoUrl || !p.documentoFotoUrl.trim()) {
        removeDocumentFile(p.id);
      }
    }

    // 2. Salva a base completa no IndexedDB
    idbSet('produtores_master', produtores);

    // 3. Salva snapshot de segurança automático
    idbSet(PRODUTORES_SNAPSHOT_KEY, produtores);

    // 4. Salva no localStorage com versão 100% livre de imagens pesadas (garantia contra QuotaExceededError)
    try {
      const produtoresTextoPuro = produtores.map((p) => ({
        ...p,
        // Se a foto tiver mais de 4000 caracteres (ex: base64 grande), salva como ponteiro para IndexedDB
        documentoFotoUrl:
          p.documentoFotoUrl && p.documentoFotoUrl.length > 4000
            ? `idb:${p.id}`
            : p.documentoFotoUrl || '',
      }));
      localStorage.setItem(PRODUTORES_MASTER_KEY, JSON.stringify(produtoresTextoPuro));
    } catch (quotaErr) {
      console.warn('Aviso de cota no localStorage. Salvando com remoção total de imagens residuais:', quotaErr);
      try {
        const produtoresSemFoto = produtores.map((p) => ({
          ...p,
          documentoFotoUrl: p.documentoFotoUrl && p.documentoFotoUrl.startsWith('data:') ? `idb:${p.id}` : p.documentoFotoUrl || '',
        }));
        localStorage.setItem(PRODUTORES_MASTER_KEY, JSON.stringify(produtoresSemFoto));
      } catch (innerErr) {
        console.warn('LocalStorage indisponível para texto; mantendo persistência primária no IndexedDB:', innerErr);
      }
    }
  } catch (err) {
    console.warn('Aviso ao persistir produtores com segurança:', err);
  }
}

/**
 * Lê os serviços rurais procurando na chave master e em versões anteriores com migração automática.
 * Nunca sobrescreve o armazenamento local com dados iniciais em caso de falha de leitura.
 */
export function getStoredServicos(): SolicitacaoServico[] {
  try {
    for (const key of SERVICOS_FALLBACK_KEYS) {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed: SolicitacaoServico[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((s) => ({
            ...s,
            tipoServico: MAPA_SERVICOS_LEGADOS[s.tipoServico] || s.tipoServico,
          }));
          return migrated;
        }
      }
    }
    return SERVICOS_INICIAIS;
  } catch (err) {
    console.warn('Aviso seguro ao ler serviços do localStorage:', err);
    return SERVICOS_INICIAIS;
  }
}

/**
 * Salva os serviços rurais tanto no IndexedDB quanto no localStorage com proteção contra falhas.
 */
export function saveStoredServicos(servicos: SolicitacaoServico[], isExplicitReset = false): void {
  // Trava de segurança: impede que listas vazias acidentais apaguem uma base existente
  if ((!servicos || servicos.length === 0) && !isExplicitReset) {
    console.warn('Proteção de dados ativada: tentativa de salvar lista vazia de serviços bloqueada.');
    return;
  }

  try {
    idbSet('servicos_master', servicos);
    idbSet(SERVICOS_SNAPSHOT_KEY, servicos);

    try {
      localStorage.setItem(SERVICOS_MASTER_KEY, JSON.stringify(servicos));
    } catch (quotaErr) {
      console.warn('Aviso de cota ao salvar serviços no localStorage:', quotaErr);
    }
  } catch (err) {
    console.warn('Aviso seguro ao salvar serviços:', err);
  }
}

/**
 * Carrega a base persistente do IndexedDB com reidratação de fotos de documentos.
 * Se o master estiver ausente, tenta recuperar do snapshot de segurança automático.
 */
export async function loadFromIndexedDB(): Promise<{
  produtores?: ProdutorRural[];
  servicos?: SolicitacaoServico[];
} | null> {
  try {
    let idbProdutores = await idbGet<ProdutorRural[]>('produtores_master');
    if (!idbProdutores || idbProdutores.length === 0) {
      idbProdutores = await idbGet<ProdutorRural[]>(PRODUTORES_SNAPSHOT_KEY);
    }

    // Reidrata documentos que estejam explicitamente armazenados no repositório isolado
    if (idbProdutores && idbProdutores.length > 0) {
      const reidratados = await Promise.all(
        idbProdutores.map(async (p) => {
          if (p.documentoFotoUrl && (p.documentoFotoUrl.startsWith('idb:') || p.documentoFotoUrl === '[FOTO_ARMAZENADA_LOCAL]')) {
            const fotoSalva = await getDocumentFile(p.id);
            if (fotoSalva) {
              return { ...p, documentoFotoUrl: fotoSalva };
            }
            return { ...p, documentoFotoUrl: '' };
          }
          return p;
        })
      );
      idbProdutores = reidratados;
    }

    let idbServicos = await idbGet<SolicitacaoServico[]>('servicos_master');
    if (!idbServicos || idbServicos.length === 0) {
      idbServicos = await idbGet<SolicitacaoServico[]>(SERVICOS_SNAPSHOT_KEY);
    }

    if ((idbProdutores && idbProdutores.length > 0) || (idbServicos && idbServicos.length > 0)) {
      return {
        produtores: idbProdutores && idbProdutores.length > 0 ? idbProdutores : undefined,
        servicos: idbServicos && idbServicos.length > 0 ? idbServicos : undefined,
      };
    }
    return null;
  } catch (err) {
    console.warn('Aviso seguro ao carregar do IndexedDB:', err);
    return null;
  }
}

/**
 * Escaneia todas as chaves históricas e snapshots de segurança para recuperar
 * dados em caso de perda acidental anterior.
 */
export async function buscarDadosParaRecuperacao(): Promise<{
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  origem: string;
} | null> {
  try {
    // 1. Tenta produtores_master no IndexedDB
    const masterProds = await idbGet<ProdutorRural[]>('produtores_master');
    const masterServs = await idbGet<SolicitacaoServico[]>('servicos_master');
    if (masterProds && Array.isArray(masterProds) && masterProds.length > 0) {
      const reidratados = await Promise.all(
        masterProds.map(async (p) => {
          if (p.documentoFotoUrl && (p.documentoFotoUrl.startsWith('idb:') || p.documentoFotoUrl === '[FOTO_ARMAZENADA_LOCAL]')) {
            const fotoSalva = await getDocumentFile(p.id);
            if (fotoSalva) return { ...p, documentoFotoUrl: fotoSalva };
            return { ...p, documentoFotoUrl: '' };
          }
          return p;
        })
      );
      return {
        produtores: reidratados,
        servicos: masterServs || [],
        origem: 'Base Master Segura (IndexedDB)',
      };
    }

    // 2. Tenta snapshot de segurança do IndexedDB
    const snapshotProds = await idbGet<ProdutorRural[]>(PRODUTORES_SNAPSHOT_KEY);
    const snapshotServs = await idbGet<SolicitacaoServico[]>(SERVICOS_SNAPSHOT_KEY);
    if (snapshotProds && Array.isArray(snapshotProds) && snapshotProds.length > 0) {
      const reidratados = await Promise.all(
        snapshotProds.map(async (p) => {
          if (p.documentoFotoUrl && (p.documentoFotoUrl.startsWith('idb:') || p.documentoFotoUrl === '[FOTO_ARMAZENADA_LOCAL]')) {
            const fotoSalva = await getDocumentFile(p.id);
            if (fotoSalva) return { ...p, documentoFotoUrl: fotoSalva };
            return { ...p, documentoFotoUrl: '' };
          }
          return p;
        })
      );
      return {
        produtores: reidratados,
        servicos: snapshotServs || [],
        origem: 'Snapshot Automático de Segurança (IndexedDB)',
      };
    }

    // 3. Tenta chaves legadas e persistentes do localStorage
    for (const key of PRODUTORES_FALLBACK_KEYS) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const servsData = localStorage.getItem(SERVICOS_MASTER_KEY);
            const servsParsed = servsData ? JSON.parse(servsData) : [];
            return {
              produtores: parsed,
              servicos: Array.isArray(servsParsed) ? servsParsed : [],
              origem: `Histórico Local (${key})`,
            };
          }
        } catch {
          // Continua procurando
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Exporta backup completo de todos os produtores, serviços e fotos como arquivo .json
 */
export function baixarArquivoBackup(
  produtores: ProdutorRural[],
  servicos: SolicitacaoServico[]
): void {
  const payload = {
    sistema: 'AgroGestão Rural - Patrulha Agrícola',
    versao: '2.0',
    dataExportacao: new Date().toISOString(),
    totalProdutores: produtores.length,
    totalServicos: servicos.length,
    produtores,
    servicos,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const hoje = new Date().toISOString().slice(0, 10);
  a.download = `backup-agrogestao-${hoje}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restaura um backup em formato JSON no sistema
 */
export function restaurarBackup(
  jsonString: string
): { produtores: ProdutorRural[]; servicos: SolicitacaoServico[] } {
  const data = JSON.parse(jsonString);

  if (!data || (!Array.isArray(data.produtores) && !Array.isArray(data.servicos))) {
    throw new Error('Arquivo de backup inválido ou incompatível.');
  }

  const produtores: ProdutorRural[] = Array.isArray(data.produtores) ? data.produtores : [];
  const servicos: SolicitacaoServico[] = Array.isArray(data.servicos) ? data.servicos : [];

  // Salva imediatamente nas duas camadas
  saveStoredProdutores(produtores);
  saveStoredServicos(servicos);

  return { produtores, servicos };
}

export function resetToDefaults(): { produtores: ProdutorRural[]; servicos: SolicitacaoServico[] } {
  saveStoredProdutores(PRODUTORES_INICIAIS, true);
  saveStoredServicos(SERVICOS_INICIAIS, true);
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
  'na fila': {
    label: 'Na Fila / Em Espera',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    dotColor: 'bg-amber-500',
  },
  'em espera': {
    label: 'Na Fila / Em Espera',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    dotColor: 'bg-amber-500',
  },
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
  'na fila',
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

/**
 * Retorna a data atual real no formato YYYY-MM-DD
 */
export function getHojeStr(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Retorna o dia de amanhã no formato YYYY-MM-DD
 */
export function getAmanhaStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

