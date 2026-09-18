import React, { useState, useMemo } from 'react';
import {
  Scale,
  Building2,
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

export interface PublicacaoOficial {
  id: string;
  orgao: 'MAPA' | 'MDA' | 'CONAB' | 'MPA' | 'MDS' | 'BNDES' | 'BANCO_CENTRAL';
  orgaoNome: string;
  tipoAto: 'Portaria' | 'Resolução CMN' | 'Circular' | 'Instrução Normativa' | 'Edital' | 'Comunicado Oficial';
  numeroIdentificador: string;
  veiculo: 'DOU - Seção 1' | 'DOU - Seção 3' | 'Imprensa Nacional' | 'Agência Gov';
  dataPublicacao: string;
  edicaoDOU?: string;
  titulo: string;
  ementa: string;
  categoriaTema: string;
  urlOficial: string;
  destaque?: boolean;
}

const PUBLICACÕES_INICIAIS: PublicacaoOficial[] = [
  {
    id: 'pub-conab-1',
    orgao: 'CONAB',
    orgaoNome: 'Companhia Nacional de Abastecimento',
    tipoAto: 'Edital',
    numeroIdentificador: 'Aviso de Leilão Eletrônico CONAB nº 042/2026',
    veiculo: 'DOU - Seção 3',
    dataPublicacao: 'Hoje, 18/09/2026',
    edicaoDOU: 'Edição 179 • Seção 3 • Pág. 72',
    titulo: 'Leilão de Venda dos Estoques Públicos de Milho em Grãos para Criadores e Cooperativas Agropecuárias',
    ementa:
      'Oferta de 120 mil toneladas de milho em grãos vinculados aos estoques estratégicos do governo federal, com condições prioritárias de atendimento a avicultores, suinocultores e bacias leiteiras em Minas Gerais e Nordeste.',
    categoriaTema: 'Estoques Estratégicos & PGPM',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
    destaque: true,
  },
  {
    id: 'pub-1',
    orgao: 'MAPA',
    orgaoNome: 'Ministério da Agricultura e Pecuária',
    tipoAto: 'Portaria',
    numeroIdentificador: 'Portaria MAPA nº 782/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: 'Hoje, 18/09/2026',
    edicaoDOU: 'Edição 179 • Seção 1 • Pág. 18',
    titulo: 'Aprova o Zoneamento Agrícola de Risco Climático (ZARC) para Soja e Milho Safrinha em MG e SP',
    ementa:
      'Estabelece as janelas preferenciais de plantio e cultivares indicadas para mitigar perdas climáticas e garantir cobertura do Proagro e seguro rural na safra 2026/2027.',
    categoriaTema: 'Zoneamento & Seguro Rural',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
    destaque: true,
  },
  {
    id: 'pub-2',
    orgao: 'BANCO_CENTRAL',
    orgaoNome: 'Banco Central do Brasil / CMN',
    tipoAto: 'Resolução CMN',
    numeroIdentificador: 'Resolução CMN/BCB nº 5.184/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: 'Ontem, 17/09/2026',
    edicaoDOU: 'Edição 178 • Seção 1 • Pág. 34',
    titulo: 'Ajusta condições do Manual de Crédito Rural (MCR) para renegociação de operações de custeio agropecuário',
    ementa:
      'Autoriza instituições financeiras a repactuarem parcelas de operações de crédito rural de produtores afetados por intempéries climáticas e oscilações severas de custos de insumos.',
    categoriaTema: 'Crédito Rural & Finanças',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
    destaque: true,
  },
  {
    id: 'pub-3',
    orgao: 'MDA',
    orgaoNome: 'Ministério do Desenvolvimento Agrário e Agricultura Familiar',
    tipoAto: 'Portaria',
    numeroIdentificador: 'Portaria MDA nº 142/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: '16/09/2026',
    edicaoDOU: 'Edição 177 • Seção 1 • Pág. 12',
    titulo: 'Atualiza normas de emissão do CAF e expande limites do Pronaf Mulher e Pronaf Jovem',
    ementa:
      'Desburocratiza a comprovação de enquadramento da unidade familiar de produção agrária e eleva teto de financiamento para modernização produtiva e agregação de valor.',
    categoriaTema: 'Agricultura Familiar & Pronaf',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
  },
  {
    id: 'pub-4',
    orgao: 'BNDES',
    orgaoNome: 'BNDES Agronegócio',
    tipoAto: 'Edital',
    numeroIdentificador: 'Aviso BNDES Agro nº 08/2026',
    veiculo: 'DOU - Seção 3',
    dataPublicacao: '16/09/2026',
    edicaoDOU: 'Edição 177 • Seção 3 • Pág. 89',
    titulo: 'Aporte extraordinário de R$ 1,8 bilhão para as linhas Moderfrota, Inovagro e BNDES Crédito Rural',
    ementa:
      'Disponibiliza protocolo de novas contratações para aquisição de tratores, colheitadeiras, pivôs de irrigação e sistemas de energia fotovoltaica em cooperativas e propriedades rurais.',
    categoriaTema: 'Maquinário & Modernização',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
    destaque: true,
  },
  {
    id: 'pub-5',
    orgao: 'MDS',
    orgaoNome: 'Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome',
    tipoAto: 'Portaria',
    numeroIdentificador: 'Portaria Conjunta MDS/MDA nº 31/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: '15/09/2026',
    edicaoDOU: 'Edição 176 • Seção 1 • Pág. 26',
    titulo: 'Regulamenta chamada pública nacional do PAA na modalidade Compra com Doação Simultânea',
    ementa:
      'Destina recursos para compra direta de leite pasteurizado, queijos artesanais, hortaliças e grãos de agricultores familiares cadastrados para abastecimento de entidades socioassistenciais.',
    categoriaTema: 'PAA & Segurança Alimentar',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
  },
  {
    id: 'pub-6',
    orgao: 'MPA',
    orgaoNome: 'Ministério da Pesca e Aquicultura',
    tipoAto: 'Instrução Normativa',
    numeroIdentificador: 'Instrução Normativa MPA nº 19/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: '15/09/2026',
    edicaoDOU: 'Edição 176 • Seção 1 • Pág. 41',
    titulo: 'Fixa regras de ordenamento e simplificação do Registro Geral da Atividade Pesqueira (RGP)',
    ementa:
      'Moderniza os cadastros digitais de aquicultura em tanques-rede e viveiros escavados, assegurando acesso a linhas especiais de financiamento e seguro aquícola.',
    categoriaTema: 'Aquicultura & Pesca Artesanal',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
  },
  {
    id: 'pub-7',
    orgao: 'MAPA',
    orgaoNome: 'Ministério da Agricultura e Pecuária',
    tipoAto: 'Instrução Normativa',
    numeroIdentificador: 'Instrução Normativa SDA/MAPA nº 45/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: '14/09/2026',
    edicaoDOU: 'Edição 175 • Seção 1 • Pág. 15',
    titulo: 'Diretrizes sanitárias para trânsito interestadual de bovinos e controle de febre aftosa sem vacinação',
    ementa:
      'Dispõe sobre a Guia de Trânsito Animal (GTA eletrônica) e os protocolos de biosseguridade para rebanhos em zonas livres de febre aftosa sem vacinação reconhecidas pela OMSA.',
    categoriaTema: 'Defesa Agropecuária & GTA',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
  },
  {
    id: 'pub-8',
    orgao: 'BANCO_CENTRAL',
    orgaoNome: 'Banco Central do Brasil',
    tipoAto: 'Circular',
    numeroIdentificador: 'Circular BCB nº 4.112/2026',
    veiculo: 'DOU - Seção 1',
    dataPublicacao: '12/09/2026',
    edicaoDOU: 'Edição 174 • Seção 1 • Pág. 31',
    titulo: 'Simplificação de laudos periciais de comprovação de perdas no Proagro',
    ementa:
      'Padroniza o envio eletrônico de relatórios agronômicos e dados georreferenciados para agilizar o julgamento e pagamento de indenizações aos produtores participantes.',
    categoriaTema: 'Proagro & Laudos Técnicos',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
  },
  {
    id: 'pub-9',
    orgao: 'BNDES',
    orgaoNome: 'BNDES Agronegócio',
    tipoAto: 'Comunicado Oficial',
    numeroIdentificador: 'Comunicado BNDES / Agência Gov',
    veiculo: 'Agência Gov',
    dataPublicacao: 'Hoje, 18/09/2026 às 09:30',
    titulo: 'BNDES bate recorde de aprovação em créditos verdes para bioinsumos e conectividade rural',
    ementa:
      'Linhas voltadas a práticas sustentáveis e agricultura de precisão superam expectativas no trimestre, com condições facilitadas para pequenos e médios produtores.',
    categoriaTema: 'Bioinsumos & Sustentabilidade',
    urlOficial: 'https://agenciagov.ebc.com.br/',
  },
  {
    id: 'pub-conab-2',
    orgao: 'CONAB',
    orgaoNome: 'Companhia Nacional de Abastecimento',
    tipoAto: 'Comunicado Oficial',
    numeroIdentificador: 'Boletim Oficial CONAB / Agência Gov',
    veiculo: 'Agência Gov',
    dataPublicacao: '17/09/2026 às 10:00',
    titulo: '12º Levantamento da Safra de Grãos e Café: Produção nacional atinge patamar recorde com recuperação em MG',
    ementa:
      'Relatório técnico sobre produtividade por hectare, evolução de área plantada e estimativa consolidada de colheita para soja, milho e café arábica nas principais regiões produtoras do país.',
    categoriaTema: 'Estimativa de Safras & Grãos',
    urlOficial: 'https://agenciagov.ebc.com.br/',
  },
  {
    id: 'pub-conab-3',
    orgao: 'CONAB',
    orgaoNome: 'Companhia Nacional de Abastecimento',
    tipoAto: 'Edital',
    numeroIdentificador: 'Edital de Notificação CONAB/PGPM nº 15/2026',
    veiculo: 'DOU - Seção 3',
    dataPublicacao: '15/09/2026',
    edicaoDOU: 'Edição 176 • Seção 3 • Pág. 64',
    titulo: 'Abertura de Credenciamento para Aquisição de Leite em Pó e Queijos Artesanais no âmbito do PAA',
    ementa:
      'Convoca cooperativas de leite da agricultura familiar e laticínios regionais credenciados para fornecimento de lácteos voltados à formação de estoques e programas socioassistenciais.',
    categoriaTema: 'Leite & Compras Públicas PAA',
    urlOficial: 'https://www.in.gov.br/consulta/-/buscar/dou',
  },
];

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
  const [orgaoSelecionado, setOrgaoSelecionado] = useState<OrgaoOficial>('TODOS');
  const [filtroVeiculo, setFiltroVeiculo] = useState<'TODOS' | 'DOU' | 'AGENCIA_GOV'>('TODOS');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const handleCopiarEmenta = (item: PublicacaoOficial) => {
    const texto = `${item.numeroIdentificador} - ${item.titulo}\n${item.ementa}\nVeículo: ${item.veiculo} (${item.dataPublicacao})\nÓrgão: ${item.orgaoNome}`;
    navigator.clipboard.writeText(texto);
    setCopiadoId(item.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const publicacoesFiltradas = useMemo(() => {
    return PUBLICACÕES_INICIAIS.filter((pub) => {
      const matchOrgao =
        orgaoSelecionado === 'TODOS' || pub.orgao === orgaoSelecionado;

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

      return matchOrgao && matchVeiculo && matchBusca;
    });
  }, [orgaoSelecionado, filtroVeiculo, termoBusca]);

  // Contagem por órgão
  const contagemPorOrgao = useMemo(() => {
    const mapa: Record<string, number> = {
      TODOS: PUBLICACÕES_INICIAIS.length,
      MAPA: 0,
      MDA: 0,
      CONAB: 0,
      MPA: 0,
      MDS: 0,
      BNDES: 0,
      BANCO_CENTRAL: 0,
    };
    PUBLICACÕES_INICIAIS.forEach((p) => {
      mapa[p.orgao] = (mapa[p.orgao] || 0) + 1;
    });
    return mapa;
  }, []);

  return (
    <section className="mt-8 bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-6 overflow-hidden">
      {/* Cabeçalho do Bloco Oficial */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-800 shrink-0 border border-amber-200/60">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-2">
                Diário Oficial & Publicações Governamentais do Agro
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Fontes Oficiais
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            Atos normativos, leilões e portarias de MAPA, MDA, CONAB, MPA, MDS, BNDES Agro e Banco Central (DOU & Agência Gov)
          </p>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar por ato, Pronaf, ZARC, leilão, crédito..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Barra de Filtros por Órgãos e Veículo */}
      <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100">
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

      {/* Lista de Publicações Oficiais */}
      <div className="mt-4 space-y-3">
        {publicacoesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">
              Nenhuma publicação oficial encontrada para os filtros selecionados.
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tente redefinir a busca ou selecionar outro órgão ministerial.
            </p>
          </div>
        ) : (
          publicacoesFiltradas.map((item) => {
            const config = ORGAO_CONFIG[item.orgao];
            const isCopiado = copiadoId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/90 rounded-xl p-3.5 sm:p-4 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs hover:shadow-xs border-l-4 ${config.borderColor}`}
              >
                <div className="flex-1 min-w-0">
                  {/* Linha Superior: Órgão + Tipo do Ato + Veículo & Data */}
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

                    <span className="text-[11px] font-semibold text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200/70">
                      {item.veiculo}
                    </span>

                    {item.edicaoDOU && (
                      <span className="text-[11px] text-zinc-400 hidden md:inline">
                        ({item.edicaoDOU})
                      </span>
                    )}

                    <span className="text-zinc-300">•</span>

                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {item.dataPublicacao}
                    </span>
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
                      Tema: <span className="text-zinc-700">{item.categoriaTema}</span>
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
                    title="Copiar ementa e número do ato oficial"
                  >
                    {isCopiado ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-400" />
                        <span>Copiar ementa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé Informativo */}
      <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <Landmark className="w-3.5 h-3.5 text-zinc-400" />
          Dados sincronizados com a Imprensa Nacional (in.gov.br) e Agência Gov (ebc.com.br)
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://www.in.gov.br/consulta/-/buscar/dou"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline"
          >
            Consulta DOU
          </a>
          <span>•</span>
          <a
            href="https://agenciagov.ebc.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline"
          >
            Agência Gov
          </a>
        </div>
      </div>
    </section>
  );
};
