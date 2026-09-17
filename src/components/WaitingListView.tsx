import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  User,
  Phone,
  Tractor,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  AlertTriangle,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  MessageCircle,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import { SolicitacaoServico, ProdutorRural, StatusServico, TIPOS_SERVICOS_DISPONIVEIS } from '../types';
import {
  STATUS_CONFIG,
  formatarDataBR,
  formatarMoeda,
  formatarTelefone,
  formatarCPF,
  verificarPendenciaProdutor,
  getHojeStr,
  getAmanhaStr,
} from '../utils/storage';

interface WaitingListViewProps {
  servicos: SolicitacaoServico[];
  produtores: ProdutorRural[];
  onEditServico: (servico: SolicitacaoServico) => void;
  onOpenServiceDetail: (servico: SolicitacaoServico, produtor?: ProdutorRural) => void;
  onOpenProdutor: (produtor: ProdutorRural) => void;
  onNewService: () => void;
  onSaveServico: (servico: SolicitacaoServico) => void;
  onDeleteServico?: (servicoId: string) => void;
}

type TipoOrdenacao =
  | 'nome-az'
  | 'nome-za'
  | 'endereco-az'
  | 'antigos-primeiro'
  | 'recentes-primeiro'
  | 'area-maior'
  | 'area-menor';

