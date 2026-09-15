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
import { SolicitacaoServico, StatusServico, ProdutorRural } from '../types';
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

const TIPOS_SERVICOS_COMUNS = [
  'Preparo de Solo e Gradagem',
  'Plantio Mecanizado',
  'Pulverização e Aplicação de Defensivos',
  'Adubação e Calagem de Solo',
  'Colheita Mecanizada',
  'Análise de Solo e Vistoria Agronômica',
  'Manutenção de Maquinário Agrícola',
  'Poda e Manejo Fitossanitário',
  'Transporte e Frete de Safra',
  'Manejo de Pastagem e Silagem',
  'Outro Serviço Agrícola',
];

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
    servicoInicial?.tipoServico || TIPOS_SERVICOS_COMUNS[0]
  );
  const [descricao, setDescricao] = useState<string>(servicoInicial?.descricao || '');
  const [status, setStatus] = useState<StatusServico>(servicoInicial?.status || 'agendada');
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

    const servicoSalvar: SolicitacaoServico = {
      id,
      produtorId,
      dataPrevista,
      horaPrevista,
      tipoServico: tipoServico.trim(),
      descricao: descricao.trim(),
      status,
      observacoes: observacoes.trim(),
      valor: valor ? parseFloat(valor) : undefined,
      dataCriacao: servicoInicial?.dataCriacao || new Date().toISOString().split('T')[0],
      dataConclusao: status === 'realizada' || status === 'pago' ? (servicoInicial?.dataConclusao || dataPrevista) : undefined,
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

          {/* Tipo de Serviço */}
          <div>
            <label className="font-bold text-zinc-700 block mb-1">
              Tipo de Serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="sugestoes-servicos"
              value={tipoServico}
              onChange={(e) => setTipoServico(e.target.value)}
              placeholder="Ex: Pulverização, Colheita, Plantio, Preparo..."
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <datalist id="sugestoes-servicos">
              {TIPOS_SERVICOS_COMUNS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
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
            <div>
              <label className="font-bold text-zinc-700 flex items-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                <span>Valor (R$)</span>
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 4800"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-zinc-700 block mb-1">
                Observações
              </label>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Condições climáticas, notas de cobrança, prazos..."
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
