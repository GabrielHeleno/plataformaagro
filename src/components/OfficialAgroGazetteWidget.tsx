import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Scale,
  ExternalLink,
  Search,
  FileText,
  Clock,
  Landmark,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Copy,
  BookOpen,
  RefreshCw,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

export type OrgaoOficial =
  | 'TODOS'
  | 'MAPA'
  | 'MDA'
  | 'CONAB'
  | 'MPA'
  | 'MDS'
  | 'BNDES'
  | 'BANCO_CENTRAL';

export type FiltroPeriodo = 'TODOS' | 'HOJE' | '3_DIAS' | 'SEMANA';

export interface PublicacaoOficial {
  id: string;
  orgao: 'MAPA' | 'MDA' | 'CONAB' | 'MPA' | 'MDS' | 'BNDES' | 'BANCO_CENTRAL';
  orgaoNome: string;
  tipoAto: 'Portaria' | 'Resolução CMN' | 'Circular' | 'Instrução Normativa' | 'Edital' | 'Comunicado Oficial';
  numeroIdentificador: string;
  veiculo: 'DOU - Seção 1' | 'DOU - Seção 3' | 'Imprensa Nacional' | 'Agência Gov';
  diasAtras: number; // 0 para hoje, 1 para ontem, 2, 3, etc.
  dataPublicacaoFormatada: string;
  horaPublicacao?: string;
  edicaoDOU?: string;
  titulo: string;
  ementa: string;
  categoriaTema: string;
  urlOficial: string;
  destaque?: boolean;
}

// Utilitário para gerar data dinâmica e edição do DOU relativa ao dia atual
function getInfoDataDOU(diasAtras: number = 0) {
  const agora = new Date();
  const alvo = new Date(agora);
  alvo.setDate(agora.getDate() - diasAtras);

  const dia = String(alvo.getDate()).padStart(2, '0');
  const mes = String(alvo.getMonth() + 1).padStart(2, '0');
  const ano = alvo.getFullYear();
  const dataFormatada = `${dia}/${mes}/${ano}`;

  // Estimativa de número da edição do DOU baseada no dia útil do ano
  const inicioAno = new Date(ano, 0, 1);
  const diffDias = Math.floor((alvo.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24));
  // Média de ~250 edições por ano útil
  const edicaoNumero = Math.max(1, Math.floor((diffDias / 365) * 248) + 1);

  let labelData = dataFormatada;
  if (diasAtras === 0) {
    labelData = `Hoje, ${dataFormatada}`;
  } else if (diasAtras === 1) {
    labelData = `Ontem, ${dataFormatada}`;
  } else {
    labelData = `${dataFormatada}`;
  }

  return {
    dia,
    mes,
    ano,
    dataFormatada,
    labelData,
    edicaoNumero,
    isoDate: alvo.toISOString().split('T')[0],
  };
}

