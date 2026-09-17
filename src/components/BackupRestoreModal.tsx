import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  FileJson,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { ProdutorRural, SolicitacaoServico } from '../types';
import { baixarArquivoBackup, restaurarBackup } from '../utils/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtores: ProdutorRural[];
  servicos: SolicitacaoServico[];
  onDataRestored: (produtores: ProdutorRural[], servicos: SolicitacaoServico[]) => void;
  mostrarToast: (msg: string) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  produtores,
  servicos,
  onDataRestored,
  mostrarToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      baixarArquivoBackup(produtores, servicos);
      mostrarToast('Arquivo de backup gerado e baixado com sucesso!');
      setStatusMsg({
        type: 'success',
        text: 'Backup baixado com sucesso! Guarde este arquivo em local seguro.',
      });
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      setStatusMsg({
        type: 'error',
        text: 'Não foi possível gerar o arquivo de backup.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { produtores: novosProdutores, servicos: novosServicos } = restaurarBackup(content);

        onDataRestored(novosProdutores, novosServicos);
        setIsProcessing(false);
        setStatusMsg({
          type: 'success',
          text: `Backup restaurado com sucesso! ${novosProdutores.length} produtor(es) e ${novosServicos.length} serviço(s) carregados.`,
        });
        mostrarToast('Base de dados restaurada com sucesso!');
      } catch (err) {
        console.error('Erro ao restaurar backup:', err);
        setIsProcessing(false);
        setStatusMsg({
          type: 'error',
          text: 'Arquivo de backup inválido. Certifique-se de selecionar um arquivo .json gerado por este sistema.',
        });
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setStatusMsg({
        type: 'error',
        text: 'Erro ao ler o arquivo selecionado.',
      });
    };

    reader.readAsText(file);
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se desejar
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-700/60 border border-emerald-500/30 text-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Segurança e Backup de Dados</h2>
              <p className="text-xs text-emerald-200/80">Proteção permanente dos seus cadastros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status Atual do Banco de Dados */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Armazenamento Persistente Ativo</span>
                <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px]">
                  IndexedDB + Master Storage
                </span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Seus dados estão gravados na base de alta capacidade do navegador, protegidos contra perdas
                por atualização de código.
              </p>
              <div className="flex flex-wrap gap-3 pt-1 text-zinc-700 font-semibold text-[11px]">
                <span>
                  Produtores cadastrados: <strong>{produtores.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Serviços registrados: <strong>{servicos.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Mensagem de Feedback */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="font-medium leading-relaxed">{statusMsg.text}</div>
            </div>
          )}

          {/* Ações de Backup e Restauração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Opção 1: Baixar Backup */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/60 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Exportar Arquivo</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Baixe um arquivo seguro (<code className="text-zinc-800 font-mono">.json</code>) contendo
                  todos os produtores, documentos com fotos, serviços e datas.
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Backup Completo</span>
              </button>
            </div>

            {/* Opção 2: Restaurar Backup */}
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/60 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Restaurar Arquivo</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Carregue um arquivo <code className="text-zinc-800 font-mono">.json</code> salvo
                  anteriormente para restaurar toda a base instantaneamente.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-blue-700" />
                    <span>Selecionar Backup JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dica para o GitHub Pages */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-700" />
              <span>Sincronizando com o GitHub Pages:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Como o GitHub Pages roda em um endereço diferente deste ambiente de desenvolvimento, basta clicar
              em <strong>"Baixar Backup Completo"</strong> aqui e depois em <strong>"Restaurar Arquivo"</strong>{' '}
              no site do GitHub Pages para ter todos os seus cadastros idênticos nos dois lugares!
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
