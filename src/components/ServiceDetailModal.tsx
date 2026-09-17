import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { SolicitacaoServico, ProdutorRural, StatusServico } from '../types';
import {
  STATUS_CONFIG,
  LISTA_STATUS,
  formatarDataBR,
  formatarMoeda,
  verificarPendenciaProdutor,
} from '../utils/storage';

interface ServiceDetailModalProps {
  servico: SolicitacaoServico;
  produtor?: ProdutorRural;
  todosServicos: SolicitacaoServico[];
  onClose: () => void;
  onOpenProdutor: (produtor: ProdutorRural) => void;
  onEditServico: (servico: SolicitacaoServico) => void;
  onUpdateStatus: (
    servicoId: string,
    novoStatus: StatusServico,
    extras?: { tempoServico?: string; valor?: number; dataConclusao?: string }
  ) => void;
  onDeleteServico?: (servicoId: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  servico,
  produtor,
  todosServicos,
  onClose,
  onOpenProdutor,
  onEditServico,
  onUpdateStatus,
  onDeleteServico,
}) => {
  const statusCfg = STATUS_CONFIG[servico.status];
  const temPendencia = produtor ? verificarPendenciaProdutor(produtor.id, todosServicos) : false;

  const [modoRealizado, setModoRealizado] = React.useState<boolean>(false);
  const [tempoInput, setTempoInput] = React.useState<string>(servico.tempoServico || '');
  const [valorInput, setValorInput] = React.useState<string>(
    servico.valor !== undefined ? String(servico.valor) : ''
  );

  const handleSalvarConclusao = (e: React.FormEvent) => {
    e.preventDefault();
    const valNumerico = valorInput !== '' ? parseFloat(valorInput.replace(',', '.')) : undefined;
    onUpdateStatus(servico.id, 'realizada', {
      tempoServico: tempoInput.trim() || undefined,
      valor: valNumerico !== undefined && !isNaN(valNumerico) ? valNumerico : undefined,
    });
    setModoRealizado(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Alerta de Pendência se houver */}
        {temPendencia && (
          <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            <span>Produtor com pendências financeiras neste ou em outros serviços!</span>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
              {servico.id}
            </span>
            <h3 className="font-bold text-zinc-900 text-base">Detalhes do Agendamento</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          
          {/* Informações do Produtor */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Produtor Rural
              </span>
              {produtor && (
                <button
                  onClick={() => onOpenProdutor(produtor)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Abrir Cadastro Completo</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {produtor ? (
              <div>
                <div className="font-bold text-zinc-900 text-sm">
                  {produtor.nomeCompleto}
                </div>
                {produtor.apelido && (
                  <div className="text-xs font-semibold text-emerald-700">
                    Apelido: "{produtor.apelido}"
                  </div>
                )}
                <div className="text-[11px] text-zinc-500 mt-1 flex flex-wrap gap-x-3">
                  <span>ID: <strong>{produtor.id}</strong></span>
                  <span>CPF: <strong>{produtor.cpf}</strong></span>
                  <span>Tel: <strong>{produtor.telefone}</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500">Produtor com ID {servico.produtorId}</div>
            )}
          </div>

          {/* Dados do Serviço */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-semibold block">Serviço Solicitado:</span>
                <span className="text-sm font-bold text-zinc-900">{servico.tipoServico}</span>
              </div>

              <div className="text-right">
                <span className="text-zinc-400 font-semibold block">Status Atual:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                  {statusCfg.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              <div className="flex items-center gap-1.5 text-zinc-700">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span>Data: <strong>{formatarDataBR(servico.dataPrevista)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-700">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>Horário: <strong>{servico.horaPrevista || 'A definir'}</strong></span>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 font-semibold block mb-1">Descrição Detalhada:</span>
              <p className="text-zinc-800 leading-relaxed bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 whitespace-pre-line">
                {servico.descricao || 'Sem descrição cadastrada.'}
              </p>
            </div>

            {/* Tempo de Serviço Realizado e Conclusão */}
            {servico.tempoServico && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Tempo de Serviço Realizado:</span>
                </div>
                <span className="bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded text-xs">
                  {servico.tempoServico}
                </span>
              </div>
            )}

            {servico.dataConclusao && (
              <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                <span>Data Efetiva de Conclusão:</span>
                <span className="font-bold text-zinc-900">{formatarDataBR(servico.dataConclusao)}</span>
              </div>
            )}

            {servico.observacoes && (
              <div>
                <span className="text-zinc-400 font-semibold block mb-1">Observações:</span>
                <p className="text-zinc-600 bg-zinc-50/70 p-2 rounded-lg border border-zinc-100">
                  {servico.observacoes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <span className="text-zinc-500 font-semibold">Valor Registrado:</span>
              <span className="text-sm font-mono font-bold text-zinc-900">
                {formatarMoeda(servico.valor)}
              </span>
            </div>

            {/* Painel Condicional para quando marca como "Realizada" */}
            {modoRealizado && (
              <form
                onSubmit={handleSalvarConclusao}
                className="bg-emerald-50/90 border-2 border-emerald-500 rounded-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Concluir Serviço como "Realizado"</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModoRealizado(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-800 block mb-1">
                      Tempo de Serviço Realizado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tempoInput}
                      onChange={(e) => setTempoInput(e.target.value)}
                      placeholder="Ex: 2h 30min, 4 horas"
                      required
                      className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-800 block mb-1">
                      Valor Final (R$) - Livre
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={valorInput}
                      onChange={(e) => setValorInput(e.target.value)}
                      placeholder="0,00 (qualquer valor)"
                      className="w-full px-2.5 py-1.5 border border-emerald-400 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setModoRealizado(false)}
                    className="px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-200/50 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirmar Realização</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mudar Status Rapidamente */}
            <div className="pt-2 border-t border-zinc-100">
              <label className="text-zinc-600 font-bold block mb-1.5 text-xs">
                Atualizar Status do Serviço:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {LISTA_STATUS.map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const isCurrent = servico.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        if (st === 'realizada') {
                          setModoRealizado(true);
                        } else {
                          setModoRealizado(false);
                          onUpdateStatus(servico.id, st);
                        }
                      }}
                      className={`p-1.5 rounded-md border text-[11px] font-semibold transition-all ${
                        isCurrent
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-emerald-500 font-bold`
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div>
            {onDeleteServico && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta solicitação de serviço?')) {
                    onDeleteServico(servico.id);
                    onClose();
                  }
                }}
                className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditServico(servico)}
              className="px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5 text-zinc-500" />
              <span>Editar Solicitação</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
