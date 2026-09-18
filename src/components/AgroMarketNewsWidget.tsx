import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Mail,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign,
  Globe,
  Clock,
  Sparkles,
  ArrowUpRight,
  Send,
  Wheat,
  Beef,
  Coffee,
  Fuel,
  Percent,
  Milk,
  FlaskConical,
} from 'lucide-react';

export type FonteNoticia =
  | 'Todas'
  | 'Globo Rural'
  | 'Canal Rural'
  | 'The AgriBiz'
  | 'CNN Agronegócio'
  | 'Canal Agrícola';

interface NoticiaAgro {
  id: string;
  titulo: string;
  resumo: string;
  fonte: 'Globo Rural' | 'Canal Rural' | 'The AgriBiz' | 'CNN Agronegócio' | 'Canal Agrícola';
  categoria: 'Mercado' | 'Safra & Clima' | 'Crédito & Economia' | 'Pecuária' | 'Inovação';
  publicadoEm: string;
  urlOriginal: string;
  destaque?: boolean;
}

interface CommodityItem {
  id: string;
  nome: string;
  categoria: 'grãos' | 'pecuária' | 'fertilizantes' | 'energia_cambio';
  praca: string;
  unidade: string;
  precoAtual: number;
  variacao: number; // percentual
  maxima: number;
  minima: number;
  tendencia: 'alta' | 'baixa' | 'estavel';
}

