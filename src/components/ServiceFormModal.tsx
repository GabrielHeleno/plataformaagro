import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Tractor,
  User,
} from 'lucide-react';
import { SolicitacaoServico, StatusServico, ProdutorRural, TIPOS_SERVICOS_DISPONIVEIS } from '../types';
import { STATUS_CONFIG, LISTA_STATUS } from '../utils/storage';

interface ServiceFormModalProps {
  servicoInicial?: SolicitacaoServico | null;
  produtorIdFixo?: string;
  dataInicial?: string;
  produtores: ProdutorRural[];
  onSave: (servico: SolicitacaoServico) => void;
  onClose: () => void;
  proximoIdSugerido: string;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  servicoInicial,
  produtorIdFixo,
  dataInicial,
  produtores,
  onSave,
  onClose,
  proximoIdSugerido,
}) => {
  const isEditing = !!servicoInicial;

  const [id] = useState<string>(servicoInicial?.id || proximoIdSugerido);
  const [produtorId, setProdutorId] = useState<string>(
    servicoInicial?.produtorId || produtorIdFixo || (produtores[0]?.id || '')
  );
  const [dataPrevista, setDataPrevista] = useState<string>(
    servicoInicial?.dataPrevista || dataInicial || '2026-09-14'
  );
  const [horaPrevista, setHoraPrevista] = useState<string>(servicoInicial?.horaPrevista || '08:00');
  const [tipoServico, setTipoServico] = useState<string>(
    servicoInicial?.tipoServico || TIPOS_SERVICOS_DISPONIVEIS[0]
  );
  const [descricao, setDescricao] = useState<string>(servicoInicial?.descricao || '');
  const [status, setStatus] = useState<StatusServico>(servicoInicial?.status || 'agendada');
  const [tempoServico, setTempoServico] = useState<string>(servicoInicial?.tempoServico || '');
  const [dataConclusao, setDataConclusao] = useState<string>(
    servicoInicial?.dataConclusao || (servicoInicial?.dataPrevista || dataInicial || '2026-09-14')
  );
  const [observacoes, setObservacoes] = useState<string>(servicoInicial?.observacoes || '');
  const [valor, setValor] = useState<string>(
    servicoInicial?.valor !== undefined ? String(servicoInicial.valor) : ''
  );

  const [erro, setErro] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!produtorId) {
      setErro('Selecione o produtor rural associado.');
      return;
    }
    if (!dataPrevista) {
      setErro('Informe a data prevista para o serviço.');
      return;
    }
    if (!tipoServico.trim()) {
      setErro('Informe o tipo de serviço.');
      return;
    }
    if (!descricao.trim()) {
      setErro('Por favor, informe uma descrição detalhada do serviço.');
      return;
    }
    if (status === 'realizada' && !tempoServico.trim()) {
      setErro('Por favor, informe o tempo de serviço realizado.');
      return;
    }

    const valorTratado = valor !== '' ? parseFloat(valor.replace(',', '.')) : undefined;

    const servicoSalvar: SolicitacaoServico = {
      id,
      produtorId,
      dataPrevista,
      horaPrevista,
      tipoServico: tipoServico.trim(),
      descricao: descricao.trim(),
      status,
      observacoes: observacoes.trim(),
      valor: valorTratado !== undefined && !isNaN(valorTratado) ? valorTratado : undefined,
      tempoServico: status === 'realizada' || tempoServico.trim() ? tempoServico.trim() : undefined,
      dataCriacao: servicoInicial?.dataCriacao || new Date().toISOString().split('T')[0],
      dataConclusao: status === 'realizada' || status === 'pago' ? (dataConclusao || dataPrevista) : undefined,
    };

    onSave(servicoSalvar);
  };

  const produtorSelecionado = produtores.find((p) => p.id === produtorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tractor className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? 'Editar Solicitação de Serviço' : 'Nova Solicitação de Serviço'}
              </h2>
              <p className="text-xs text-emerald-200">
                Agendamento e especificações do serviço no campo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-700 px-5 py-2 text-xs font-semibold flex items-center gap-2 border-b border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Seleção do Produtor */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1">
              Produtor Rural <span className="text-red-500">*</span>
            </label>
            {produtorIdFixo ? (
              <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-800 mr-2 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {produtorSelecionado?.id}
                  </span>
                  <span className="font-bold text-zinc-900 text-sm">
                    {produtorSelecionado?.nomeCompleto}
                  </span>
                  {produtorSelecionado?.apelido && (
                    <span className="text-zinc-500 text-xs ml-1.5">
                      ("{produtorSelecionado.apelido}")
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-500">
                  {produtorSelecionado?.areaCultivada} ha
                </span>
              </div>
            ) : (
              <select
                value={produtorId}
                onChange={(e) => setProdutorId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {produtores.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.nomeCompleto} {p.apelido ? `("${p.apelido}")` : ''} - {p.areaCultivada} ha
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Data Prevista e Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Data Prevista <span className="text-red-500">*</span></span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDataPrevista('2026-09-14')}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Hoje (14/09)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setDataPrevista('2026-09-15')}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Amanhã (15/09)
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Horário Previsto</span>
              </label>
              <input
                type="time"
                value={horaPrevista}
                onChange={(e) => setHoraPrevista(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tipo de Serviço (16 Tipos Disponíveis para Seleção) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="tipo-servico-select" className="font-bold text-zinc-700 flex items-center gap-1.5 text-sm">
                <Tractor className="w-4 h-4 text-emerald-700" />
                <span>Tipo de Serviço <span className="text-red-500">*</span></span>
              </label>
              <span className="text-[11px] text-zinc-500 font-medium">
                16 serviços disponíveis
              </span>
            </div>

            <select
              id="tipo-servico-select"
              name="tipoServico"
              value={tipoServico}
              onChange={(e) => setTipoServico(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border-2 border-zinc-300 rounded-xl bg-zinc-50 text-zinc-900 font-semibold text-sm focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all cursor-pointer"
            >
              <option value="" disabled>Selecione um tipo de serviço...</option>
              {TIPOS_SERVICOS_DISPONIVEIS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              {tipoServico && !TIPOS_SERVICOS_DISPONIVEIS.includes(tipoServico as any) && (
                <option value={tipoServico}>{tipoServico} (anterior)</option>
              )}
            </select>

            {/* Dica rápida com resumo visual do serviço selecionado */}
            <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
              <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Selecionado: {tipoServico}
              </span>
            </p>
          </div>

          {/* Status da Solicitação Atual */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1">
              Status da Solicitação Atual <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LISTA_STATUS.map((st) => {
                const cfg = STATUS_CONFIG[st];
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-emerald-500 shadow-xs font-bold`
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dotColor} shrink-0`} />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloco Exclusivo quando o status for marcado como "Realizado" */}
          {status === 'realizada' && (
            <div className="bg-emerald-50/90 border-2 border-emerald-500/50 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-950 text-xs sm:text-sm">
                    Serviço Marcado como "Realizado" - Dados de Conclusão
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  Realizado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tempo de Serviço Realizado */}
                <div>
                  <label className="font-bold text-zinc-800 flex items-center justify-between mb-1 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Tempo de Serviço Realizado <span className="text-red-500">*</span></span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                      Obrigatório
                    </span>
                  </label>
                  <input
                    type="text"
                    value={tempoServico}
                    onChange={(e) => setTempoServico(e.target.value)}
                    placeholder="Ex: 2h 30min, 4 horas, 01:45..."
                    className="w-full px-3 py-2 border-2 border-emerald-400 rounded-lg text-zinc-900 font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                    required
                  />
                  {/* Atalhos rápidos de tempo para agilidade no campo */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-zinc-500 font-medium">Atalhos:</span>
                    {['30 min', '1 hora', '1h 30min', '2 horas', '3 horas', '4 horas', '5 horas'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTempoServico(t)}
                        className="text-[10px] bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data da Realização */}
                <div>
                  <label className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Data da Realização</span>
                  </label>
                  <input
                    type="date"
                    value={dataConclusao || dataPrevista}
                    onChange={(e) => setDataConclusao(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-zinc-900 font-medium bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Data em que a patrulha/trator efetuou o serviço.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Descrição Detalhada */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1">
              Descrição Detalhada do Serviço <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o talhão, maquinário a ser empregado, insumos necessários, instruções para o operador..."
              rows={3}
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Valor Estimado/Cobrado e Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={status === 'realizada' ? 'sm:col-span-1 border-2 border-emerald-400 bg-emerald-50/50 p-2.5 rounded-xl' : 'sm:col-span-1'}>
              <div className="flex items-center justify-between mb-1">
                <label className={`font-bold flex items-center gap-1 text-xs ${status === 'realizada' ? 'text-emerald-950' : 'text-zinc-700'}`}>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{status === 'realizada' ? 'Valor Realizado (R$)' : 'Valor (R$)'}</span>
                </label>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${status === 'realizada' ? 'bg-emerald-200 text-emerald-900' : 'text-zinc-400'}`}>
                  Livre (quebrados)
                </span>
              </div>
              <input
                type="number"
                step="any"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 4850.75"
                className={`w-full px-3 py-2 border rounded-lg text-zinc-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs ${
                  status === 'realizada'
                    ? 'border-2 border-emerald-500 bg-white shadow-xs'
                    : 'border-zinc-300'
                }`}
              />
              <p className={`text-[10px] mt-1 ${status === 'realizada' ? 'text-emerald-800 font-medium' : 'text-zinc-500'}`}>
                {status === 'realizada'
                  ? 'Permite editar livremente para qualquer valor quebrado após a realização.'
                  : 'Permite qualquer valor com centavos ou quebrados.'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-zinc-700 block mb-1 text-xs">
                Observações
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Condições climáticas, notas de cobrança, prazos..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isEditing ? 'Atualizar Solicitação' : 'Cadastrar Solicitação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
