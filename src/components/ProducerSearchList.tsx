import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  AlertTriangle,
  Phone,
  MapPin,
  Trees,
  FileText,
  CheckCircle2,
  Calendar,
  Eye,
  Filter,
  ArrowRight,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { ProdutorRural, SolicitacaoServico } from '../types';
import {
  calcularEstatisticasProdutor,
  formatarTelefone,
  formatarCPF,
  normalizarTexto,
} from '../utils/storage';
import { exportarProdutoresCSV } from '../utils/exportCsv';
import { formatDriveDirectImageUrl, isPdfDocument } from '../utils/driveStorage';

interface ProducerSearchListProps {
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  onSelectProdutor: (produtor: ProdutorRural) => void;
  onOpenNovoProdutor: () => void;
  termoInicial?: string;
}

export const ProducerSearchList: React.FC<ProducerSearchListProps> = ({
  produtores,
  servicos,
  onSelectProdutor,
  onOpenNovoProdutor,
  termoInicial = '',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(termoInicial);
  const [somentePendentes, setSomentePendentes] = useState<boolean>(false);

  // Filtragem inteligente por Nome, Apelido, CPF ou Telefone (com suporte a buscas parciais)
  const correspondencias = useMemo(() => {
    const rawSearch = searchTerm.trim();
    const termoNorm = normalizarTexto(rawSearch);
    const termoNumeros = rawSearch.replace(/\D/g, ''); // apenas dígitos para CPF ou Telefone

    return produtores.filter((prod) => {
      // Filtro de pendência se ativado
      if (somentePendentes) {
        const stats = calcularEstatisticasProdutor(prod.id, servicos);
        if (!stats.temPendencia) return false;
      }

      if (!rawSearch) return true;

      // Correspondência por Nome Completo
      const matchNome = normalizarTexto(prod.nomeCompleto).includes(termoNorm);

      // Correspondência por Apelido
      const matchApelido = normalizarTexto(prod.apelido).includes(termoNorm);

      // Correspondência por ID
      const matchId = normalizarTexto(prod.id).includes(termoNorm);

      // Correspondência por CPF (texto normalizado ou apenas dígitos)
      const cpfLimpo = prod.cpf.replace(/\D/g, '');
      const matchCPF =
        normalizarTexto(prod.cpf).includes(termoNorm) ||
        (termoNumeros.length > 0 && cpfLimpo.includes(termoNumeros));

      // Correspondência por Telefone (texto normalizado ou apenas dígitos)
      const telLimpo = prod.telefone.replace(/\D/g, '');
      const matchTelefone =
        normalizarTexto(prod.telefone).includes(termoNorm) ||
        (termoNumeros.length > 0 && telLimpo.includes(termoNumeros));

      return matchNome || matchApelido || matchId || matchCPF || matchTelefone;
    });
  }, [produtores, searchTerm, somentePendentes, servicos]);

  const totalPendentes = useMemo(() => {
    return produtores.filter((p) => {
      const stats = calcularEstatisticasProdutor(p.id, servicos);
      return stats.temPendencia;
    }).length;
  }, [produtores, servicos]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Janela de Busca */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Busca de Produtores Rurais</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Busque por <span className="font-semibold text-zinc-700">CPF, Nome, Apelido ou Telefone</span> com busca em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportarProdutoresCSV(produtores, servicos)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
              title="Exportar lista de produtores para planilha Excel / Sheets (.CSV)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline">Exportar Planilha</span>
              <span className="sm:hidden">Planilha</span>
            </button>

            <button
              onClick={onOpenNovoProdutor}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
              title="Cadastrar Novo Produtor"
            >
              <UserPlus className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="hidden sm:inline">Novo Produtor</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Campo de Busca Rápida com Ícones de Limpeza */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <input
            id="input-busca-produtores"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite CPF, Nome, Apelido ou Telefone..."
            className="block w-full pl-10 pr-9 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-zinc-200 rounded-xl bg-zinc-50 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all font-medium"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 text-xs font-semibold"
              aria-label="Limpar busca"
            >
              ✕ Limpar
            </button>
          )}
        </div>

        {/* Barra de Filtros Adicionais e Estatísticas Rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-500">
              <strong className="text-zinc-900">{correspondencias.length}</strong> de {produtores.length} cadastrados
            </span>
            {searchTerm && (
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-medium text-[11px]">
                "{searchTerm}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSomentePendentes(!somentePendentes)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border font-medium text-xs transition-all ${
                somentePendentes
                  ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400 shadow-sm'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
              }`}
              title="Filtrar produtores com pendências financeiras"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${somentePendentes ? 'text-red-600' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">Com Pendências</span>
              <span className="sm:hidden">Pendentes</span>
              <span className="font-bold">({totalPendentes})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Correspondências */}
      {correspondencias.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-zinc-200 shadow-sm">
          <Search className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">Nenhuma correspondência encontrada</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1">
            Não encontramos nenhum produtor para o termo "{searchTerm}". Verifique se o CPF, Nome, Apelido ou Telefone estão corretos.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              Limpar Busca
            </button>
            <button
              onClick={onOpenNovoProdutor}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar Novo Produtor</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {correspondencias.map((produtor) => {
            const stats = calcularEstatisticasProdutor(produtor.id, servicos);

            return (
              <div
                key={produtor.id}
                onClick={() => onSelectProdutor(produtor)}
                className="bg-white rounded-xl border border-zinc-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Indicador de Pendência em Vermelho no topo se houver pendência */}
                {stats.temPendencia && (
                  <div className="bg-red-600 text-white text-xs font-extrabold px-3 py-1 -mx-5 -mt-5 mb-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                      <span>Produtor com pendências!</span>
                    </div>
                    <span className="text-[11px] font-medium bg-red-700/80 px-2 py-0.5 rounded">
                      Cobrança ou pagamento pendente
                    </span>
                  </div>
                )}

                <div>
                  {/* Topo do card: Foto do documento / Avatar, Nome, ID e Apelido */}
                  <div className="flex items-start gap-3.5">
                    {/* Miniatura do Documento ou Avatar */}
                    <div className="w-14 h-14 rounded-lg bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center relative shadow-inner group-hover:border-emerald-400 transition-colors">
                      {produtor.documentoFotoUrl && !produtor.documentoFotoUrl.startsWith('idb:') ? (
                        isPdfDocument(produtor.documentoFotoUrl) ? (
                          <div className="w-full h-full bg-red-50 text-red-600 flex flex-col items-center justify-center p-1">
                            <FileText className="w-6 h-6" />
                            <span className="text-[9px] font-black uppercase">PDF</span>
                          </div>
                        ) : (
                          <img
                            src={formatDriveDirectImageUrl(produtor.documentoFotoUrl)}
                            alt="Documento do Produtor"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )
                      ) : (
                        <FileText className="w-7 h-7 text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                          {produtor.id}
                        </span>
                        {produtor.apelido && (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            "{produtor.apelido}"
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-zinc-900 text-base leading-snug truncate mt-1 group-hover:text-emerald-700 transition-colors">
                        {produtor.nomeCompleto}
                      </h3>

                      {produtor.filiacoes && (
                        <p className="text-xs text-zinc-500 truncate">
                          Filiação: {produtor.filiacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Informações detalhadas de contato e propriedade */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 bg-zinc-50/80 p-3 rounded-lg border border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-500">CPF:</span>
                      <span className="font-mono text-zinc-800 font-medium">
                        {formatarCPF(produtor.cpf)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono text-zinc-800 font-medium">
                        {formatarTelefone(produtor.telefone)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 col-span-1 sm:col-span-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate" title={produtor.enderecoPropriedade}>
                        {produtor.enderecoPropriedade}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Trees className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Área Cultivada: <strong>{produtor.areaCultivada} ha</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        Serviços: <strong>{stats.totalSolicitados} total</strong>
                      </span>
                    </div>
                  </div>

                  {/* Resumo de Histórico de Serviços */}
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                    <div className="bg-blue-50/60 border border-blue-100 rounded-md py-1.5 px-1">
                      <span className="block font-bold text-blue-800 text-xs">{stats.totalSolicitados}</span>
                      <span className="text-blue-600 text-[10px]">Solicitados</span>
                    </div>
                    <div className="bg-teal-50/60 border border-teal-100 rounded-md py-1.5 px-1">
                      <span className="block font-bold text-teal-800 text-xs">{stats.realizados}</span>
                      <span className="text-teal-600 text-[10px]">Realizados</span>
                    </div>
                    <div className="bg-purple-50/60 border border-purple-100 rounded-md py-1.5 px-1">
                      <span className="block font-bold text-purple-800 text-xs">{stats.cobrancaEmitida}</span>
                      <span className="text-purple-600 text-[10px]">Cobrança</span>
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-md py-1.5 px-1">
                      <span className="block font-bold text-emerald-800 text-xs">{stats.pagos}</span>
                      <span className="text-emerald-600 text-[10px]">Pagos</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com Ação Direta */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">
                    Cadastrado em {produtor.dataCadastro}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProdutor(produtor);
                    }}
                    className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Ver Cadastro Completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