const COMMODITIES_INICIAIS: CommodityItem[] = [
  {
    id: 'soja',
    nome: 'Soja',
    categoria: 'grãos',
    praca: 'Paranaguá / Cepea',
    unidade: 'sc 60kg',
    precoAtual: 139.8,
    variacao: 1.15,
    maxima: 140.5,
    minima: 138.2,
    tendencia: 'alta',
  },
  {
    id: 'milho',
    nome: 'Milho',
    categoria: 'grãos',
    praca: 'Campinas / B3',
    unidade: 'sc 60kg',
    precoAtual: 68.7,
    variacao: 0.85,
    maxima: 69.2,
    minima: 67.9,
    tendencia: 'alta',
  },
  {
    id: 'boi_gordo_sp',
    nome: 'Boi Gordo (SP)',
    categoria: 'pecuária',
    praca: 'São Paulo / Cepea B3',
    unidade: '@ à vista',
    precoAtual: 318.0,
    variacao: -0.35,
    maxima: 320.0,
    minima: 316.5,
    tendencia: 'baixa',
  },
  {
    id: 'boi_gordo_mg',
    nome: 'Boi Gordo (Triângulo MG)',
    categoria: 'pecuária',
    praca: 'Triângulo / Uberaba - Uberlândia',
    unidade: '@ à vista',
    precoAtual: 308.5,
    variacao: 0.45,
    maxima: 311.0,
    minima: 306.5,
    tendencia: 'alta',
  },
  {
    id: 'boi_gordo_zona_mata',
    nome: 'Boi Gordo (Zona da Mata MG)',
    categoria: 'pecuária',
    praca: 'Zona da Mata / Muriaé - Juiz de Fora',
    unidade: '@ à vista',
    precoAtual: 304.0,
    variacao: 0.35,
    maxima: 306.0,
    minima: 302.0,
    tendencia: 'alta',
  },
  {
    id: 'boi_gordo_vertentes',
    nome: 'Boi Gordo (Vertentes MG)',
    categoria: 'pecuária',
    praca: 'Campo das Vertentes / Barbacena',
    unidade: '@ à vista',
    precoAtual: 306.0,
    variacao: 0.5,
    maxima: 308.0,
    minima: 303.5,
    tendencia: 'alta',
  },
  {
    id: 'leite_mg',
    nome: 'Leite Produtor (Conseleite MG)',
    categoria: 'pecuária',
    praca: 'Média Minas Gerais',
    unidade: 'litro',
    precoAtual: 2.76,
    variacao: 1.25,
    maxima: 2.81,
    minima: 2.72,
    tendencia: 'alta',
  },
  {
    id: 'leite_zona_mata',
    nome: 'Leite (Zona da Mata MG)',
    categoria: 'pecuária',
    praca: 'Zona da Mata / Ponte Nova - Leopoldina',
    unidade: 'litro',
    precoAtual: 2.73,
    variacao: 1.15,
    maxima: 2.78,
    minima: 2.69,
    tendencia: 'alta',
  },
  {
    id: 'leite_vertentes',
    nome: 'Leite (Vertentes MG)',
    categoria: 'pecuária',
    praca: 'Campo das Vertentes / Barbacena',
    unidade: 'litro',
    precoAtual: 2.78,
    variacao: 1.45,
    maxima: 2.84,
    minima: 2.73,
    tendencia: 'alta',
  },
  {
    id: 'leite_spot',
    nome: 'Leite Spot (SP/MG)',
    categoria: 'pecuária',
    praca: 'Interfábricas SP/MG',
    unidade: 'litro',
    precoAtual: 3.05,
    variacao: 2.35,
    maxima: 3.12,
    minima: 2.98,
    tendencia: 'alta',
  },
  {
    id: 'leite_cepea',
    nome: 'Leite CEPEA (Média BR)',
    categoria: 'pecuária',
    praca: 'Média Brasil Líquida',
    unidade: 'litro',
    precoAtual: 2.84,
    variacao: 0.9,
    maxima: 2.88,
    minima: 2.8,
    tendencia: 'alta',
  },
  {
    id: 'cafe_arabica',
    nome: 'Café Arábica',
    categoria: 'grãos',
    praca: 'Sul de Minas / Cepea',
    unidade: 'sc 60kg',
    precoAtual: 1845.0,
    variacao: 2.1,
    maxima: 1860.0,
    minima: 1810.0,
    tendencia: 'alta',
  },
  {
    id: 'trigo',
    nome: 'Trigo',
    categoria: 'grãos',
    praca: 'Paraná / Deral',
    unidade: 'tonelada',
    precoAtual: 1420.0,
    variacao: 0.42,
    maxima: 1430.0,
    minima: 1410.0,
    tendencia: 'alta',
  },
  {
    id: 'algodao',
    nome: 'Algodão em Pluma',
    categoria: 'grãos',
    praca: 'Mato Grosso / Cepea',
    unidade: '@ à vista',
    precoAtual: 398.5,
    variacao: -0.15,
    maxima: 401.0,
    minima: 397.0,
    tendencia: 'baixa',
  },
  {
    id: 'fertilizante_ureia',
    nome: 'Ureia (46% N)',
    categoria: 'fertilizantes',
    praca: 'CFR Brasil / Porto Santos',
    unidade: 'tonelada',
    precoAtual: 2490.0,
    variacao: 1.45,
    maxima: 2520.0,
    minima: 2450.0,
    tendencia: 'alta',
  },
  {
    id: 'fertilizante_map',
    nome: 'MAP (11-52-00)',
    categoria: 'fertilizantes',
    praca: 'CFR Brasil / Porto Santos',
    unidade: 'tonelada',
    precoAtual: 3860.0,
    variacao: -0.75,
    maxima: 3900.0,
    minima: 3820.0,
    tendencia: 'baixa',
  },
  {
    id: 'fertilizante_kcl',
    nome: 'KCL Cloreto Potássio',
    categoria: 'fertilizantes',
    praca: 'CFR Paranaguá',
    unidade: 'tonelada',
    precoAtual: 2380.0,
    variacao: 0.85,
    maxima: 2410.0,
    minima: 2350.0,
    tendencia: 'alta',
  },
  {
    id: 'fertilizante_ssp',
    nome: 'Superfosfato Simples (SSP)',
    categoria: 'fertilizantes',
    praca: 'Paulínia / SP',
    unidade: 'tonelada',
    precoAtual: 1630.0,
    variacao: 0.3,
    maxima: 1650.0,
    minima: 1610.0,
    tendencia: 'alta',
  },
  {
    id: 'fertilizante_npk',
    nome: 'Formulado NPK 04-14-08',
    categoria: 'fertilizantes',
    praca: 'Mercado Spot / Sudeste',
    unidade: 'tonelada',
    precoAtual: 2750.0,
    variacao: 0.55,
    maxima: 2780.0,
    minima: 2720.0,
    tendencia: 'alta',
  },
  {
    id: 'etanol',
    nome: 'Etanol Hidratado',
    categoria: 'energia_cambio',
    praca: 'Paulínia / Cepea',
    unidade: 'litro',
    precoAtual: 2.45,
    variacao: 0.5,
    maxima: 2.48,
    minima: 2.42,
    tendencia: 'alta',
  },
  {
    id: 'dolar',
    nome: 'Dólar Comercial',
    categoria: 'energia_cambio',
    praca: 'Ptax / Banco Central',
    unidade: 'R$ / USD',
    precoAtual: 5.61,
    variacao: -0.42,
    maxima: 5.66,
    minima: 5.59,
    tendencia: 'baixa',
  },
];

