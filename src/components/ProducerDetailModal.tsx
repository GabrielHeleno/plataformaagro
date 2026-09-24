import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Edit,
  PlusCircle,
  Phone,
  MapPin,
  ExternalLink,
  Trees,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Maximize2,
  Filter,
  DollarSign,
  ChevronRight,
  MessageCircle,
  Cloud,
  Trash2,
  Upload,
} from 'lucide-react';
import { ProdutorRural, SolicitacaoServico, StatusServico } from '../types';
import {
  calcularEstatisticasProdutor,
  formatarCPF,
  formatarTelefone,
  formatarMoeda,
  formatarDataBR,
  STATUS_CONFIG,
  LISTA_STATUS,
} from '../utils/storage';
import { getDocumentFile } from '../utils/documentStorage';
import {
  formatDriveDirectImageUrl,
  isPdfDocument,
  isGoogleDriveUrl,
  getDriveWebLink,
  getDrivePreviewEmbedUrl,
} from '../utils/driveStorage';
import { DocumentImage } from './DocumentImage';

interface ProducerDetailModalProps {
  produtor: ProdutorRural;
  servicos: SolicitacaoServico[];
  onClose: () => void;
  onEditProdutor: (produtor: ProdutorRural) => void;
  onRemoveFoto?: (produtorId: string) => void;
  onAddServico: (produtorId: string) => void;
  onEditServico: (servico: SolicitacaoServico) => void;
  onUpdateServicoStatus: (servicoId: string, novoStatus: StatusServico) => void;
}

