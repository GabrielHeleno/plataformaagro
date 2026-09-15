import React, { useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Filter,
  User,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ProdutorRural, SolicitacaoServico } from '../types';
import {
  PermissionStatus,
  requestNotificationPermission,
  dispararLembreteDiario,
  getNotificationPermission,
} from '../utils/notifications';
import { STATUS_CONFIG, LISTA_STATUS, verificarPendenciaProdutor, formatarDataBR } from '../utils/storage';

interface DailyRemindersModalProps {
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  onClose: () => void;
  onSelectProdutor: (produtor: ProdutorRural) => void;
  onSelectServico: (servico: SolicitacaoServico, produtor?: ProdutorRural) => void;
  pushStatus: PermissionStatus;
  onPushStatusChange: (status: PermissionStatus) => void;
}

export const DailyRemindersModal: React.FC<DailyRemindersModalProps> = ({
  produtores,
  servicos,
  onClose,
  onSelectProdutor,
  onSelectServico,
  pushStatus,
  onPushStatusChange,
}) => {
  const [dataAba, setDataAba] = useState<'hoje' | 'amanha'>('hoje');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [msgAlerta, setMsgAlerta] = useState<string | null>(null);

  const hojeStr = '2026-09-14';
  const amanhaStr = '2026-09-15';
  const dataAtiva = dataAba === 'hoje' ? hojeStr : amanhaStr;

  const produtoresMap = new Map<string, ProdutorRural>();
  produtores.forEach((p) => produtoresMap.set(p.id, p));

  const servicosDia = servicos.filter((s) => s.dataPrevista === dataAtiva);

  const servicosFiltrados = servicosDia.filter((s) => {
    if (filtroStatus === 'todos') return true;
    return s.status === filtroStatus;
  });

  const handleAtivarPush = async () => {
    const perm = await requestNotificationPermission();
    onPushStatusChange(perm);
    if (perm === 'granted') {
      const res = dispararLembreteDiario(servicos, produtores, hojeStr);
      setMsgAlerta(res.mensagem);
    } else if (perm === 'denied') {
      setMsgAlerta('As notificações foram bloqueadas no navegador.');
    }
  };

  const handleTestarPush = () => {
    const res = dispararLembreteDiario(servicos, produtores, hojeStr);
    setMsgAlerta(res.mensagem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-800/80 text-amber-300">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Lembretes Diários & Notificações Push</h2>
              <p className="text-xs text-emerald-200">
                Acompanhamento matinal e alertas de serviços programados para o dia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificações Push Banner de Configuração */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-500 ring-4 ring-emerald-100'
                    : pushStatus === 'denied'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-zinc-800 block">
                  Status das Notificações Push:{' '}
                  {pushStatus === 'granted'
                    ? 'Ativadas'
                    : pushStatus === 'denied'
                    ? 'Bloqueadas no Navegador'
                    : 'Aguardando Permissão'}
                </span>
                <span className="text-[11px] text-zinc-500">
                  Receba avisos automáticos dos agendamentos do dia na área de trabalho.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pushStatus !== 'granted' ? (
                <button
                  onClick={handleAtivarPush}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Ativar Notificações
                </button>
              ) : (
                <button
                  onClick={handleTestarPush}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  Disparar Lembrete Agora
                </button>
              )}
            </div>
          </div>

          {msgAlerta && (
            <div className="mt-2 text-xs bg-emerald-100 text-emerald-900 p-2 rounded-lg border border-emerald-300 font-medium flex items-center justify-between">
              <span>{msgAlerta}</span>
              <button onClick={() => setMsgAlerta(null)} className="text-emerald-700 font-bold">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Abas Hoje vs Amanhã */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDataAba('hoje')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                dataAba === 'hoje'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Hoje (14/09) · {servicos.filter((s) => s.dataPrevista === hojeStr).length}
            </button>
            <button
              onClick={() => setDataAba('amanha')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                dataAba === 'amanha'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Amanhã (15/09) · {servicos.filter((s) => s.dataPrevista === amanhaStr).length}
            </button>
          </div>

          <span className="text-xs font-medium text-zinc-500">
            {formatarDataBR(dataAtiva)}
          </span>
        </div>

        {/* Filtro por Status */}
        <div className="px-5 py-2 bg-zinc-50/70 border-b border-zinc-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-zinc-400 font-semibold shrink-0">Filtrar:</span>
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-2 py-0.5 rounded font-medium ${
              filtroStatus === 'todos'
                ? 'bg-zinc-800 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            Todos ({servicosDia.length})
          </button>
          {LISTA_STATUS.map((st) => {
            const count = servicosDia.filter((s) => s.status === st).length;
            if (count === 0 && filtroStatus !== st) return null;
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() => setFiltroStatus(st)}
                className={`px-2 py-0.5 rounded font-medium border flex items-center gap-1 shrink-0 ${
                  filtroStatus === st
                    ? `${cfg.bg} ${cfg.text} ${cfg.border} font-bold`
                    : 'bg-white text-zinc-600 border-zinc-200'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Lista de Agendamentos do Dia */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {servicosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <Calendar className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm font-medium text-zinc-600">
                Nenhum serviço agendado para {dataAba === 'hoje' ? 'hoje' : 'amanhã'}.
              </p>
            </div>
          ) : (
            servicosFiltrados.map((srv) => {
              const prod = produtoresMap.get(srv.produtorId);
              const cfg = STATUS_CONFIG[srv.status];
              const temPendencia = prod ? verificarPendenciaProdutor(prod.id, servicos) : false;

              return (
                <div
                  key={srv.id}
                  onClick={() => onSelectServico(srv, prod)}
                  className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-200">
                        {prod?.id || srv.produtorId} · {srv.id}
                      </span>
                      {srv.horaPrevista && (
                        <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{srv.horaPrevista}</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">
                      {prod?.nomeCompleto || 'Produtor Desconhecido'}
                      {prod?.apelido && (
                        <span className="text-emerald-700 font-semibold ml-1.5">
                          "{prod.apelido}"
                        </span>
                      )}
                    </h4>
                    <div className="text-xs font-semibold text-zinc-800 mt-0.5">
                      Serviço: <span className="text-emerald-800">{srv.tipoServico}</span>
                    </div>
                    {srv.descricao && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                        {srv.descricao}
                      </p>
                    )}
                  </div>

                  {temPendencia && (
                    <div className="p-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Produtor com pendências!</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    {prod ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProdutor(prod);
                        }}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Abrir ficha do produtor →
                      </button>
                    ) : (
                      <span />
                    )}
                    <span className="text-zinc-400 text-[11px]">Clique para gerenciar serviço</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