const NOTICIAS_INICIAIS: NoticiaAgro[] = [
  {
    id: 'not-1',
    titulo: 'Exportações de soja atingem ritmo acelerado com prêmios firmes nos portos brasileiros',
    resumo:
      'A demanda externa segue aquecida nos terminais de Santos e Paranaguá. Compradores disputam lotes disponíveis para embarque antes da virada da safra americana.',
    fonte: 'Globo Rural',
    categoria: 'Mercado',
    publicadoEm: 'Há 25 min',
    urlOriginal: 'https://globorural.globo.com',
    destaque: true,
  },
  {
    id: 'not-2',
    titulo: 'Mapeamento aponta janela climática positiva para a dessecação e plantio da nova safra',
    resumo:
      'Modelos agroclimáticos indicam regularidade das precipitações no Centro-Oeste e Sudeste, favorecendo a umidade de solo e o manejo operacional das máquinas agrícolas.',
    fonte: 'Canal Rural',
    categoria: 'Safra & Clima',
    publicadoEm: 'Há 1 hora',
    urlOriginal: 'https://www.canalrural.com.br',
    destaque: true,
  },
  {
    id: 'not-3',
    titulo: 'Fundos agrícolas e Fiagros voltam a expandir captação com foco em revendas e insumos',
    resumo:
      'Análise detalhada do The AgriBiz revela o apetite dos investidores por títulos de crédito do agro (CRAs) atrelados ao financiamento direto a produtores rurais.',
    fonte: 'The AgriBiz',
    categoria: 'Crédito & Economia',
    publicadoEm: 'Há 2 horas',
    urlOriginal: 'https://theagribiz.com',
  },
  {
    id: 'not-4',
    titulo: 'Carne bovina brasileira ganha novas habilitações e consolida liderança global em 2026',
    resumo:
      'Abertura de novos mercados na Ásia e no Oriente Médio eleva a liquidez dos frigoríficos, mantendo sustentação firme para as cotações da arroba do boi gordo.',
    fonte: 'CNN Agronegócio',
    categoria: 'Pecuária',
    publicadoEm: 'Hoje às 10:15',
    urlOriginal: 'https://www.cnnbrasil.com.br/economia/agronegocio/',
  },
  {
    id: 'not-5',
    titulo: 'Manejo biológico do solo ganha força e reduz custos com adubação química em até 22%',
    resumo:
      'Experimentos a campo demonstram que o consórcio de bioinsumos com micronutrientes protege a microbiologia radicular e melhora a eficiência de absorção hídrica na lavoura.',
    fonte: 'Canal Agrícola',
    categoria: 'Inovação',
    publicadoEm: 'Hoje às 08:30',
    urlOriginal: 'https://www.canalagricola.com.br',
  },
  {
    id: 'not-6',
    titulo: 'Milho safrinha sustenta preços no mercado interno com demanda sólida de etanol e rações',
    resumo:
      'Mesmo após o encerramento da colheita, o consumo aquecido das indústrias de etanol de milho mantém a oferta enxuta nos principais polos de estocagem.',
    fonte: 'Canal Rural',
    categoria: 'Mercado',
    publicadoEm: 'Hoje às 07:45',
    urlOriginal: 'https://www.canalrural.com.br',
  },
  {
    id: 'not-7',
    titulo: 'Taxas de juros do crédito rural e novos limites para maquinários são liberados',
    resumo:
      'Governo e instituições financeiras anunciam equalização adicional de recursos para modernização da frota de tratores e implementos rurais de precisão.',
    fonte: 'Globo Rural',
    categoria: 'Crédito & Economia',
    publicadoEm: 'Ontem',
    urlOriginal: 'https://globorural.globo.com',
  },
  {
    id: 'not-8',
    titulo: 'Pecuária em MG: Boi gordo e leite avançam na Zona da Mata e Campo das Vertentes',
    resumo:
      'Escalas enxutas nos frigoríficos regionais sustentam a arroba em Juiz de Fora e Barbacena, enquanto cooperativas e laticínios aumentam bonificações por qualidade no leite captado nas bacias mineiras.',
    fonte: 'Canal Rural',
    categoria: 'Pecuária',
    publicadoEm: 'Há 25 min',
    urlOriginal: 'https://www.canalrural.com.br',
    destaque: true,
  },
  {
    id: 'not-9',
    titulo: 'Cotação de fertilizantes fosfatados e potássicos opera estável nos portos de Santos e Paranaguá',
    resumo:
      'Compradores aproveitam momentos de calmaria cambial para fechar pedidos de Ureia e MAP visando a dessecação e adubação de base da safra.',
    fonte: 'The AgriBiz',
    categoria: 'Mercado',
    publicadoEm: 'Hoje às 11:00',
    urlOriginal: 'https://theagribiz.com',
  },
];

