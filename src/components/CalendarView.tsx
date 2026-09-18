import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  Layers,
  Tractor,
  FileSpreadsheet,
  Barcode,
  ExternalLink,
} from 'lucide-react';
import { ProdutorRural, SolicitacaoServico, StatusServico, TIPOS_SERVICOS_DISPONIVEIS } from '../types';
import {
  STATUS_CONFIG,
  LISTA_STATUS,
  verificarPendenciaProdutor,
  formatarDataBR,
  formatarMoeda,
  getHojeStr,
} from '../utils/storage';
import { exportarServicosCSV } from '../utils/exportCsv';
import { WeatherWidget } from './WeatherWidget';
import { AgroMarketNewsWidget } from './AgroMarketNewsWidget';
import { OfficialAgroGazetteWidget } from './OfficialAgroGazetteWidget';

interface CalendarViewProps {
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  onSelectProdutor: (produtor: ProdutorRural) => void;
  onSelectServico: (servico: SolicitacaoServico, produtor?: ProdutorRural) => void;
  onAddServico: (dataPrevia?: string) => void;
  onOpenReminders: () => void;
  onOpenFila?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  produtores,
  servicos,
  onSelectProdutor,
  onSelectServico,
  onAddServico,
  onOpenReminders,
  onOpenFila,
}) => {
  // Data de hoje dinâmica baseada no sistema do usuário
  const hojeStr = getHojeStr();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [tipoServicoFiltro, setTipoServicoFiltro] = useState<string>('todos');
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(() => getHojeStr());

  // Mapa rápido de produtores por ID
  const produtoresMap = useMemo(() => {
    const map = new Map<string, ProdutorRural>();
    produtores.forEach((p) => map.set(p.id, p));
    return map;
  }, [produtores]);

  // Navegação do mês
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleIrParaHoje = () => {
    setCurrentDate(new Date());
    setDiaSelecionado(getHojeStr());
  };

  // Montagem da grade do calendário
  const ano = currentDate.getFullYear();
  const mes = currentDate.getMonth();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasNoMesAnterior = new Date(ano, mes, 0).getDate();

  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate);
  const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

  // Filtragem dos serviços
  const servicosFiltrados = useMemo(() => {
    return servicos.filter((serv) => {
      // Filtro por status
      if (statusFiltro !== 'todos' && serv.status !== statusFiltro) {
        return false;
      }
      // Filtro por tipo de serviço
      if (tipoServicoFiltro !== 'todos' && serv.tipoServico !== tipoServicoFiltro) {
        return false;
      }
      // Filtro de texto (nome, apelido, serviço)
      if (filtroTexto.trim()) {
        const prod = produtoresMap.get(serv.produtorId);
        const search = filtroTexto.toLowerCase();
        const matchProd = prod && (
          prod.nomeCompleto.toLowerCase().includes(search) ||
          prod.apelido.toLowerCase().includes(search) ||
          prod.id.toLowerCase().includes(search)
        );
        const matchServ = serv.tipoServico.toLowerCase().includes(search) ||
          serv.id.toLowerCase().includes(search) ||
          serv.descricao.toLowerCase().includes(search);
        return matchProd || matchServ;
      }
      return true;
    });
  }, [servicos, statusFiltro, tipoServicoFiltro, filtroTexto, produtoresMap]);

  // Agrupa serviços filtrados por data "YYYY-MM-DD"
  const servicosPorData = useMemo(() => {
    const mapa = new Map<string, SolicitacaoServico[]>();
    servicosFiltrados.forEach((s) => {
      if (!mapa.has(s.dataPrevista)) {
        mapa.set(s.dataPrevista, []);
      }
      mapa.get(s.dataPrevista)!.push(s);
    });
    return mapa;
  }, [servicosFiltrados]);

  // Dias a exibir na grade (inclui dias do mês anterior e próximo para completar semanas)
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Dias do mês anterior
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const d = diasNoMesAnterior - i;
      const prevMes = mes === 0 ? 11 : mes - 1;
      const prevAno = mes === 0 ? ano - 1 : ano;
      const mesStr = String(prevMes + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${prevAno}-${mesStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= diasNoMes; d++) {
      const mesStr = String(mes + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${ano}-${mesStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Dias do próximo mês para completar 35 ou 42 células
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMes = mes === 11 ? 0 : mes + 1;
      const nextAno = mes === 11 ? ano + 1 : ano;
      const mesStr = String(nextMes + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${nextAno}-${mesStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [ano, mes, primeiroDiaSemana, diasNoMes, diasNoMesAnterior]);

  // Serviços do dia atualmente selecionado para o painel de detalhes inferior/lateral
  const servicosDoDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) return [];
    return servicosPorData.get(diaSelecionado) || [];
  }, [diaSelecionado, servicosPorData]);

  // Contagem de hoje
  const totalHoje = servicos.filter((s) => s.dataPrevista === hojeStr && s.status !== 'cancelada').length;
  // Contagem da fila de espera
  const totalNaFila = servicos.filter(
    (s) => s.status === 'na fila' || s.status === 'em espera' || !s.dataPrevista || s.dataPrevista.trim() === ''
  ).length;

  return (
    <div className="space-y-4">
      {/* Banner de Boas-vindas e Lembretes do Dia */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-300" />
            <h1 className="text-xl font-bold tracking-tight">Calendário de Serviços Agrícolas</h1>
            <span className="bg-emerald-700/80 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              Visão Mensal
            </span>
          </div>
          <p className="text-sm text-emerald-100/90 mt-1">
            Visualização direta dos serviços agendados por data com identificação do produtor, apelido e serviço solicitado.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
          {totalNaFila > 0 && onOpenFila && (
            <button
              onClick={onOpenFila}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 text-xs font-extrabold rounded-xl border border-amber-400/50 transition-all shadow-sm active:scale-95"
              title={`${totalNaFila} serviço(s) na Fila de Espera aguardando agendamento`}
            >
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">Fila de Espera</span>
              <span className="bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded-full text-[11px] font-black">
                {totalNaFila}
              </span>
            </button>
          )}

          <button
            onClick={() => exportarServicosCSV(servicos, produtores)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-emerald-950/60 hover:bg-emerald-950 text-white text-xs font-semibold rounded-xl border border-emerald-600/60 transition-all shadow-sm active:scale-95"
            title="Exportar todos os serviços para planilha Excel / Sheets (.CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="hidden sm:inline">Exportar Planilha</span>
            <span className="sm:hidden">Planilha</span>
          </button>

          <button
            onClick={onOpenReminders}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-emerald-950/60 hover:bg-emerald-950 text-white text-xs font-semibold rounded-xl border border-emerald-600/60 transition-all shadow-sm active:scale-95"
            title={`Lembretes Diários (${totalHoje} hoje)`}
          >
            <Bell className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Lembretes</span>
            <span className="bg-emerald-800/80 px-1.5 py-0.2 rounded-full text-[11px] font-bold text-emerald-200">
              {totalHoje}
            </span>
          </button>

          <a
            href="https://ib.sicoob.com.br/sicoobnet/ib/#/operador"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-emerald-950/70 hover:bg-emerald-950 text-emerald-100 text-xs font-bold rounded-xl border border-emerald-500/60 transition-all shadow-sm active:scale-95 hover:text-white"
            title="Acessar Sicoobnet para emissão de boletos de cobrança bancária"
          >
            <Barcode className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="hidden sm:inline">Sicoobnet (Boletos)</span>
            <span className="sm:hidden">Sicoobnet</span>
            <ExternalLink className="w-3 h-3 text-emerald-400/80 shrink-0" />
          </a>

          <button
            onClick={() => onAddServico(diaSelecionado || hojeStr)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow transition-all active:scale-95 border border-amber-400"
            title="Agendar Novo Serviço"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agendar</span>
          </button>
        </div>
      </div>

      {/* Barra de Controles: Navegação de Mês, Busca e Filtro de Status */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-zinc-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Navegação de Mês */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 sm:p-1 border border-zinc-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-zinc-700 transition-colors shadow-sm"
                title="Mês Anterior"
                aria-label="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="px-2 sm:px-3 py-1 font-bold text-zinc-800 text-sm sm:text-base min-w-[130px] sm:min-w-[170px] text-center">
                {nomeMesCapitalizado}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-zinc-700 transition-colors shadow-sm"
                title="Próximo Mês"
                aria-label="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <button
              onClick={handleIrParaHoje}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0"
              title="Ir para a data de hoje"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Hoje</span>
            </button>
          </div>

          {/* Busca Rápida no Calendário */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Filtrar produtor, serviço..."
              className="w-full pl-9 pr-7 py-1.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
            {filtroTexto && (
              <button
                onClick={() => setFiltroTexto('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
                aria-label="Limpar filtro"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filtros por Status e Tipo de Serviço - Mais Ícones e Mais Limpo */}
        <div className="border-t border-zinc-100 pt-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1 text-zinc-500 font-semibold shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Status:</span>
            </div>

            <button
              onClick={() => setStatusFiltro('todos')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                statusFiltro === 'todos'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos</span>
              <span className="text-[10px] opacity-75 font-mono">({servicos.length})</span>
            </button>

            {LISTA_STATUS.map((st) => {
              const config = STATUS_CONFIG[st];
              const isSelected = statusFiltro === st;
              const count = servicos.filter((s) => s.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFiltro(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? `${config.bg} ${config.text} ${config.border} ring-2 ring-emerald-500 font-bold shadow-sm`
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                  title={`Filtrar por ${config.label}`}
                >
                  <span className={`w-2 h-2 rounded-full ${config.dotColor} shrink-0`} />
                  <span>{config.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Filtro por Tipo de Serviço */}
          <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end pt-1 md:pt-0 border-t md:border-t-0 border-zinc-100">
            <Tractor className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-zinc-500 font-medium shrink-0">Serviço:</span>
            <select
              value={tipoServicoFiltro}
              onChange={(e) => setTipoServicoFiltro(e.target.value)}
              className="py-1 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[220px] truncate"
              title="Filtrar por tipo de serviço"
            >
              <option value="todos">Todos os serviços ({servicos.length})</option>
              {TIPOS_SERVICOS_DISPONIVEIS.map((t) => {
                const count = servicos.filter((s) => s.tipoServico === t).length;
                return (
                  <option key={t} value={t}>
                    {t} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {/* Dias da semana */}
        <div className="grid grid-cols-7 bg-zinc-100 border-b border-zinc-200 text-center text-xs font-bold text-zinc-700 py-2.5">
          <span className="text-red-600">DOM</span>
          <span>SEG</span>
          <span>TER</span>
          <span>QUA</span>
          <span>QUI</span>
          <span>SEX</span>
          <span className="text-emerald-700">SÁB</span>
        </div>

        {/* Células dos dias */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200">
          {calendarDays.map((day) => {
            const items = servicosPorData.get(day.dateStr) || [];
            const isToday = day.dateStr === hojeStr;
            const isSelected = diaSelecionado === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => setDiaSelecionado(day.dateStr)}
                className={`min-h-[125px] sm:min-h-[145px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between ${
                  !day.isCurrentMonth
                    ? 'bg-zinc-50/60 text-zinc-400'
                    : isToday
                    ? 'bg-emerald-50/40'
                    : isSelected
                    ? 'bg-amber-50/40 ring-1 ring-inset ring-amber-400'
                    : 'bg-white hover:bg-zinc-50/80'
                }`}
              >
                {/* Cabeçalho do dia */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-6 h-6 ${
                      isToday
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 font-extrabold'
                        : day.isCurrentMonth
                        ? 'text-zinc-800'
                        : 'text-zinc-400'
                    }`}
                  >
                    {day.dayNum}
                  </span>

                  {items.length > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-200">
                      {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
                    </span>
                  )}
                </div>

                {/* Lista de Serviços no Dia (Com ID, Nome Completo, Apelido e Serviço Solicitado) */}
                <div className="space-y-1.5 overflow-y-auto max-h-[110px] sm:max-h-[130px] pr-0.5">
                  {items.map((serv) => {
                    const prod = produtoresMap.get(serv.produtorId);
                    const statusCfg = STATUS_CONFIG[serv.status];
                    const temPendencia = prod ? verificarPendenciaProdutor(prod.id, servicos) : false;

                    return (
                      <div
                        key={serv.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectServico(serv, prod);
                        }}
                        className={`p-1.5 rounded-lg border text-left text-xs transition-all hover:shadow-md hover:scale-[1.01] ${
                          statusCfg.bg
                        } ${statusCfg.border}`}
                        title="Clique para ver detalhes do serviço e produtor"
                      >
                        {/* Topo do card: ID do Produtor/Serviço e Status */}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-mono font-bold text-[10px] text-zinc-700 bg-white/80 px-1 rounded border border-zinc-200">
                            {prod?.id || serv.produtorId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${statusCfg.border} ${statusCfg.text} bg-white/90 truncate max-w-[90px]`}
                          >
                            {statusCfg.label}
                          </span>
                        </div>

                        {/* Nome Completo do Produtor */}
                        <div className="font-semibold text-zinc-900 text-[11px] leading-tight truncate">
                          {prod?.nomeCompleto || 'Produtor não cadastrado'}
                        </div>

                        {/* Apelido do Produtor */}
                        {prod?.apelido && (
                          <div className="text-[10px] text-emerald-700 font-medium truncate">
                            "{prod.apelido}"
                          </div>
                        )}

                        {/* Serviço Solicitado */}
                        <div className="text-[11px] font-medium text-zinc-700 mt-1 flex items-center gap-1 bg-white/60 p-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate font-semibold">{serv.tipoServico}</span>
                        </div>

                        {/* Alerta se produtor tiver pendência */}
                        {temPendencia && (
                          <div className="mt-1 text-[9px] font-bold text-red-600 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 text-red-500 shrink-0" />
                            <span className="truncate">Pendência!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {items.length === 0 && day.isCurrentMonth && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddServico(day.dateStr);
                      }}
                      className="opacity-0 hover:opacity-100 text-center py-2 text-[11px] text-emerald-700 hover:bg-emerald-50/80 rounded border border-dashed border-emerald-300 transition-opacity"
                    >
                      + Agendar
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel do Dia Selecionado: Visão expandida dos agendamentos */}
      {diaSelecionado && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-zinc-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-zinc-900 text-base">
                  {diaSelecionado === hojeStr ? 'Agendamentos de Hoje' : `Agendamentos para ${formatarDataBR(diaSelecionado)}`}
                </h2>
                {diaSelecionado === hojeStr && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Hoje
                  </span>
                )}
                <span className="text-xs bg-zinc-100 text-zinc-700 font-medium px-2 py-0.5 rounded-full">
                  {servicosDoDiaSelecionado.length} {servicosDoDiaSelecionado.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Clique no agendamento para visualizar a ficha completa do produtor ou editar a solicitação.
              </p>
            </div>

            <button
              onClick={() => onAddServico(diaSelecionado)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Agendamento nesta Data</span>
            </button>
          </div>

          {servicosDoDiaSelecionado.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <CalendarIcon className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm font-medium">Nenhum serviço agendado para esta data.</p>
              <button
                onClick={() => onAddServico(diaSelecionado)}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
              >
                + Adicionar primeiro serviço do dia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {servicosDoDiaSelecionado.map((serv) => {
                const prod = produtoresMap.get(serv.produtorId);
                const statusCfg = STATUS_CONFIG[serv.status];
                const temPendencia = prod ? verificarPendenciaProdutor(prod.id, servicos) : false;

                return (
                  <div
                    key={serv.id}
                    onClick={() => onSelectServico(serv, prod)}
                    className="p-3.5 rounded-xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
                  >
                    <div>
                      {/* Topo com ID e Status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                          {prod?.id || serv.produtorId} · {serv.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Nome e Apelido */}
                      <div className="font-bold text-zinc-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {prod?.nomeCompleto || 'Produtor não localizado'}
                      </div>
                      {prod?.apelido && (
                        <div className="text-xs text-emerald-600 font-medium mb-1.5">
                          Apelido: <span className="font-bold">"{prod.apelido}"</span>
                        </div>
                      )}

                      {/* Serviço e Horário */}
                      <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100 text-xs space-y-1">
                        <div className="font-semibold text-zinc-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span>{serv.tipoServico}</span>
                        </div>
                        {serv.horaPrevista && (
                          <div className="text-zinc-500 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>Horário previsto: {serv.horaPrevista}</span>
                          </div>
                        )}
                        {serv.tempoServico && (
                          <div className="text-emerald-800 font-semibold flex items-center gap-1 text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                            <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Tempo Realizado: <strong>{serv.tempoServico}</strong></span>
                          </div>
                        )}
                        {serv.descricao && (
                          <p className="text-zinc-600 text-[11px] line-clamp-2 mt-1">
                            {serv.descricao}
                          </p>
                        )}
                      </div>

                      {/* Aviso de pendência se houver */}
                      {temPendencia && (
                        <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 text-xs text-red-700 font-bold">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Produtor com pendências!</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      {prod ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProdutor(prod);
                          }}
                          className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Ver Cadastro Completo →</span>
                        </button>
                      ) : (
                        <span className="text-zinc-400">Sem cadastro</span>
                      )}
                      <span className="text-zinc-700 font-bold font-mono text-xs">
                        {serv.valor !== undefined ? formatarMoeda(serv.valor) : 'A orçar'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Previsão do Tempo (5 Dias) com Ícones e Chuva Numérica (CPTEC / INPE & ClimaTempo) */}
      <WeatherWidget />

      {/* Bloco de Notícias, Newsletter e Cotações de Commodities do Mercado Agro */}
      <AgroMarketNewsWidget />

      {/* Bloco Separado: Publicações Oficiais no DOU, Imprensa Nacional e Agência Gov */}
      <OfficialAgroGazetteWidget />
    </div>
  );
};