export const WaitingListView: React.FC<WaitingListViewProps> = ({
  servicos,
  produtores,
  onEditServico,
  onOpenServiceDetail,
  onOpenProdutor,
  onNewService,
  onSaveServico,
  onDeleteServico,
}) => {
  // Mapa de produtores por ID para consultas rápidas
  const produtoresMap = useMemo(() => {
    const map = new Map<string, ProdutorRural>();
    produtores.forEach((p) => map.set(p.id, p));
    return map;
  }, [produtores]);

  // Filtros
  const [busca, setBusca] = useState<string>('');
  const [filtroTipoServico, setFiltroTipoServico] = useState<string>('todos');
  const [filtroEndereco, setFiltroEndereco] = useState<string>('todos');
  const [filtroPendencia, setFiltroPendencia] = useState<'todos' | 'com-pendencia' | 'sem-pendencia'>('todos');
  const [ordenacao, setOrdenacao] = useState<TipoOrdenacao>('antigos-primeiro');
  const [modoAgrupadoPorEndereco, setModoAgrupadoPorEndereco] = useState<boolean>(false);

  // Estado para agendamento rápido inline (id do serviço sendo agendado)
  const [quickScheduleServicoId, setQuickScheduleServicoId] = useState<string | null>(null);
  const [quickData, setQuickData] = useState<string>(getHojeStr());
  const [quickHora, setQuickHora] = useState<string>('08:00');

  // Serviços que estão na fila de espera (status 'na fila', 'em espera' ou sem data definida)
  const todosServicosNaFila = useMemo(() => {
    return servicos.filter(
      (s) => s.status === 'na fila' || s.status === 'em espera' || !s.dataPrevista || s.dataPrevista.trim() === ''
    );
  }, [servicos]);

  // Lista única de endereços das propriedades dos produtores que estão na fila
  const enderecosDisponiveis = useMemo(() => {
    const setEnderecos = new Set<string>();
    todosServicosNaFila.forEach((s) => {
      const prod = produtoresMap.get(s.produtorId);
      if (prod?.enderecoPropriedade && prod.enderecoPropriedade.trim()) {
        setEnderecos.add(prod.enderecoPropriedade.trim());
      }
    });
    return Array.from(setEnderecos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [todosServicosNaFila, produtoresMap]);

  // Aplicação dos filtros
  const servicosFiltrados = useMemo(() => {
    return todosServicosNaFila.filter((s) => {
      const prod = produtoresMap.get(s.produtorId);

      // Filtro por tipo de serviço
      if (filtroTipoServico !== 'todos' && s.tipoServico !== filtroTipoServico) {
        return false;
      }

      // Filtro por endereço da propriedade
      if (filtroEndereco !== 'todos') {
        const end = prod?.enderecoPropriedade?.trim() || '';
        if (end !== filtroEndereco) return false;
      }

      // Filtro por pendência financeira
      if (filtroPendencia !== 'todos' && prod) {
        const temPendencia = verificarPendenciaProdutor(prod.id, servicos);
        if (filtroPendencia === 'com-pendencia' && !temPendencia) return false;
        if (filtroPendencia === 'sem-pendencia' && temPendencia) return false;
      }

      // Busca de texto
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const nomeProd = prod?.nomeCompleto?.toLowerCase() || '';
        const apelidoProd = prod?.apelido?.toLowerCase() || '';
        const cpfProd = prod?.cpf?.replace(/\D/g, '') || '';
        const telProd = prod?.telefone?.toLowerCase() || '';
        const endProp = prod?.enderecoPropriedade?.toLowerCase() || '';
        const endCorr = prod?.enderecoCorrespondencia?.toLowerCase() || '';
        const servId = s.id.toLowerCase();
        const tipo = s.tipoServico.toLowerCase();
        const desc = s.descricao.toLowerCase();
        const obs = (s.observacoes || '').toLowerCase();

        const match =
          nomeProd.includes(termo) ||
          apelidoProd.includes(termo) ||
          cpfProd.includes(termo.replace(/\D/g, '')) ||
          telProd.includes(termo) ||
          endProp.includes(termo) ||
          endCorr.includes(termo) ||
          servId.includes(termo) ||
          tipo.includes(termo) ||
          desc.includes(termo) ||
          obs.includes(termo);

        if (!match) return false;
      }

      return true;
    });
  }, [todosServicosNaFila, produtoresMap, filtroTipoServico, filtroEndereco, filtroPendencia, busca, servicos]);

  // Ordenação dos serviços
  const servicosOrdenados = useMemo(() => {
    const lista = [...servicosFiltrados];

    lista.sort((a, b) => {
      const prodA = produtoresMap.get(a.produtorId);
      const prodB = produtoresMap.get(b.produtorId);

      switch (ordenacao) {
        case 'nome-az': {
          const nomeA = prodA?.nomeCompleto || '';
          const nomeB = prodB?.nomeCompleto || '';
          return nomeA.localeCompare(nomeB, 'pt-BR');
        }
        case 'nome-za': {
          const nomeA = prodA?.nomeCompleto || '';
          const nomeB = prodB?.nomeCompleto || '';
          return nomeB.localeCompare(nomeA, 'pt-BR');
        }
        case 'endereco-az': {
          const endA = prodA?.enderecoPropriedade || '';
          const endB = prodB?.enderecoPropriedade || '';
          return endA.localeCompare(endB, 'pt-BR');
        }
        case 'antigos-primeiro': {
          // FIFO: quem solicitou antes fica no topo da fila
          const dataA = a.dataCriacao || '9999-99-99';
          const dataB = b.dataCriacao || '9999-99-99';
          return dataA.localeCompare(dataB);
        }
        case 'recentes-primeiro': {
          const dataA = a.dataCriacao || '';
          const dataB = b.dataCriacao || '';
          return dataB.localeCompare(dataA);
        }
        case 'area-maior': {
          const areaA = prodA?.areaCultivada || 0;
          const areaB = prodB?.areaCultivada || 0;
          return areaB - areaA;
        }
        case 'area-menor': {
          const areaA = prodA?.areaCultivada || 0;
          const areaB = prodB?.areaCultivada || 0;
          return areaA - areaB;
        }
        default:
          return 0;
      }
    });

    return lista;
  }, [servicosFiltrados, produtoresMap, ordenacao]);

  // Agrupamento por endereço da propriedade rural (quando ativado)
  const gruposPorEndereco = useMemo(() => {
    if (!modoAgrupadoPorEndereco) return [];

    const mapa = new Map<string, SolicitacaoServico[]>();
    servicosOrdenados.forEach((s) => {
      const prod = produtoresMap.get(s.produtorId);
      const end = prod?.enderecoPropriedade?.trim() || 'Endereço da Propriedade Não Informado';
      if (!mapa.has(end)) {
        mapa.set(end, []);
      }
      mapa.get(end)!.push(s);
    });

    return Array.from(mapa.entries()).map(([endereco, itens]) => ({
      endereco,
      itens,
    }));
  }, [modoAgrupadoPorEndereco, servicosOrdenados, produtoresMap]);

  // Executa o agendamento rápido
  const handleConfirmQuickSchedule = (servico: SolicitacaoServico) => {
    if (!quickData) return;
    const servicoAtualizado: SolicitacaoServico = {
      ...servico,
      dataPrevista: quickData,
      horaPrevista: quickHora || '08:00',
      status: 'agendada',
    };
    onSaveServico(servicoAtualizado);
    setQuickScheduleServicoId(null);
  };

  return (
    <div className="space-y-5 pb-20 sm:pb-12 max-w-7xl mx-auto">
      {/* Cabeçalho da Fila de Espera */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-zinc-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-amber-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-300">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Fila de Espera de Serviços
                <span className="text-xs sm:text-sm font-bold bg-amber-500 text-zinc-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  {todosServicosNaFila.length} na fila
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
                Produtores que solicitaram serviços da patrulha agrícola aguardando definição de data
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setModoAgrupadoPorEndereco(!modoAgrupadoPorEndereco)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border ${
              modoAgrupadoPorEndereco
                ? 'bg-amber-400 text-zinc-950 border-amber-300'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
            title="Agrupar serviços pelo endereço da propriedade rural"
          >
            <Layers className="w-4 h-4" />
            <span>{modoAgrupadoPorEndereco ? 'Modo Lista Simples' : 'Separar por Propriedade'}</span>
          </button>

          <button
            onClick={onNewService}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Solicitação</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Busca por texto */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por produtor, apelido, CPF, serviço ou endereço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* Ordenação */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as TipoOrdenacao)}
                className="w-full bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                title="Critério de ordenação"
              >
                <option value="antigos-primeiro">Ordem de Chegada (Mais antigos na fila)</option>
                <option value="recentes-primeiro">Solicitação Recente (Mais novos)</option>
                <option value="nome-az">Ordem Alfabética de Nome (A-Z)</option>
                <option value="nome-za">Ordem Alfabética de Nome (Z-A)</option>
                <option value="endereco-az">Endereço da Propriedade (A-Z)</option>
                <option value="area-maior">Área Cultivada (Maior para Menor)</option>
                <option value="area-menor">Área Cultivada (Menor para Maior)</option>
              </select>
            </div>
          </div>

          {/* Filtro por Endereço da Propriedade Rural */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <select
                value={filtroEndereco}
                onChange={(e) => setFiltroEndereco(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer truncate"
                title="Filtrar por endereço de propriedade rural"
              >
                <option value="todos">Todos os Endereços / Regiões ({enderecosDisponiveis.length})</option>
                {enderecosDisponiveis.map((end) => (
                  <option key={end} value={end}>
                    {end}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtro por Tipo de Serviço */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl">
              <Tractor className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                value={filtroTipoServico}
                onChange={(e) => setFiltroTipoServico(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer truncate"
              >
                <option value="todos">Todos os Tipos de Serviços</option>
                {TIPOS_SERVICOS_DISPONIVEIS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Linha auxiliar: Pendências e Contadores */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">Pendência Financeira:</span>
            <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50">
              <button
                type="button"
                onClick={() => setFiltroPendencia('todos')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                  filtroPendencia === 'todos'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroPendencia('sem-pendencia')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                  filtroPendencia === 'sem-pendencia'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Sem Pendências
              </button>
              <button
                type="button"
                onClick={() => setFiltroPendencia('com-pendencia')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                  filtroPendencia === 'com-pendencia'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Com Pendência
              </button>
            </div>
          </div>

          <div className="font-medium text-zinc-600">
            Exibindo <strong>{servicosOrdenados.length}</strong> de{' '}
            <strong>{todosServicosNaFila.length}</strong> solicitações na fila
          </div>
        </div>
      </div>

      {/* Lista Vazia */}
      {servicosOrdenados.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            {todosServicosNaFila.length === 0
              ? 'Nenhum serviço em espera no momento!'
              : 'Nenhum serviço encontrado para os filtros selecionados.'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {todosServicosNaFila.length === 0
              ? 'Todas as solicitações de serviços possuem datas definidas na agenda. Quando cadastrar um serviço sem data prevista ou marcar "Na Fila", ele aparecerá aqui.'
              : 'Tente limpar os filtros de texto, endereço ou tipo de serviço para visualizar as outras solicitações na fila.'}
          </p>
          <button
            onClick={onNewService}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Serviço na Fila</span>
          </button>
        </div>
      )}

      {/* Modo Agrupado por Endereço da Propriedade Rural */}
      {modoAgrupadoPorEndereco && gruposPorEndereco.length > 0 && (
        <div className="space-y-6">
          {gruposPorEndereco.map((grupo, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border-2 border-amber-200/80 shadow-xs overflow-hidden"
            >
              {/* Cabeçalho do Grupo de Endereço */}
              <div className="bg-amber-50/90 border-b border-amber-200 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="font-extrabold text-sm text-amber-950">
                    {grupo.endereco}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
                    {grupo.itens.length} {grupo.itens.length === 1 ? 'produtor/serviço' : 'produtores/serviços'}
                  </span>
                </div>
              </div>

              {/* Cards dentro do Grupo */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grupo.itens.map((servico) => {
                  const produtor = produtoresMap.get(servico.produtorId);
                  return (
                    <CardFilaServico
                      key={servico.id}
                      servico={servico}
                      produtor={produtor}
                      todosServicos={servicos}
                      isQuickScheduling={quickScheduleServicoId === servico.id}
                      quickData={quickData}
                      quickHora={quickHora}
                      onStartQuickSchedule={() => {
                        setQuickScheduleServicoId(servico.id);
                        setQuickData(getHojeStr());
                        setQuickHora('08:00');
                      }}
                      onCancelQuickSchedule={() => setQuickScheduleServicoId(null)}
                      onChangeQuickData={setQuickData}
                      onChangeQuickHora={setQuickHora}
                      onConfirmQuickSchedule={() => handleConfirmQuickSchedule(servico)}
                      onEditServico={() => onEditServico(servico)}
                      onOpenServiceDetail={() => onOpenServiceDetail(servico, produtor)}
                      onOpenProdutor={() => produtor && onOpenProdutor(produtor)}
                      onDeleteServico={onDeleteServico ? () => onDeleteServico(servico.id) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modo Lista Simples */}
      {!modoAgrupadoPorEndereco && servicosOrdenados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicosOrdenados.map((servico) => {
            const produtor = produtoresMap.get(servico.produtorId);
            return (
              <CardFilaServico
                key={servico.id}
                servico={servico}
                produtor={produtor}
                todosServicos={servicos}
                isQuickScheduling={quickScheduleServicoId === servico.id}
                quickData={quickData}
                quickHora={quickHora}
                onStartQuickSchedule={() => {
                  setQuickScheduleServicoId(servico.id);
                  setQuickData(getHojeStr());
                  setQuickHora('08:00');
                }}
                onCancelQuickSchedule={() => setQuickScheduleServicoId(null)}
                onChangeQuickData={setQuickData}
                onChangeQuickHora={setQuickHora}
                onConfirmQuickSchedule={() => handleConfirmQuickSchedule(servico)}
                onEditServico={() => onEditServico(servico)}
                onOpenServiceDetail={() => onOpenServiceDetail(servico, produtor)}
                onOpenProdutor={() => produtor && onOpenProdutor(produtor)}
                onDeleteServico={onDeleteServico ? () => onDeleteServico(servico.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CardFilaServicoProps {
  servico: SolicitacaoServico;
  produtor?: ProdutorRural;
  todosServicos: SolicitacaoServico[];
  isQuickScheduling: boolean;
  quickData: string;
  quickHora: string;
  onStartQuickSchedule: () => void;
  onCancelQuickSchedule: () => void;
  onChangeQuickData: (val: string) => void;
  onChangeQuickHora: (val: string) => void;
  onConfirmQuickSchedule: () => void;
  onEditServico: () => void;
  onOpenServiceDetail: () => void;
  onOpenProdutor: () => void;
  onDeleteServico?: () => void;
}

const CardFilaServico: React.FC<CardFilaServicoProps> = ({
  servico,
  produtor,
  todosServicos,
  isQuickScheduling,
  quickData,
  quickHora,
  onStartQuickSchedule,
  onCancelQuickSchedule,
  onChangeQuickData,
  onChangeQuickHora,
  onConfirmQuickSchedule,
  onEditServico,
  onOpenServiceDetail,
  onOpenProdutor,
  onDeleteServico,
}) => {
  const temPendencia = produtor ? verificarPendenciaProdutor(produtor.id, todosServicos) : false;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Topo do Card com Status e Data de Solicitação */}
        <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Na Fila de Espera
          </span>

          <span className="text-[11px] font-medium text-zinc-500">
            {servico.dataCriacao ? `Solicitado: ${formatarDataBR(servico.dataCriacao)}` : 'Aguardando data'}
          </span>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-4 space-y-3">
          {/* Identificação do Produtor */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={onOpenProdutor}
                className="text-left group-hover:text-amber-900 transition-colors"
              >
                <h4 className="font-extrabold text-sm text-zinc-900 leading-snug hover:underline flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{produtor?.nomeCompleto || 'Produtor não localizado'}</span>
                </h4>
                {produtor?.apelido && (
                  <p className="text-xs font-semibold text-emerald-700 ml-5">
                    "{produtor.apelido}"
                  </p>
                )}
              </button>

              <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
                {servico.id}
              </span>
            </div>

            {/* Tags e Pendências */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5 ml-5">
              {produtor?.cpf && (
                <span className="text-[11px] font-medium text-zinc-500">
                  CPF: {formatarCPF(produtor.cpf)}
                </span>
              )}
              {produtor?.areaCultivada !== undefined && (
                <span className="text-[10px] font-bold bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">
                  {produtor.areaCultivada} ha
                </span>
              )}
              {temPendencia && (
                <span className="text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Com Pendência
                </span>
              )}
            </div>
          </div>

          {/* Endereço da Propriedade Rural */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-2.5 text-xs space-y-1">
            <div className="flex items-start gap-1.5 text-amber-950 font-bold">
              <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>{produtor?.enderecoPropriedade || 'Propriedade sem endereço informado'}</span>
            </div>
            {produtor?.telefone && (
              <div className="flex items-center justify-between pt-1 border-t border-amber-200/40 text-[11px] text-zinc-600">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  {formatarTelefone(produtor.telefone)}
                </span>
                <a
                  href={`https://wa.me/55${produtor.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Dados do Serviço */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Tractor className="w-3 h-3 text-emerald-700" />
                {servico.tipoServico}
              </span>
              {servico.valor !== undefined && servico.valor > 0 && (
                <span className="font-extrabold text-zinc-900 text-xs">
                  {formatarMoeda(servico.valor)}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
              {servico.descricao}
            </p>
          </div>
        </div>
      </div>

      {/* Área de Agendamento Rápido ou Botões de Ação */}
      <div className="p-4 pt-0">
        {isQuickScheduling ? (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <CalendarPlus className="w-3.5 h-3.5 text-amber-700" />
                Definir Data para o Serviço:
              </span>
              <button
                type="button"
                onClick={onCancelQuickSchedule}
                className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">
                  Data Prevista:
                </label>
                <input
                  type="date"
                  value={quickData}
                  onChange={(e) => onChangeQuickData(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-bold border border-zinc-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">
                  Horário:
                </label>
                <input
                  type="time"
                  value={quickHora}
                  onChange={(e) => onChangeQuickHora(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-bold border border-zinc-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeQuickData(getHojeStr())}
                className="text-[10px] font-semibold text-emerald-700 hover:underline"
              >
                Hoje
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onChangeQuickData(getAmanhaStr())}
                className="text-[10px] font-semibold text-emerald-700 hover:underline"
              >
                Amanhã
              </button>
            </div>

            <button
              type="button"
              onClick={onConfirmQuickSchedule}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirmar e Agendar</span>
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
            <button
              type="button"
              onClick={onStartQuickSchedule}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
              title="Definir data para este serviço e agendar"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Definir Data</span>
            </button>

            <button
              type="button"
              onClick={onEditServico}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
              title="Editar todos os dados do serviço"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenServiceDetail}
              className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
              title="Ver detalhes completos do serviço"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {onDeleteServico && (
              <button
                type="button"
                onClick={onDeleteServico}
                className="p-2 bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl text-xs font-bold transition-colors"
                title="Excluir solicitação"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