const FONTE_CORES: Record<NoticiaAgro['fonte'], { bg: string; text: string; border: string }> = {
  'Globo Rural': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'Canal Rural': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  'The AgriBiz': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  'CNN Agronegócio': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  'Canal Agrícola': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
};

const STORAGE_KEY_NEWSLETTER = 'agrogestao_newsletter_email';

export const AgroMarketNewsWidget: React.FC = () => {
  const [commodities, setCommodities] = useState<CommodityItem[]>(COMMODITIES_INICIAIS);
  const [filtroCategoriaCommodity, setFiltroCategoriaCommodity] = useState<
    'todas' | 'grãos' | 'pecuária' | 'fertilizantes' | 'energia_cambio'
  >('todas');
  const [fonteSelecionada, setFonteSelecionada] = useState<FonteNoticia>('Todas');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [atualizandoCotacoes, setAtualizandoCotacoes] = useState<boolean>(false);
  const [ultimaAtualizacaoCotacoes, setUltimaAtualizacaoCotacoes] = useState<string>('Agora');

  // Newsletter
  const [newsletterInput, setNewsletterInput] = useState<string>('');
  const [newsletterInscrito, setNewsletterInscrito] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY_NEWSLETTER);
    } catch {
      return false;
    }
  });
  const [newsletterEmailSalvo, setNewsletterEmailSalvo] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_NEWSLETTER) || '';
    } catch {
      return '';
    }
  });
  const [newsletterSucesso, setNewsletterSucesso] = useState<boolean>(false);

  useEffect(() => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setUltimaAtualizacaoCotacoes(hora);
  }, []);

  // Simulação realista de atualização de cotações de fechamento/abertura
  const handleAtualizarCotacoes = () => {
    setAtualizandoCotacoes(true);
    setTimeout(() => {
      setCommodities((prev) =>
        prev.map((c) => {
          // Pequena flutuação aleatória de mercado (+/- 0.2%)
          const delta = (Math.random() * 0.4 - 0.2);
          const novoPreco = Math.round((c.precoAtual * (1 + delta / 100)) * 100) / 100;
          const novaVar = Math.round((c.variacao + delta) * 100) / 100;
          return {
            ...c,
            precoAtual: novoPreco,
            variacao: novaVar,
            tendencia: novaVar >= 0 ? 'alta' : 'baixa',
          };
        })
      );
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setUltimaAtualizacaoCotacoes(hora);
      setAtualizandoCotacoes(false);
    }, 600);
  };

  const handleInscreverNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterInput || !newsletterInput.includes('@')) {
      alert('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_NEWSLETTER, newsletterInput.trim());
      setNewsletterEmailSalvo(newsletterInput.trim());
      setNewsletterInscrito(true);
      setNewsletterSucesso(true);
      setNewsletterInput('');
      setTimeout(() => setNewsletterSucesso(false), 5000);
    } catch {
      setNewsletterInscrito(true);
    }
  };

  const handleCancelarInscricao = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_NEWSLETTER);
    } catch {}
    setNewsletterInscrito(false);
    setNewsletterEmailSalvo('');
  };

  // Filtragem de notícias
  const noticiasFiltradas = useMemo(() => {
    return NOTICIAS_INICIAIS.filter((noticia) => {
      const matchFonte =
        fonteSelecionada === 'Todas' || noticia.fonte === fonteSelecionada;
      const matchBusca =
        !termoBusca ||
        noticia.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
        noticia.resumo.toLowerCase().includes(termoBusca.toLowerCase()) ||
        noticia.categoria.toLowerCase().includes(termoBusca.toLowerCase());
      return matchFonte && matchBusca;
    });
  }, [fonteSelecionada, termoBusca]);

  // Filtragem de commodities
  const commoditiesFiltradas = useMemo(() => {
    if (filtroCategoriaCommodity === 'todas') return commodities;
    return commodities.filter((c) => c.categoria === filtroCategoriaCommodity);
  }, [commodities, filtroCategoriaCommodity]);

  const getCommodityIcon = (id: string) => {
    if (id.startsWith('boi_gordo')) {
      return <Beef className="w-4 h-4 text-rose-600" />;
    }
    if (id.startsWith('leite')) {
      return <Milk className="w-4 h-4 text-sky-600" />;
    }
    if (id.startsWith('fertilizante')) {
      return <FlaskConical className="w-4 h-4 text-emerald-600" />;
    }
    switch (id) {
      case 'soja':
      case 'trigo':
      case 'algodao':
      case 'milho':
        return <Wheat className="w-4 h-4 text-amber-600" />;
      case 'cafe_arabica':
        return <Coffee className="w-4 h-4 text-amber-900" />;
      case 'etanol':
        return <Fuel className="w-4 h-4 text-emerald-600" />;
      case 'dolar':
        return <DollarSign className="w-4 h-4 text-emerald-700" />;
      default:
        return <Percent className="w-4 h-4 text-zinc-600" />;
    }
  };

  const formatarValorCommodity = (item: CommodityItem) => {
    if (item.unidade === 'litro' || item.id === 'dolar') {
      return `R$ ${item.precoAtual.toFixed(2).replace('.', ',')}`;
    }
    if (item.precoAtual >= 1000) {
      return `R$ ${item.precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `R$ ${item.precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <section className="mt-8 space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. PAINEL DE COTAÇÕES DE COMMODITIES AGRO                    */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-6 overflow-hidden">
        {/* Cabeçalho do Bloco */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                Cotações de Commodities Agrícolas
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              Indicadores Cepea/Esalq, B3, Conseleite-MG • Atualizado às {ultimaAtualizacaoCotacoes}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filtro rápido por tipo de commodity com rolagem horizontal no mobile */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full scrollbar-none bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFiltroCategoriaCommodity('todas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroCategoriaCommodity === 'todas'
                    ? 'bg-white text-zinc-900 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoriaCommodity('grãos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroCategoriaCommodity === 'grãos'
                    ? 'bg-white text-zinc-900 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Grãos
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoriaCommodity('pecuária')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroCategoriaCommodity === 'pecuária'
                    ? 'bg-white text-zinc-900 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Pecuária & Leite
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoriaCommodity('fertilizantes')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroCategoriaCommodity === 'fertilizantes'
                    ? 'bg-white text-zinc-900 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Fertilizantes
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoriaCommodity('energia_cambio')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroCategoriaCommodity === 'energia_cambio'
                    ? 'bg-white text-zinc-900 shadow-xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Câmbio & Energia
              </button>
            </div>

            <button
              type="button"
              onClick={handleAtualizarCotacoes}
              disabled={atualizandoCotacoes}
              className="p-1.5 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-zinc-200 shrink-0"
              title="Atualizar cotações do mercado"
            >
              <RefreshCw className={`w-4 h-4 ${atualizandoCotacoes ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Grade Responsiva de Commodities: 1 col no mobile pequeno, 2 col em telas médias, 3 col em notebooks e 4 col em desktops largos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-4">
          {commoditiesFiltradas.map((item) => {
            const isPositiva = item.variacao >= 0;
            return (
              <div
                key={item.id}
                className="bg-zinc-50/70 hover:bg-zinc-50/95 border border-zinc-200/90 hover:border-zinc-300 rounded-xl p-3.5 sm:p-4 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div>
                  {/* Linha Superior: Ícone + Categoria + Badge de Variação */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="p-1.5 bg-white rounded-lg border border-zinc-200 shadow-2xs shrink-0">
                        {getCommodityIcon(item.id)}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-wider truncate">
                        {item.id.includes('zona_mata')
                          ? 'Zona da Mata'
                          : item.id.includes('vertentes')
                          ? 'Vertentes'
                          : item.id === 'boi_gordo_mg' || item.id === 'leite_mg'
                          ? 'Minas Gerais'
                          : item.categoria === 'energia_cambio'
                          ? 'Câmbio'
                          : item.categoria === 'fertilizantes'
                          ? 'Fertilizante'
                          : item.categoria}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isPositiva
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {isPositiva ? (
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-600" />
                      )}
                      {isPositiva ? `+${item.variacao.toFixed(2)}%` : `${item.variacao.toFixed(2)}%`}
                    </span>
                  </div>

                  {/* Nome da Cotação: Linha Própria com Quebra Limpa para não truncar nem sobrepor */}
                  <h4
                    className="font-bold text-sm sm:text-base text-zinc-900 mt-2.5 leading-snug break-words"
                    title={item.nome}
                  >
                    {item.nome}
                  </h4>

                  {/* Preço e Unidade */}
                  <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                      {formatarValorCommodity(item)}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      / {item.unidade}
                    </span>
                  </div>
                </div>

                {/* Rodapé com Praça e Limite Máximo Diário */}
                <div className="mt-3 pt-2.5 border-t border-zinc-200/80 flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span className="truncate font-medium text-zinc-600" title={item.praca}>
                    {item.praca}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-500 shrink-0 bg-white px-1.5 py-0.5 rounded border border-zinc-200/70">
                    Máx: {item.unidade === 'litro' ? `R$ ${item.maxima.toFixed(2).replace('.', ',')}` : item.maxima}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. NOTÍCIAS DO AGRONEGÓCIO & NEWSLETTER DIÁRIA                */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda/Principal: Feed de Notícias Especializadas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
                  <Newspaper className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  Notícias do Agronegócio
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cobertura oficial: Globo Rural, Canal Rural, The AgriBiz, CNN Agro e Canal Agrícola
              </p>
            </div>

            {/* Campo de Busca Rápida de Notícias */}
            <div className="relative min-w-[200px] sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar notícias..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Filtros por Fonte Solicitadas pelo Usuário */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {(
              [
                'Todas',
                'Globo Rural',
                'Canal Rural',
                'The AgriBiz',
                'CNN Agronegócio',
                'Canal Agrícola',
              ] as FonteNoticia[]
            ).map((fonte) => {
              const ativa = fonteSelecionada === fonte;
              return (
                <button
                  key={fonte}
                  type="button"
                  onClick={() => setFonteSelecionada(fonte)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    ativa
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {fonte}
                </button>
              );
            })}
          </div>

          {/* Lista de Notícias */}
          <div className="space-y-3 pt-1">
            {noticiasFiltradas.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                Nenhuma notícia encontrada com os filtros selecionados.
              </div>
            ) : (
              noticiasFiltradas.map((noticia) => {
                const estiloFonte = FONTE_CORES[noticia.fonte];
                return (
                  <article
                    key={noticia.id}
                    className="group p-3.5 sm:p-4 rounded-xl border border-zinc-200/90 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${estiloFonte.bg} ${estiloFonte.text} ${estiloFonte.border}`}
                          >
                            {noticia.fonte}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                            {noticia.categoria}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {noticia.publicadoEm}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-zinc-900 group-hover:text-emerald-800 transition-colors leading-snug">
                          {noticia.titulo}
                        </h3>

                        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                          {noticia.resumo}
                        </p>
                      </div>

                      <a
                        href={noticia.urlOriginal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-2 text-zinc-400 hover:text-emerald-700 hover:bg-emerald-100/50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                        title={`Abrir matéria original no portal ${noticia.fonte}`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna da Direita: Newsletter do Produtor & Resumo Executivo */}
        <div className="space-y-6">
          {/* Card de Newsletter Diária */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <Mail className="w-40 h-40" />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Boletim Matinal Agro
              </div>

              <h3 className="text-lg font-bold leading-tight">
                Newsletter Diária do Produtor
              </h3>

              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Receba toda manhã a abertura de mercado da B3 e CBOT, resumo de chuvas e as principais análises antes de ir para o campo.
              </p>

              {newsletterInscrito ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Inscrição Ativa!
                  </div>
                  <p className="text-[11px] text-emerald-200 truncate">
                    Destinatário: <span className="font-mono text-white font-bold">{newsletterEmailSalvo || 'Cadastrado'}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelarInscricao}
                    className="text-[10px] text-emerald-300 hover:text-white underline transition-colors"
                  >
                    Alterar e-mail ou cancelar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInscreverNewsletter} className="space-y-2 pt-1">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={newsletterInput}
                      onChange={(e) => setNewsletterInput(e.target.value)}
                      placeholder="Seu e-mail do campo..."
                      className="w-full pl-9 pr-3 py-2 bg-emerald-950/70 border border-emerald-600/60 rounded-xl text-xs text-white placeholder-emerald-300/60 focus:outline-hidden focus:border-white focus:ring-1 focus:ring-white transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Cadastrar Gratuitamente
                  </button>
                </form>
              )}

              {newsletterSucesso && (
                <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  E-mail cadastrado com sucesso!
                </div>
              )}
            </div>
          </div>

          {/* Resumo Executivo Rápido do Dia */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>Destaques Rápidos de Hoje</span>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-600">
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="font-bold text-zinc-900 block mb-0.5">
                  1. Janela de Plantio
                </span>
                Umidade favorável nos solos do PR e MS; produtores aceleram dessecação pré-plantio.
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="font-bold text-zinc-900 block mb-0.5">
                  2. Prêmios de Soja
                </span>
                Exportações em ritmo forte nos portos elevam os prêmios pagos ao produtor.
              </div>

              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <span className="font-bold text-zinc-900 block mb-0.5">
                  3. Insumos & Fertilizantes
                </span>
                Preços de fertilizantes fosfatados operam em estabilidade neste fechamento de semana.
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Fontes jornalísticas integradas</span>
              <span className="font-bold text-emerald-700">AgroGestão Rural</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
