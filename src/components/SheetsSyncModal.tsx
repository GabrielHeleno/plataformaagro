import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  Check,
  Zap,
  Info,
  Unlink,
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  getStoredSheetsUrl,
  saveStoredSheetsUrl,
  getStoredAutoSync,
  saveStoredAutoSync,
  getStoredLastSync,
  fetchFromGoogleSheets,
  sendToGoogleSheets,
} from '../utils/sheetsSync';
import { ProdutorRural, SolicitacaoServico } from '../types';

interface SheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  onDataLoadedFromSheets: (produtores: ProdutorRural[], servicos: SolicitacaoServico[]) => void;
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  isOpen,
  onClose,
  produtores,
  servicos,
  onDataLoadedFromSheets,
  sheetsUrl,
  setSheetsUrl,
  isSyncing,
  setIsSyncing,
}) => {
  const [urlInput, setUrlInput] = useState(sheetsUrl || getStoredSheetsUrl());
  const [copiedScript, setCopiedScript] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [autoSync, setAutoSync] = useState(getStoredAutoSync());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getStoredLastSync());
  const [showScriptViewer, setShowScriptViewer] = useState(false);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setSheetsUrl('');
      saveStoredSheetsUrl('');
      setStatusMessage({ type: 'info', text: 'URL removida. O sistema funcionará em modo local.' });
      return;
    }

    if (trimmed.includes('docs.google.com/spreadsheets')) {
      setStatusMessage({
        type: 'error',
        text: 'Você colou o link da planilha (docs.google.com). Para conectar, use a "URL do app da Web" gerada em: Extensões > Apps Script > Implantar > Nova implantação > App da Web (a URL termina com "/exec").',
      });
      return;
    }

    if (trimmed.includes('/edit')) {
      setStatusMessage({
        type: 'error',
        text: 'Você colou o link do editor de código (/edit). No Apps Script, clique no botão azul "Implantar" > "Nova implantação" > "App da Web" e copie a URL que termina com "/exec".',
      });
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
      setStatusMessage({
        type: 'error',
        text: 'A URL deve começar com "https://script.google.com/macros/s/..." gerada na implantação do Apps Script como App da Web.',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Testando conexão com a planilha do Google...' });

    try {
      const result = await fetchFromGoogleSheets(trimmed);
      saveStoredSheetsUrl(trimmed);
      setSheetsUrl(trimmed);
      setLastSyncTime(result.timestamp);

      // Se a planilha já continha dados, pergunta ou atualiza
      if (result.produtores.length > 0 || result.servicos.length > 0) {
        onDataLoadedFromSheets(result.produtores, result.servicos);
        setStatusMessage({
          type: 'success',
          text: `Conexão estabelecida com sucesso! Carregados ${result.produtores.length} produtores e ${result.servicos.length} serviços da planilha.`,
        });
      } else {
        // Se a planilha estiver vazia, sobe os dados locais para lá
        await sendToGoogleSheets(trimmed, produtores, servicos);
        setStatusMessage({
          type: 'success',
          text: `Conectado com sucesso! Seus ${produtores.length} produtores e ${servicos.length} serviços locais foram enviados para a planilha.`,
        });
      }
    } catch (err: any) {
      console.warn('Tentativa de conexão com Google Sheets:', err?.message || err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro ao conectar. Verifique se a implantação está configurada como "Quem pode acessar: Qualquer pessoa".',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualFetch = async () => {
    if (!sheetsUrl) return;
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Buscando dados atualizados do Google Sheets...' });
    try {
      const result = await fetchFromGoogleSheets(sheetsUrl);
      onDataLoadedFromSheets(result.produtores, result.servicos);
      setLastSyncTime(result.timestamp);
      setStatusMessage({
        type: 'success',
        text: `Dados atualizados da planilha! (${result.produtores.length} produtores e ${result.servicos.length} serviços sincronizados).`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao buscar dados: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualPush = async () => {
    if (!sheetsUrl) return;
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Enviando todos os dados locais para a planilha...' });
    try {
      const result = await sendToGoogleSheets(sheetsUrl, produtores, servicos);
      setLastSyncTime(result.timestamp);
      setStatusMessage({
        type: 'success',
        text: 'Planilha atualizada com sucesso com todos os dados atuais da plataforma!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao enviar dados: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm('Deseja desconectar a planilha? Seus dados continuarão salvos no navegador deste dispositivo.')) {
      setSheetsUrl('');
      saveStoredSheetsUrl('');
      setUrlInput('');
      setStatusMessage({ type: 'info', text: 'Planilha desconectada com sucesso. Operando em modo local.' });
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    saveStoredAutoSync(enabled);
  };

  const formatarHora = (iso: string | null) => {
    if (!iso) return 'Nunca';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' de ' + d.toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Sincronização em Tempo Real (Google Planilhas)
              </h2>
              <p className="text-xs text-emerald-200">
                Acesse os mesmos dados no celular e no computador simultaneamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Mensagens de feedback */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
              <div className="flex-1 font-medium leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* Cartão de Status da Conexão */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    sheetsUrl ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    {sheetsUrl ? 'Planilha Conectada e Ativa' : 'Modo Apenas Local (Desconectado)'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {sheetsUrl
                      ? `Última sincronização: ${formatarHora(lastSyncTime)}`
                      : 'Os dados estão gravados apenas neste navegador. Conecte sua planilha para sincronizar com outros aparelhos.'}
                  </p>
                </div>
              </div>

              {sheetsUrl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualFetch}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg border border-zinc-300 shadow-xs transition-all disabled:opacity-50"
                    title="Baixar alterações feitas diretamente na planilha"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sincronizar</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Desconectar Planilha"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Ações quando conectado */}
            {sheetsUrl && (
              <div className="pt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleManualFetch}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-semibold rounded-lg border border-emerald-200 transition-all text-left"
                  >
                    <DownloadCloud className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="block font-bold">Puxar do Sheets</span>
                      <span className="text-[10px] text-emerald-700 font-normal">
                        Atualiza a tela com alterações feitas no Sheets
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleManualPush}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 font-semibold rounded-lg border border-amber-200 transition-all text-left"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="block font-bold">Enviar para o Sheets</span>
                      <span className="text-[10px] text-amber-700 font-normal">
                        Salva todos os cadastros atuais na planilha
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-zinc-700 font-medium">Sincronização Automática em Tempo Real</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Campo para Inserir / Editar URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700">
              {sheetsUrl ? 'URL do Web App Conectada:' : 'Cole aqui a URL do seu App da Web (Google Apps Script):'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-zinc-800 bg-white"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{sheetsUrl ? 'Atualizar URL' : 'Conectar Planilha'}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Essa URL é gerada gratuitamente no Google Sheets através do menu <strong>Extensões &gt; Apps Script &gt; Implantar</strong>.
            </p>
          </div>

          {/* Passo a Passo de Configuração */}
          <div className="bg-emerald-950/5 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Passo a Passo de Instalação (Leva apenas 1 minuto)</span>
              </h3>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>Criar Planilha</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-3 text-xs text-zinc-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Abra uma planilha em branco:</strong> Acesse{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold underline"
                  >
                    sheets.new
                  </a>{' '}
                  no seu Google Drive e dê o nome de <em>AgroGestão - Dados</em>.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <strong>Cole o Código Pronto:</strong> No menu superior da planilha, clique em{' '}
                  <strong>Extensões &gt; Apps Script</strong>. Apague o código que estiver lá e cole o script abaixo:
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                        copiedScript
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Código Copiado com Sucesso!' : 'Copiar Código do Apps Script'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowScriptViewer(!showScriptViewer)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 underline"
                    >
                      {showScriptViewer ? 'Ocultar Código' : 'Ver Código'}
                    </button>
                  </div>
                </div>
              </li>

              {showScriptViewer && (
                <div className="bg-zinc-900 text-zinc-100 p-3 rounded-xl text-[10px] font-mono max-h-48 overflow-y-auto border border-zinc-800">
                  <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
                </div>
              )}

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Implante como App da Web:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-zinc-600 text-[11px]">
                    <li>Clique em <strong>Salvar</strong> (ícone de disquete).</li>
                    <li>Clique no botão azul <strong>Implantar &gt; Nova implantação</strong>.</li>
                    <li>Selecione o tipo <strong>App da Web</strong> (na engrenagem).</li>
                    <li>
                      Em <em>Executar como</em>: escolha <strong>Eu</strong>.
                    </li>
                    <li>
                      Em <em>Quem pode acessar</em>: escolha{' '}
                      <strong className="text-emerald-800">Qualquer pessoa (Anyone)</strong>.
                    </li>
                    <li>Clique em <strong>Implantar</strong> e autorize o acesso com sua conta Google.</li>
                  </ul>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong>Copie a URL gerada</strong> (terminada em <code>/exec</code>) e cole no campo acima!
                  Pronto: ao salvar no celular ou no computador, ambos estarão 100% sincronizados.
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3.5 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500">
            Dica: O botão de backup JSON/CSV continua disponível como cópia de segurança.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
