export type StatusServico =
  | 'agendada'
  | 'adiada'
  | 'cancelada'
  | 'não realizada'
  | 'realizada'
  | 'cobrança realizada'
  | 'pago'
  | 'sem pagamento confirmado';

// Tipos de serviços de patrulha mecanizada / agrícola disponíveis para seleção
export const TIPOS_SERVICOS_DISPONIVEIS = [
  'Arado',
  'Grade Leve',
  'Grade Aradora',
  'Sulcador',
  'Ensiladeira',
  'Roçadeira',
  'Batedor de Cereais (Feijão)',
  'Batedor de Cereais (Milho)',
  'Bartedor de Cereais (Outros)',
  'Carroça (bambu)',
  'Carroça (lenha)',
  'Carroça (estacas)',
  'Carroça (madeira)',
  'Carroça (Silagem)',
  'Carroça (outros)',
  'Trator (corrente para arrasto)',
] as const;

export type TipoServico = typeof TIPOS_SERVICOS_DISPONIVEIS[number] | string;

export interface SolicitacaoServico {
  id: string; // Ex: "SRV-101"
  produtorId: string; // Ex: "PR-001"
  dataPrevista: string; // "YYYY-MM-DD"
  horaPrevista?: string; // "HH:mm"
  tipoServico: TipoServico;
  descricao: string; // Descrição detalhada
  status: StatusServico;
  observacoes: string;
  valor?: number; // R$ livre (permite valores quebrados/centavos)
  tempoServico?: string; // Tempo/duração do serviço realizado (Ex: "2h 30min", "4 horas", "01:45")
  dataCriacao: string;
  dataConclusao?: string;
}

export interface ProdutorRural {
  id: string; // Ex: "PR-001"
  nomeCompleto: string;
  filiacoes: string; // Nome do Pai / Mãe
  cpf: string; // Ex: "123.456.789-00"
  documentoFotoUrl: string; // Imagem/cópia de documento de identidade (Base64 ou URL)
  apelido: string; // Ex: "Zé do Milho"
  enderecoCorrespondencia: string;
  enderecoPropriedade: string; // Endereço da propriedade rural
  geolocalizacao: string; // Coordenadas ("-15.7801, -47.9292") ou Link ("https://maps.google.com/...")
  telefone: string; // Ex: "(62) 99876-5432"
  observacoes: string;
  areaCultivada: number; // Em hectares (ha)
  dataCadastro: string;
}

export interface EstatisticasProdutor {
  totalSolicitados: number;
  realizados: number;
  cobrancaEmitida: number;
  pagos: number;
  semPagamentoConfirmado: number;
  temPendencia: boolean;
}