export const ProducerDetailModal: React.FC<ProducerDetailModalProps> = ({
  produtor,
  servicos,
  onClose,
  onEditProdutor,
  onRemoveFoto,
  onAddServico,
  onEditServico,
  onUpdateServicoStatus,
}) => {
  const [fotoModalAberta, setFotoModalAberta] = useState<boolean>(false);
  const [copiadoGeo, setCopiadoGeo] = useState<boolean>(false);
  const [filtroStatusHist, setFiltroStatusHist] = useState<string>('todos');
  const [confirmandoExclusaoFoto, setConfirmandoExclusaoFoto] = useState<boolean>(false);
  const temFotoDireta =
    !!produtor.documentoFotoUrl &&
    !produtor.documentoFotoUrl.startsWith('idb:') &&
    produtor.documentoFotoUrl !== '[FOTO_ARMAZENADA_LOCAL]';

  const [resolvedFotoUrl, setResolvedFotoUrl] = useState<string>(
    temFotoDireta ? produtor.documentoFotoUrl : ''
  );

  useEffect(() => {
    if (
      produtor.documentoFotoUrl &&
      !produtor.documentoFotoUrl.startsWith('idb:') &&
      produtor.documentoFotoUrl !== '[FOTO_ARMAZENADA_LOCAL]'
    ) {
      setResolvedFotoUrl(produtor.documentoFotoUrl);
    } else if (
      produtor.documentoFotoUrl &&
      (produtor.documentoFotoUrl.startsWith('idb:') || produtor.documentoFotoUrl === '[FOTO_ARMAZENADA_LOCAL]')
    ) {
      getDocumentFile(produtor.id).then((saved) => {
        if (saved) setResolvedFotoUrl(saved);
        else setResolvedFotoUrl('');
      });
    } else {
      setResolvedFotoUrl('');
    }
  }, [produtor.id, produtor.documentoFotoUrl]);

  // Serviços deste produtor
  const servicosProdutor = servicos.filter((s) => s.produtorId === produtor.id);

  // Estatísticas exigidas
  const stats = calcularEstatisticasProdutor(produtor.id, servicos);

  // Filtragem no histórico
  const historicoFiltrado = servicosProdutor.filter((s) => {
    if (filtroStatusHist === 'todos') return true;
    return s.status === filtroStatusHist;
  });

  // Serviços pendentes para detalhar no alerta vermelho
  const servicosComPendencia = servicosProdutor.filter(
    (s) => s.status === 'sem pagamento confirmado' || s.status === 'cobrança realizada'
  );

  // Trata link ou coordenadas de geolocalização para abrir no Google Maps
  const getGoogleMapsUrl = (geo: string) => {
    if (!geo) return '#';
    if (geo.startsWith('http://') || geo.startsWith('https://')) {
      return geo;
    }
    // Assume coordenadas Lat, Long
    const cleanCoords = geo.replace(/\s+/g, '');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanCoords)}`;
  };

  const handleCopyGeo = () => {
    navigator.clipboard.writeText(produtor.geolocalizacao);
    setCopiadoGeo(true);
    setTimeout(() => setCopiadoGeo(false), 2000);
  };

  const cleanPhone = produtor.telefone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* AVISO EM VERMELHO EXIGIDO: "Produtor com pendências!" */}
        {stats.temPendencia && (
          <div
            id="aviso-produtor-com-pendencias"
            className="bg-red-600 text-white px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-inner border-b-2 border-red-700 animate-pulse"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="text-base font-extrabold tracking-wide uppercase">
                  Produtor com pendências!
                </div>
                <div className="text-xs text-red-100 font-medium">
                  Constam {servicosComPendencia.length} serviço(s) aguardando pagamento ou com cobrança emitida sem quitação confirmada.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs bg-red-800/80 px-3 py-1 rounded-full font-bold">
              <span>{stats.semPagamentoConfirmado} sem confirmação</span>
              <span>•</span>
              <span>{stats.cobrancaEmitida} faturado(s)</span>
            </div>
          </div>
        )}

        {/* Cabeçalho do Perfil / Modal */}
        <div className="px-5 py-4 sm:px-6 bg-zinc-50 border-b border-zinc-200 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-mono font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
              {produtor.id}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
                  {produtor.nomeCompleto}
                </h2>
                {produtor.apelido && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    "{produtor.apelido}"
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cadastro de Produtor Rural · Cadastrado em {formatarDataBR(produtor.dataCadastro)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
            title="Fechar Janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Ações Principais: OS DOIS BOTÕES EXIGIDOS PELO USUÁRIO */}
        <div className="px-5 py-3 sm:px-6 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-emerald-900">
            Ações Rápidas do Produtor:
          </span>

          <div className="flex items-center gap-2.5">
            {/* BOTÃO 1: Opção para editar as informações do cadastro */}
            <button
              id="btn-editar-cadastro-produtor"
              onClick={() => onEditProdutor(produtor)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg shadow-xs transition-all active:scale-95"
            >
              <Edit className="w-3.5 h-3.5 text-zinc-600" />
              <span>Editar Cadastro</span>
            </button>

            {/* BOTÃO 2: Opção para adicionar uma nova solicitação de serviço */}
            <button
              id="btn-adicionar-solicitacao-servico"
              onClick={() => onAddServico(produtor.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>Adicionar Solicitação de Serviço</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-zinc-800">
          
          {/* Painel de Resumo dos 4 Tipos de Histórico de Serviços Exigidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                Solicitados
              </span>
              <span className="text-2xl font-extrabold text-blue-900 mt-1 block">
                {stats.totalSolicitados}
              </span>
              <span className="text-[11px] text-blue-600">Total no histórico</span>
            </div>

            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">
                Realizados
              </span>
              <span className="text-2xl font-extrabold text-teal-900 mt-1 block">
                {stats.realizados}
              </span>
              <span className="text-[11px] text-teal-600">Serviços executados</span>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                Cobrança Emitida
              </span>
              <span className="text-2xl font-extrabold text-purple-900 mt-1 block">
                {stats.cobrancaEmitida}
              </span>
              <span className="text-[11px] text-purple-600">Faturados</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Pagos
              </span>
              <span className="text-2xl font-extrabold text-emerald-900 mt-1 block">
                {stats.pagos}
              </span>
              <span className="text-[11px] text-emerald-600">Quitação confirmada</span>
            </div>
          </div>

          {/* Dados do Cadastro Completo */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center justify-between">
              <span>Informações Cadastrais</span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {produtor.id}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Coluna 1 & 2: Dados Pessoais e Propriedade */}
              <div className="md:col-span-2 space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 font-semibold block">Nome Completo:</span>
                    <span className="text-sm font-bold text-zinc-900">{produtor.nomeCompleto}</span>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-semibold block">Apelido:</span>
                    <span className="text-sm font-medium text-emerald-800">
                      {produtor.apelido || '—'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 font-semibold block">CPF:</span>
                    <span className="font-mono text-sm font-semibold text-zinc-800">
                      {formatarCPF(produtor.cpf)}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-semibold block">Telefone para Contato:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-sm font-semibold text-zinc-800">
                        {formatarTelefone(produtor.telefone)}
                      </span>
                      {cleanPhone && (
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="p-1 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 font-semibold block">Filiações:</span>
                  <span className="text-zinc-800 font-medium">{produtor.filiacoes || 'Não informado'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 font-semibold block">Área Cultivada:</span>
                    <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <Trees className="w-4 h-4" />
                      {produtor.areaCultivada} hectares (ha)
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 font-semibold block">Geolocalização da Propriedade:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-zinc-800 truncate max-w-[170px]" title={produtor.geolocalizacao}>
                        {produtor.geolocalizacao || 'Não informada'}
                      </span>
                      {produtor.geolocalizacao && (
                        <>
                          <button
                            onClick={handleCopyGeo}
                            className="p-1 text-zinc-500 hover:text-zinc-800 rounded hover:bg-zinc-100"
                            title="Copiar coordenadas"
                          >
                            {copiadoGeo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={getGoogleMapsUrl(produtor.geolocalizacao)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 font-bold text-[11px] underline"
                            title="Abrir no Google Maps"
                          >
                            <span>Ver Mapa</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 font-semibold block">Endereço de Correspondência:</span>
                  <span className="text-zinc-700 font-medium">
                    {produtor.enderecoCorrespondencia || 'Mesmo da propriedade'}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 font-semibold block">Endereço da Propriedade Rural:</span>
                  <span className="text-zinc-800 font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {produtor.enderecoPropriedade}
                  </span>
                </div>

                {produtor.observacoes && (
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                    <span className="text-zinc-400 font-semibold block text-[11px]">Observações:</span>
                    <p className="text-zinc-700 mt-0.5 leading-relaxed">{produtor.observacoes}</p>
                  </div>
                )}
              </div>

              {/* Coluna 3: Imagem ou PDF da Cópia do Documento de Identidade */}
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cópia do Documento</span>
                    </span>
                    {resolvedFotoUrl && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFotoModalAberta(true)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>{isPdfDocument(resolvedFotoUrl) ? 'Abrir PDF' : 'Ampliar'}</span>
                        </button>
                        {onRemoveFoto && (
                          <button
                            onClick={() => setConfirmandoExclusaoFoto(true)}
                            className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-0.5"
                            title="Excluir cópia do documento deste produtor"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {confirmandoExclusaoFoto && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1.5 animate-in fade-in">
                      <p className="text-red-800 font-semibold">Excluir foto deste produtor?</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (onRemoveFoto) onRemoveFoto(produtor.id);
                            setResolvedFotoUrl('');
                            setConfirmandoExclusaoFoto(false);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                        >
                          Sim, excluir
                        </button>
                        <button
                          onClick={() => setConfirmandoExclusaoFoto(false)}
                          className="px-2 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded text-[10px] font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    onClick={() => resolvedFotoUrl && setFotoModalAberta(true)}
                    className="relative rounded-lg overflow-hidden border border-zinc-300 bg-white aspect-[4/3] flex items-center justify-center cursor-pointer group shadow-inner"
                  >
                    {resolvedFotoUrl ? (
                      isPdfDocument(resolvedFotoUrl) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-700 p-3 text-center transition-transform group-hover:scale-105">
                          <FileText className="w-10 h-10 text-red-600 mb-1" />
                          <span className="text-xs font-bold uppercase tracking-wider">Documento PDF</span>
                          <span className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" /> Clique para abrir
                          </span>
                        </div>
                      ) : (
                        <>
                          <DocumentImage
                            src={resolvedFotoUrl}
                            alt="Documento do Produtor"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-zinc-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1">
                            <Maximize2 className="w-4 h-4" />
                            <span>Clique para ampliar</span>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="text-center p-4 text-zinc-400 flex flex-col items-center justify-center">
                        <FileText className="w-8 h-8 mx-auto mb-1 text-zinc-300" />
                        <span className="text-xs text-zinc-500">Nenhum documento anexado</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProdutor(produtor);
                          }}
                          className="mt-2 text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Adicionar Foto / PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {resolvedFotoUrl && isGoogleDriveUrl(resolvedFotoUrl) ? (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Cloud className="w-3.5 h-3.5 text-blue-600" />
                        <span>Salvo no Google Drive</span>
                      </span>
                      <a
                        href={getDriveWebLink(resolvedFotoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5 hover:underline"
                        title="Abrir no Google Drive"
                      >
                        <span>Abrir Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="text-[10px] text-blue-700 block truncate font-mono bg-white/80 px-1.5 py-0.5 rounded border border-blue-100" title={getDriveWebLink(resolvedFotoUrl)}>
                      {getDriveWebLink(resolvedFotoUrl)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-zinc-500 text-center">
                    RG / CNH oficial do produtor
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico Completo de Todas as Solicitações e seus Status */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Histórico Completo de Solicitações de Serviços</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Acompanhamento de status desde o agendamento até a cobrança e quitação.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filtroStatusHist}
                  onChange={(e) => setFiltroStatusHist(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="todos">Todos os Status ({servicosProdutor.length})</option>
                  {LISTA_STATUS.map((st) => (
                    <option key={st} value={st}>
                      {STATUS_CONFIG[st].label} ({servicosProdutor.filter((s) => s.status === st).length})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => onAddServico(produtor.id)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nova Solicitação</span>
                </button>
              </div>
            </div>

            {historicoFiltrado.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-600">
                  Nenhuma solicitação de serviço encontrada com o filtro selecionado.
                </p>
                <button
                  onClick={() => onAddServico(produtor.id)}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                >
                  + Adicionar nova solicitação agora
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoFiltrado.map((srv) => {
                  const cfg = STATUS_CONFIG[srv.status];

                  return (
                    <div
                      key={srv.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 hover:border-emerald-400 bg-white transition-all space-y-2.5 shadow-xs"
                    >
                      {/* Linha Superior: ID, Data Prevista, Status e Ação */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                            {srv.id}
                          </span>
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            Data Prevista: {formatarDataBR(srv.dataPrevista)} {srv.horaPrevista && ` às ${srv.horaPrevista}`}
                          </span>
                        </div>

                        {/* Status Tag e Seletor Rápido de Alteração de Status */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} flex items-center gap-1.5`}
                          >
                            <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                            <span>{cfg.label}</span>
                          </span>

                          <select
                            value={srv.status}
                            onChange={(e) => onUpdateServicoStatus(srv.id, e.target.value as StatusServico)}
                            className="text-[11px] font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-md px-1.5 py-1 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                            title="Atualizar status da solicitação"
                          >
                            {LISTA_STATUS.map((st) => (
                              <option key={st} value={st}>
                                Mudar p/ {STATUS_CONFIG[st].label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => onEditServico(srv)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded"
                            title="Editar detalhes do serviço"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tipo de Serviço e Descrição Detalhada */}
                      <div>
                        <div className="text-sm font-bold text-zinc-900 flex items-center justify-between">
                          <span>{srv.tipoServico}</span>
                          <span className="text-xs font-mono font-semibold text-zinc-700">
                            {formatarMoeda(srv.valor)}
                          </span>
                        </div>
                        {srv.descricao && (
                          <p className="text-xs text-zinc-600 mt-1 leading-relaxed bg-zinc-50/60 p-2 rounded-lg border border-zinc-100">
                            {srv.descricao}
                          </p>
                        )}
                        {srv.tempoServico && (
                          <div className="mt-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>Tempo Realizado: <strong>{srv.tempoServico}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Observações da Solicitação */}
                      {srv.observacoes && (
                        <div className="text-[11px] text-zinc-500 flex items-start gap-1">
                          <span className="font-semibold text-zinc-600">Observações:</span>
                          <span>{srv.observacoes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Fechar */}
        <div className="px-5 py-3 sm:px-6 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>

      {/* Modal de Zoom da Imagem ou Visualizador de PDF do Documento */}
      {fotoModalAberta && resolvedFotoUrl && (
        <div
          onClick={() => setFotoModalAberta(false)}
          className="fixed inset-0 z-60 bg-zinc-950/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full bg-white rounded-xl p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-2 border-b border-zinc-200 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-sm text-zinc-800">
                  Documento de Identidade - {produtor.nomeCompleto}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {resolvedFotoUrl && (
                  <a
                    href={getDriveWebLink(resolvedFotoUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir em Nova Aba</span>
                  </a>
                )}
                <button
                  onClick={() => setFotoModalAberta(false)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isPdfDocument(resolvedFotoUrl) ? (
              <div className="w-full h-[75vh] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 flex flex-col">
                <iframe
                  src={getDrivePreviewEmbedUrl(resolvedFotoUrl)}
                  title="Documento PDF"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center max-h-[80vh] overflow-auto">
                <DocumentImage
                  src={resolvedFotoUrl}
                  alt="Cópia de documento em alta resolução"
                  className="w-full rounded-lg max-h-[75vh] object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