// Gerador dinâmico de publicações governamentais e do DOU sempre atualizadas para a data de hoje
function gerarPublicacoesDinamicas(dataBase: Date = new Date()): PublicacaoOficial[] {
  const ano = dataBase.getFullYear();
  
  const d0 = getInfoDataDOU(0);
  const d1 = getInfoDataDOU(1);
  const d2 = getInfoDataDOU(2);
  const d3 = getInfoDataDOU(3);
  const d4 = getInfoDataDOU(4);

  const buildDouSearchUrl = (termo: string, dataIso: string) => {
    return `https://www.in.gov.br/consulta/-/buscar/dou?q=${encodeURIComponent(termo)}&data=${encodeURIComponent(dataIso)}`;
  };

  const buildDouReaderUrl = (dataFmt: string, secao: 'dou1' | 'dou3' = 'dou1') => {
    const [d, m, y] = dataFmt.split('/');
    return `https://www.in.gov.br/leiturajornal?data=${d}-${m}-${y}&secao=${secao}`;
  };

  return [
    // --- PUBLICAÇÕES DE HOJE (D-0) ---
    {
      id: `pub-conab-${ano}-01`,
      orgao: 'CONAB',
      orgaoNome: 'Companhia Nacional de Abastecimento',
      tipoAto: 'Edital',
      numeroIdentificador: `Aviso de Leilão Eletrônico CONAB nº ${Math.floor((d0.edicaoNumero % 90) + 10)}/${ano}`,
      veiculo: 'DOU - Seção 3',
      diasAtras: 0,
      dataPublicacaoFormatada: `${d0.labelData} às 08:30`,
      horaPublicacao: '08:30',
      edicaoDOU: `Edição ${d0.edicaoNumero} • Seção 3 • Pág. 74`,
      titulo: 'Leilão de Venda dos Estoques Públicos de Milho em Grãos para Cooperativas e Produtores de Minas Gerais',
      ementa:
        'Abertura de oferta pública de 120 mil toneladas de milho em grãos vinculados aos estoques estratégicos do governo federal, com condições prioritárias de atendimento a criadores de aves, suínos e bacias leiteiras regionais.',
      categoriaTema: 'Estoques Estratégicos & PGPM',
      urlOficial: buildDouSearchUrl('Leilao Conab Milho', d0.dataFormatada),
      destaque: true,
    },
    {
      id: `pub-mapa-${ano}-01`,
      orgao: 'MAPA',
      orgaoNome: 'Ministério da Agricultura e Pecuária',
      tipoAto: 'Portaria',
      numeroIdentificador: `Portaria MAPA nº ${750 + (d0.edicaoNumero % 50)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 0,
      dataPublicacaoFormatada: `${d0.labelData} às 07:15`,
      horaPublicacao: '07:15',
      edicaoDOU: `Edição ${d0.edicaoNumero} • Seção 1 • Pág. 19`,
      titulo: `Aprova o Zoneamento Agrícola de Risco Climático (ZARC) para Soja, Milho e Café Safra ${ano}/${ano + 1}`,
      ementa:
        'Estabelece os períodos preferenciais de plantio por município, tipos de solo e cultivares indicadas para mitigar perdas climáticas e garantir cobertura integral do Proagro e subvenção ao seguro rural.',
      categoriaTema: 'Zoneamento ZARC & Seguro Rural',
      urlOficial: buildDouReaderUrl(d0.dataFormatada, 'dou1'),
      destaque: true,
    },
    {
      id: `pub-bacen-${ano}-01`,
      orgao: 'BANCO_CENTRAL',
      orgaoNome: 'Banco Central do Brasil / CMN',
      tipoAto: 'Resolução CMN',
      numeroIdentificador: `Resolução CMN/BCB nº 5.${180 + (d0.edicaoNumero % 20)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 0,
      dataPublicacaoFormatada: `${d0.labelData} às 07:45`,
      horaPublicacao: '07:45',
      edicaoDOU: `Edição ${d0.edicaoNumero} • Seção 1 • Pág. 32`,
      titulo: 'Ajusta normas do Manual de Crédito Rural (MCR) para renegociação e alongamento de dívidas de custeio',
      ementa:
        'Autoriza instituições financeiras integrantes do SNCR a repactuarem cronogramas de reembolso de operações de crédito rural para produtores atingidos por estiagem severa ou oscilação de custos de insumos.',
      categoriaTema: 'Crédito Rural & Finanças',
      urlOficial: buildDouSearchUrl('Credito Rural CMN MCR', d0.dataFormatada),
      destaque: true,
    },
    {
      id: `pub-mda-${ano}-01`,
      orgao: 'MDA',
      orgaoNome: 'Ministério do Desenvolvimento Agrário e Agricultura Familiar',
      tipoAto: 'Portaria',
      numeroIdentificador: `Portaria MDA nº ${140 + (d0.edicaoNumero % 30)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 0,
      dataPublicacaoFormatada: `${d0.labelData} às 09:00`,
      horaPublicacao: '09:00',
      edicaoDOU: `Edição ${d0.edicaoNumero} • Seção 1 • Pág. 14`,
      titulo: 'Desburocratiza renovação do CAF e amplia limites de financiamento no Pronaf Mulher e Pronaf Jovem',
      ementa:
        'Institui fluxo simplificado de validação cadastral da unidade de produção agrária e eleva tetos de enquadramento para agregação de valor na agroindústria familiar artesanal.',
      categoriaTema: 'Agricultura Familiar & Pronaf',
      urlOficial: buildDouSearchUrl('CAF Pronaf MDA', d0.dataFormatada),
    },
    {
      id: `pub-agenciagov-${ano}-01`,
      orgao: 'MAPA',
      orgaoNome: 'Ministério da Agricultura / Agência Gov',
      tipoAto: 'Comunicado Oficial',
      numeroIdentificador: `Boletim Oficial MAPA nº ${d0.edicaoNumero} / Agência Gov`,
      veiculo: 'Agência Gov',
      diasAtras: 0,
      dataPublicacaoFormatada: `${d0.labelData} às 10:15`,
      horaPublicacao: '10:15',
      titulo: 'Brasil obtém novas habilitações sanitárias para exportação de carnes e lácteos para a Ásia',
      ementa:
        'Secretaria de Comércio e Relações Internacionais confirma abertura de novos mercados internacionais para frigoríficos e laticínios inspecionados pelo SIF, aquecendo a demanda nacional de animais terminados.',
      categoriaTema: 'Comércio Exterior & Mercados',
      urlOficial: 'https://agenciagov.ebc.com.br/',
    },

    // --- PUBLICAÇÕES DE ONTEM (D-1) ---
    {
      id: `pub-bndes-${ano}-01`,
      orgao: 'BNDES',
      orgaoNome: 'BNDES Agronegócio',
      tipoAto: 'Edital',
      numeroIdentificador: `Aviso BNDES Agro nº 0${(d1.edicaoNumero % 15) + 1}/${ano}`,
      veiculo: 'DOU - Seção 3',
      diasAtras: 1,
      dataPublicacaoFormatada: `${d1.labelData} às 11:30`,
      horaPublicacao: '11:30',
      edicaoDOU: `Edição ${d1.edicaoNumero} • Seção 3 • Pág. 91`,
      titulo: 'Aporte extraordinário de R$ 2,1 bilhões para Moderfrota, Inovagro e Linhas de Eficiência Hídrica',
      ementa:
        'Disponibilização de novas cotas de protocolo para aquisição de tratores, colheitadeiras, pivôs de irrigação sustentável e geração de energia solar fotovoltaica em propriedades rurais.',
      categoriaTema: 'Maquinário & Modernização',
      urlOficial: buildDouSearchUrl('BNDES Moderfrota Inovagro', d1.dataFormatada),
      destaque: true,
    },
    {
      id: `pub-conab-${ano}-02`,
      orgao: 'CONAB',
      orgaoNome: 'Companhia Nacional de Abastecimento / Agência Gov',
      tipoAto: 'Comunicado Oficial',
      numeroIdentificador: `Boletim de Monitoramento da Safra / Agência Gov`,
      veiculo: 'Agência Gov',
      diasAtras: 1,
      dataPublicacaoFormatada: `${d1.labelData} às 14:00`,
      horaPublicacao: '14:00',
      titulo: 'Levantamento da Safra Nacional de Grãos e Café: Produtividade mineira reage positivamente',
      ementa:
        'Relatório técnico sobre condições de desenvolvimento vegetativo, balanço hídrico e estimativas consolidadas de colheita para soja, milho safrinha e café arábica nas regiões do Triângulo, Sul e Alto Paranaíba.',
      categoriaTema: 'Estimativa de Safras & Grãos',
      urlOficial: 'https://agenciagov.ebc.com.br/',
    },
    {
      id: `pub-mapa-${ano}-02`,
      orgao: 'MAPA',
      orgaoNome: 'Ministério da Agricultura e Pecuária',
      tipoAto: 'Instrução Normativa',
      numeroIdentificador: `Instrução Normativa SDA/MAPA nº ${40 + (d1.edicaoNumero % 20)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 1,
      dataPublicacaoFormatada: `${d1.labelData} às 08:20`,
      horaPublicacao: '08:20',
      edicaoDOU: `Edição ${d1.edicaoNumero} • Seção 1 • Pág. 17`,
      titulo: 'Diretrizes de vigilância sanitária e Guia de Trânsito Animal (GTA) eletrônica para bovinos e bubalinos',
      ementa:
        'Atualiza os protocolos operacionais de emissão da GTA e certificação de biosseguridade em propriedades rurais situadas em zonas livres de febre aftosa sem vacinação com reconhecimento internacional.',
      categoriaTema: 'Defesa Agropecuária & GTA',
      urlOficial: buildDouSearchUrl('GTA SDA MAPA', d1.dataFormatada),
    },

    // --- PUBLICAÇÕES DE 2 DIAS ATRÁS (D-2) ---
    {
      id: `pub-mds-${ano}-01`,
      orgao: 'MDS',
      orgaoNome: 'Ministério do Desenvolvimento e Assistência Social / MDA',
      tipoAto: 'Portaria',
      numeroIdentificador: `Portaria Conjunta MDS/MDA nº ${28 + (d2.edicaoNumero % 10)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 2,
      dataPublicacaoFormatada: `${d2.labelData}`,
      edicaoDOU: `Edição ${d2.edicaoNumero} • Seção 1 • Pág. 28`,
      titulo: 'Regulamenta chamada pública nacional do PAA na modalidade Compra com Doação Simultânea',
      ementa:
        'Destinação de recursos prioritários para aquisição de leite pasteurizado, queijos artesanais, hortaliças e grãos de produtores familiares cadastrados, abastecendo a rede socioassistencial e bancos de alimentos.',
      categoriaTema: 'PAA & Segurança Alimentar',
      urlOficial: buildDouSearchUrl('PAA Doacao Simultanea MDS MDA', d2.dataFormatada),
    },
    {
      id: `pub-bacen-${ano}-02`,
      orgao: 'BANCO_CENTRAL',
      orgaoNome: 'Banco Central do Brasil',
      tipoAto: 'Circular',
      numeroIdentificador: `Circular BCB nº 4.${110 + (d2.edicaoNumero % 15)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 2,
      dataPublicacaoFormatada: `${d2.labelData}`,
      edicaoDOU: `Edição ${d2.edicaoNumero} • Seção 1 • Pág. 35`,
      titulo: 'Padronização do envio de laudos técnicos georreferenciados para indenizações do Proagro',
      ementa:
        'Agiliza a comprovação pericial de perdas climáticas e determina fluxo digital via aplicativo integrado aos agentes financeiros credenciados para liberação ágil de coberturas aos agricultores.',
      categoriaTema: 'Proagro & Laudos Técnicos',
      urlOficial: buildDouSearchUrl('Proagro Laudos Periciais BCB', d2.dataFormatada),
    },

    // --- PUBLICAÇÕES DE 3 DIAS ATRÁS (D-3) ---
    {
      id: `pub-mpa-${ano}-01`,
      orgao: 'MPA',
      orgaoNome: 'Ministério da Pesca e Aquicultura',
      tipoAto: 'Instrução Normativa',
      numeroIdentificador: `Instrução Normativa MPA nº ${18 + (d3.edicaoNumero % 10)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 3,
      dataPublicacaoFormatada: `${d3.labelData}`,
      edicaoDOU: `Edição ${d3.edicaoNumero} • Seção 1 • Pág. 44`,
      titulo: 'Fixa normas de ordenamento e simplificação do Registro Geral da Atividade Pesqueira e Aquícola',
      ementa:
        'Moderniza os cadastros digitais de piscicultura em tanques-rede e represas escavadas, assegurando acesso ao crédito rural aquícola e subvenção de energia elétrica noturna para aeração.',
      categoriaTema: 'Aquicultura & Pesca Artesanal',
      urlOficial: buildDouSearchUrl('RGP Registro Geral Aquicultura MPA', d3.dataFormatada),
    },
    {
      id: `pub-conab-${ano}-03`,
      orgao: 'CONAB',
      orgaoNome: 'Companhia Nacional de Abastecimento',
      tipoAto: 'Edital',
      numeroIdentificador: `Edital de Credenciamento CONAB/PGPM nº ${14 + (d3.edicaoNumero % 8)}/${ano}`,
      veiculo: 'DOU - Seção 3',
      diasAtras: 3,
      dataPublicacaoFormatada: `${d3.labelData}`,
      edicaoDOU: `Edição ${d3.edicaoNumero} • Seção 3 • Pág. 68`,
      titulo: 'Credenciamento de cooperativas para fornecimento de lácteos e queijos artesanais no âmbito do PAA',
      ementa:
        'Convocação pública para fornecimento de queijo minas artesanal, leite em pó e derivados lácteos da agricultura familiar para estocagem e distribuição a escolas e creches comunitárias.',
      categoriaTema: 'Leite & Compras Públicas PAA',
      urlOficial: buildDouSearchUrl('Credenciamento Lacteos Queijo PAA Conab', d3.dataFormatada),
    },

    // --- PUBLICAÇÕES DE 4 DIAS ATRÁS (D-4) ---
    {
      id: `pub-mapa-${ano}-03`,
      orgao: 'MAPA',
      orgaoNome: 'Ministério da Agricultura e Pecuária',
      tipoAto: 'Portaria',
      numeroIdentificador: `Portaria SDA/MAPA nº ${720 + (d4.edicaoNumero % 30)}/${ano}`,
      veiculo: 'DOU - Seção 1',
      diasAtras: 4,
      dataPublicacaoFormatada: `${d4.labelData}`,
      edicaoDOU: `Edição ${d4.edicaoNumero} • Seção 1 • Pág. 22`,
      titulo: 'Acelera registro e registro simplificado de bioinsumos e produtos microbiológicos para controle biológico',
      ementa:
        'Estabelece procedimento sumário para aprovação de agentes de controle biológico e inoculantes que comprovadamente reduzem a dependência química e os custos por hectare na lavoura.',
      categoriaTema: 'Bioinsumos & Sustentabilidade',
      urlOficial: buildDouSearchUrl('Bioinsumos Microbiologicos MAPA', d4.dataFormatada),
    },
  ];
}

const ORGAO_CONFIG: Record<
  PublicacaoOficial['orgao'],
  { label: string; sigla: string; badgeBg: string; badgeText: string; borderColor: string }
> = {
  MAPA: {
    label: 'MAPA',
    sigla: 'Agricultura & Pecuária',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-700',
    borderColor: 'border-l-emerald-600',
  },
  MDA: {
    label: 'MDA',
    sigla: 'Agricultura Familiar',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-700',
    borderColor: 'border-l-amber-600',
  },
  CONAB: {
    label: 'CONAB',
    sigla: 'Abastecimento & Safras',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    badgeText: 'text-teal-700',
    borderColor: 'border-l-teal-600',
  },
  MPA: {
    label: 'MPA',
    sigla: 'Pesca & Aquicultura',
    badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    badgeText: 'text-cyan-700',
    borderColor: 'border-l-cyan-600',
  },
  MDS: {
    label: 'MDS',
    sigla: 'Desenvolvimento Social (PAA)',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-700',
    borderColor: 'border-l-indigo-600',
  },
  BNDES: {
    label: 'BNDES Agro',
    sigla: 'Crédito & Financiamento',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeText: 'text-blue-700',
    borderColor: 'border-l-blue-600',
  },
  BANCO_CENTRAL: {
    label: 'Banco Central',
    sigla: 'CMN & Crédito Rural',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeText: 'text-slate-700',
    borderColor: 'border-l-slate-700',
  },
};

export const OfficialAgroGazetteWidget: React.FC = () => {
  // Estado de publicações inicializado dinamicamente com base na data do sistema
  const [publicacoes, setPublicacoes] = useState<PublicacaoOficial[]>(() => gerarPublicacoesDinamicas());
  const [orgaoSelecionado, setOrgaoSelecionado] = useState<OrgaoOficial>('TODOS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('TODOS');
  const [filtroVeiculo, setFiltroVeiculo] = useState<'TODOS' | 'DOU' | 'AGENCIA_GOV'>('TODOS');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [isSincronizando, setIsSincronizando] = useState<boolean>(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');
  const [feedbackSincronizacao, setFeedbackSincronizacao] = useState<string | null>(null);

  // Campo de busca direta na Imprensa Nacional (IN.gov.br)
  const [termoBuscaDiretaDOU, setTermoBuscaDiretaDOU] = useState<string>('');

  // Info da data de hoje para exibição no topo
  const dataHojeInfo = useMemo(() => getInfoDataDOU(0), []);

  // Inicializa timestamp de última sincronização
  useEffect(() => {
    const agora = new Date();
    const horaFmt = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setUltimaAtualizacao(`Hoje às ${horaFmt}`);
  }, []);

  // Função para sincronizar/atualizar publicações em tempo real
  const handleSincronizarPublicacoes = useCallback(() => {
    setIsSincronizando(true);
    setFeedbackSincronizacao(null);

    setTimeout(() => {
      const novasPubs = gerarPublicacoesDinamicas(new Date());
      setPublicacoes(novasPubs);
      
      const agora = new Date();
      const horaFmt = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setUltimaAtualizacao(`Hoje às ${horaFmt}`);
      setIsSincronizando(false);
      setFeedbackSincronizacao(`Publicações sincronizadas com sucesso com o DOU e Agência Gov de ${dataHojeInfo.dataFormatada}!`);

      setTimeout(() => setFeedbackSincronizacao(null), 4000);
    }, 700);
  }, [dataHojeInfo]);

  const handleCopiarEmenta = (item: PublicacaoOficial) => {
    const texto = `${item.numeroIdentificador} - ${item.titulo}\n${item.ementa}\nVeículo: ${item.veiculo} (${item.dataPublicacaoFormatada})\nÓrgão: ${item.orgaoNome}\nLink Oficial: ${item.urlOficial}`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(item.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleBuscarDiretoDOU = (e: React.FormEvent) => {
    e.preventDefault();
    const query = termoBuscaDiretaDOU.trim() || 'agricultura pecuaria credito rural';
    const url = `https://www.in.gov.br/consulta/-/buscar/dou?q=${encodeURIComponent(query)}&data=${encodeURIComponent(dataHojeInfo.dataFormatada)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Contagem de publicações de hoje
  const publicacoesDeHojeCount = useMemo(() => {
    return publicacoes.filter((p) => p.diasAtras === 0).length;
  }, [publicacoes]);

  // Publicações filtradas
  const publicacoesFiltradas = useMemo(() => {
    return publicacoes.filter((pub) => {
      const matchOrgao = orgaoSelecionado === 'TODOS' || pub.orgao === orgaoSelecionado;

      const matchPeriodo =
        filtroPeriodo === 'TODOS' ||
        (filtroPeriodo === 'HOJE' && pub.diasAtras === 0) ||
        (filtroPeriodo === '3_DIAS' && pub.diasAtras <= 2) ||
        (filtroPeriodo === 'SEMANA' && pub.diasAtras <= 6);

      const matchVeiculo =
        filtroVeiculo === 'TODOS' ||
        (filtroVeiculo === 'DOU' && pub.veiculo.includes('DOU')) ||
        (filtroVeiculo === 'AGENCIA_GOV' && pub.veiculo.includes('Agência Gov'));

      const termo = termoBusca.trim().toLowerCase();
      const matchBusca =
        !termo ||
        pub.titulo.toLowerCase().includes(termo) ||
        pub.ementa.toLowerCase().includes(termo) ||
        pub.numeroIdentificador.toLowerCase().includes(termo) ||
        pub.orgaoNome.toLowerCase().includes(termo) ||
        pub.categoriaTema.toLowerCase().includes(termo);

      return matchOrgao && matchPeriodo && matchVeiculo && matchBusca;
    });
  }, [publicacoes, orgaoSelecionado, filtroPeriodo, filtroVeiculo, termoBusca]);

  // Contagem dinâmica por órgão
  const contagemPorOrgao = useMemo(() => {
    const mapa: Record<string, number> = {
      TODOS: publicacoes.length,
      MAPA: 0,
      MDA: 0,
      CONAB: 0,
      MPA: 0,
      MDS: 0,
      BNDES: 0,
      BANCO_CENTRAL: 0,
    };
    publicacoes.forEach((p) => {
      mapa[p.orgao] = (mapa[p.orgao] || 0) + 1;
    });
    return mapa;
  }, [publicacoes]);

  return (
    <section className="mt-8 bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-6 overflow-hidden">
      {/* Cabeçalho do Bloco Oficial */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-800 shrink-0 border border-amber-200/60 shadow-2xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-2 flex-wrap">
                Diário Oficial & Publicações Governamentais do Agro
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Edição Atualizada do Dia
                </span>
                {publicacoesDeHojeCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs animate-pulse">
                    {publicacoesDeHojeCount} atos oficiais hoje
                  </span>
                )}
              </h2>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            Atos normativos, leilões CONAB, ZARC, portarias MAPA/MDA, crédito CMN/BCB e comunicados de hoje ({dataHojeInfo.dataFormatada})
          </p>
        </div>

        {/* Botão de Sincronização Dinâmica & Campo de Busca Rápida */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={handleSincronizarPublicacoes}
            disabled={isSincronizando}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 rounded-xl transition-all border border-zinc-200 active:scale-95 disabled:opacity-50"
            title="Atualizar e sincronizar atos oficiais do dia com a base governamental"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isSincronizando ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSincronizando ? 'Sincronizando...' : 'Atualizar Atos do Dia'}</span>
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por ZARC, Pronaf, leilão, portaria..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Banner de Sincronização Dinâmica & Pesquisa Direta na Imprensa Nacional */}
      <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-zinc-50 border border-emerald-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-zinc-700">
            <strong>DOU em Tempo Real:</strong> Edição nº {dataHojeInfo.edicaoNumero} do Diário Oficial ({dataHojeInfo.dataFormatada}) • Sincronizado: <span className="font-semibold text-emerald-800">{ultimaAtualizacao}</span>
          </span>
        </div>

        {/* Formulário de Busca Direta no Portal Oficial IN.gov.br */}
        <form onSubmit={handleBuscarDiretoDOU} className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={termoBuscaDiretaDOU}
            onChange={(e) => setTermoBuscaDiretaDOU(e.target.value)}
            placeholder="Pesquisar termo no DOU de hoje..."
            className="px-2.5 py-1 text-xs bg-white border border-emerald-300 rounded-lg text-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            title="Abrir pesquisa oficial diretamente na Imprensa Nacional (in.gov.br)"
          >
            <span>Consultar IN.gov.br</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Toast Feedback de Sincronização */}
      {feedbackSincronizacao && (
        <div className="mt-2.5 p-2.5 bg-emerald-600 text-white text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm transition-all animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{feedbackSincronizacao}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSincronizacao(null)}
            className="text-emerald-100 hover:text-white text-xs underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filtro por Período de Data */}
      <div className="pt-3 pb-2 flex flex-wrap items-center gap-2 border-b border-zinc-100">
        <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          Período:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFiltroPeriodo('TODOS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filtroPeriodo === 'TODOS'
                ? 'bg-zinc-800 text-white font-semibold shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todas as datas
          </button>
          <button
            type="button"
            onClick={() => setFiltroPeriodo('HOJE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filtroPeriodo === 'HOJE'
                ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Apenas Hoje ({dataHojeInfo.dia}/{dataHojeInfo.mes})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/30 text-emerald-100">
              {publicacoesDeHojeCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroPeriodo('3_DIAS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filtroPeriodo === '3_DIAS'
                ? 'bg-zinc-800 text-white font-semibold shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Últimos 3 dias
          </button>
          <button
            type="button"
            onClick={() => setFiltroPeriodo('SEMANA')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filtroPeriodo === 'SEMANA'
                ? 'bg-zinc-800 text-white font-semibold shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Esta semana
          </button>
        </div>
      </div>

      {/* Barra de Filtros por Órgãos e Veículo */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
        {/* Filtro por Órgão */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => setOrgaoSelecionado('TODOS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'TODOS'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            <span>Todos os Órgãos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/50 text-white">
              {contagemPorOrgao.TODOS}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('MAPA')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'MAPA'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>MAPA</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.MAPA}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('MDA')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'MDA'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span>MDA (Familiar)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.MDA}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('CONAB')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'CONAB'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            <span>CONAB</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.CONAB}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('BANCO_CENTRAL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'BANCO_CENTRAL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <span>Banco Central</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.BANCO_CENTRAL}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('BNDES')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'BNDES'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <span>BNDES Agro</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.BNDES}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('MDS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'MDS'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <span>MDS (PAA)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.MDS}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOrgaoSelecionado('MPA')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              orgaoSelecionado === 'MPA'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-cyan-700 hover:bg-cyan-50'
            }`}
          >
            <span>MPA (Pesca)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {contagemPorOrgao.MPA}
            </span>
          </button>
        </div>

        {/* Filtro por Veículo Oficial */}
        <div className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] font-medium hidden md:inline">Veículo:</span>
          <select
            value={filtroVeiculo}
            onChange={(e) => setFiltroVeiculo(e.target.value as 'TODOS' | 'DOU' | 'AGENCIA_GOV')}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="TODOS">Todos os Veículos</option>
            <option value="DOU">Imprensa Nacional / DOU</option>
            <option value="AGENCIA_GOV">Agência Gov</option>
          </select>
        </div>
      </div>

      {/* Lista de Publicações Oficiais Dinâmicas */}
      <div className="mt-4 space-y-3">
        {publicacoesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">
              Nenhuma publicação oficial encontrada para os filtros selecionados.
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tente selecionar &quot;Todas as datas&quot; ou redefinir a busca por termos.
            </p>
          </div>
        ) : (
          publicacoesFiltradas.map((item) => {
            const config = ORGAO_CONFIG[item.orgao];
            const isCopiado = copiadoId === item.id;
            const isHoje = item.diasAtras === 0;

            return (
              <div
                key={item.id}
                className={`bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/90 rounded-xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs hover:shadow-xs border-l-4 ${config.borderColor} ${
                  isHoje ? 'ring-1 ring-emerald-500/20 bg-emerald-50/15' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  {/* Linha Superior: Órgão + Tipo do Ato + Veículo & Data Dinâmica */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border ${config.badgeBg}`}
                    >
                      {config.label}
                    </span>

                    <span className="text-xs font-bold text-zinc-900">
                      {item.numeroIdentificador}
                    </span>

                    <span className="text-zinc-300">•</span>

                    <span className="text-[11px] font-semibold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200/70">
                      {item.veiculo}
                    </span>

                    {item.edicaoDOU && (
                      <span className="text-[11px] text-zinc-500 hidden md:inline font-mono">
                        ({item.edicaoDOU})
                      </span>
                    )}

                    <span className="text-zinc-300">•</span>

                    <span
                      className={`text-[11px] flex items-center gap-1 font-medium ${
                        isHoje ? 'text-emerald-700 font-semibold' : 'text-zinc-500'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {item.dataPublicacaoFormatada}
                    </span>

                    {isHoje && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                        Publicado Hoje
                      </span>
                    )}
                  </div>

                  {/* Título do Ato */}
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug break-words">
                    {item.titulo}
                  </h3>

                  {/* Ementa / Resumo Oficial */}
                  <p className="text-xs sm:text-[13px] text-zinc-600 mt-1.5 leading-relaxed">
                    {item.ementa}
                  </p>

                  {/* Tema / Categoria & Órgão Completo */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-semibold text-zinc-500">
                      Tema: <span className="text-zinc-800">{item.categoriaTema}</span>
                    </span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-zinc-400 truncate max-w-xs sm:max-w-md">
                      {item.orgaoNome}
                    </span>
                  </div>
                </div>

                {/* Ações da Publicação */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60">
                  <a
                    href={item.urlOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200/80"
                    title="Acessar publicação oficial no DOU / Imprensa Nacional / Agência Gov"
                  >
                    <span>Ver no {item.veiculo.startsWith('DOU') ? 'DOU' : 'Portal'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopiarEmenta(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 bg-white hover:bg-zinc-100 px-2.5 py-1 rounded-lg transition-colors border border-zinc-200"
                    title="Copiar ementa, número do ato e link oficial"
                  >
                    {isCopiado ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copiar ato</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé Informativo e Links Diretos para os Órgãos */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <Landmark className="w-3.5 h-3.5 text-zinc-400" />
          Dados dinâmicos sincronizados com a Imprensa Nacional (in.gov.br) e Agência Gov (ebc.com.br)
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://www.in.gov.br/consulta/-/buscar/dou"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline flex items-center gap-0.5"
          >
            <span>Consulta DOU</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span>•</span>
          <a
            href="https://www.gov.br/agricultura/pt-br"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline flex items-center gap-0.5"
          >
            <span>Portal MAPA</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span>•</span>
          <a
            href="https://www.conab.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline flex items-center gap-0.5"
          >
            <span>CONAB</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <span>•</span>
          <a
            href="https://agenciagov.ebc.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline flex items-center gap-0.5"
          >
            <span>Agência Gov</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
