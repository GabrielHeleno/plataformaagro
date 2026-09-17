import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileJson,
  RefreshCw,
  HardDrive,
  FileSpreadsheet,
  Users,
  CalendarDays,
  FolderArchive,
  Info,
} from 'lucide-react';
import { ProdutorRural, SolicitacaoServico } from '../types';
import { restaurarBackup } from '../utils/storage';
import {
  exportarProdutoresCSV,
  exportarServicosCSV,
  exportarProdutoresJSON,
  exportarServicosJSON,
  exportarBackupCompletoJSON,
} from '../utils/exportCsv';

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
  const [formato, setFormato] = useState<'csv' | 'json'>('csv');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Exportar Produtores (CSV ou JSON)
  const handleExportProdutores = () => {
    try {
      if (formato === 'csv') {
        exportarProdutoresCSV(produtores, servicos);
        mostrarToast('Planilha de Produtores (.CSV) gerada com sucesso!');
        setStatusMsg({
          type: 'success',
          text: 'Planilha de Produtores (.CSV) baixada! Todos os campos cadastrados (CPF, Filiação, Endereço, Área, etc.) estão incluídos.',
        });
      } else {
        exportarProdutoresJSON(produtores);
        mostrarToast('Arquivo JSON de Produtores exportado com sucesso!');
        setStatusMsg({
          type: 'success',
          text: 'Arquivo de Produtores (.JSON) baixado com sucesso com todos os campos cadastrais.',
        });
      }
    } catch (err) {
      console.error('Erro ao exportar produtores:', err);
      setStatusMsg({
        type: 'error',
        text: 'Não foi possível exportar os dados dos produtores.',
      });
    }
  };

  // Exportar Serviços (CSV ou JSON)
  const handleExportServicos = () => {
    try {
      if (formato === 'csv') {
        exportarServicosCSV(servicos, produtores);
        mostrarToast('Planilha de Serviços (.CSV) gerada com sucesso!');
        setStatusMsg({
          type: 'success',
          text: 'Planilha de Serviços (.CSV) baixada! Contém todos os agendamentos com data, hora, status, valores e produtor vinculado (com CPF).',
        });
      } else {
        exportarServicosJSON(servicos, produtores);
        mostrarToast('Arquivo JSON de Serviços exportado com sucesso!');
        setStatusMsg({
          type: 'success',
          text: 'Arquivo de Serviços (.JSON) baixado com sucesso com detalhes dos agendamentos e produtores.',
        });
      }
    } catch (err) {
      console.error('Erro ao exportar serviços:', err);
      setStatusMsg({
        type: 'error',
        text: 'Não foi possível exportar os dados dos serviços.',
      });
    }
  };

  // Exportar Ambos / Base Completa
  const handleExportTudo = () => {
    try {
      if (formato === 'csv') {
        exportarProdutoresCSV(produtores, servicos);
        setTimeout(() => {
          exportarServicosCSV(servicos, produtores);
        }, 300);
        mostrarToast('Planilhas (.CSV) de Produtores e Serviços baixadas!');
        setStatusMsg({
          type: 'success',
          text: 'Download iniciado para ambas as planilhas CSV (Produtores e Serviços).',
        });
      } else {
        exportarBackupCompletoJSON(produtores, servicos);
        mostrarToast('Backup Completo (.JSON) baixado com sucesso!');
        setStatusMsg({
          type: 'success',
          text: 'Backup Completo (.JSON) baixado! Guarde este arquivo para restauração a qualquer momento.',
        });
      }
    } catch (err) {
      console.error('Erro ao exportar base completa:', err);
      setStatusMsg({
        type: 'error',
        text: 'Não foi possível exportar a base completa.',
      });
    }
  };

  // Restauração de arquivo .JSON
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
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Cabeçalho */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-700/60 border border-emerald-500/30 text-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Backup & Exportação de Dados</h2>
              <p className="text-xs text-emerald-200/80">
                Exporte em planilhas (.CSV) ou arquivos de segurança (.JSON)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4.5 max-h-[80vh] overflow-y-auto">
          {/* Status Atual da Base */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Base de Dados Ativa & Protegida</span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  IndexedDB
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-zinc-700 font-semibold text-[11px] pt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  Produtores cadastrados: <strong>{produtores.length}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                  Serviços registrados: <strong>{servicos.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Toast / Mensagem */}
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

          {/* Seletor de Formato: CSV vs JSON */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-800 block">
              1. Escolha o Formato do Arquivo para Exportação:
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Opção CSV */}
              <button
                type="button"
                onClick={() => setFormato('csv')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  formato === 'csv'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                    <FileSpreadsheet className={`w-4 h-4 ${formato === 'csv' ? 'text-emerald-700' : 'text-zinc-500'}`} />
                    <span>Planilha (.CSV)</span>
                  </div>
                  {formato === 'csv' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  Abre direto no <strong>Excel</strong>, <strong>Google Sheets</strong> e Calc.
                </p>
              </button>

              {/* Opção JSON */}
              <button
                type="button"
                onClick={() => setFormato('json')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  formato === 'json'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                    <FileJson className={`w-4 h-4 ${formato === 'json' ? 'text-emerald-700' : 'text-zinc-500'}`} />
                    <span>Arquivo (.JSON)</span>
                  </div>
                  {formato === 'json' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  Backup para restaurar ou migrar dados com segurança.
                </p>
              </button>
            </div>
          </div>

          {/* Opções de Exportação */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-zinc-800 block">
              2. Escolha o que deseja exportar em {formato.toUpperCase()}:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Produtores Rurais */}
              <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50/60 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>Cadastro dos Produtores</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {produtores.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Exporta <strong>todos os campos cadastrados</strong>: CPF, Nome, Apelido, Filiação (Pai/Mãe), Telefone, Endereços, Área (ha) e totais.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportProdutores}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Produtores (.{formato})</span>
                </button>
              </div>

              {/* Card 2: Serviços Agendados */}
              <div className="border border-zinc-200 rounded-xl p-3.5 bg-zinc-50/60 hover:bg-zinc-50 transition-colors flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                      <CalendarDays className="w-4 h-4 text-emerald-700" />
                      <span>Serviços Agendados</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {servicos.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Exporta <strong>todos os serviços</strong> com datas, horários, máquina/implemento, status, valores R$, duração e produtor vinculado (com CPF).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportServicos}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Serviços (.{formato})</span>
                </button>
              </div>
            </div>

            {/* Ação de Exportação Completa */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleExportTudo}
                className="w-full py-2.5 px-4 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <FolderArchive className="w-4 h-4 text-emerald-300" />
                <span>
                  {formato === 'csv'
                    ? 'Exportar Ambas as Planilhas (Produtores + Serviços em .CSV)'
                    : 'Exportar Backup Completo do Sistema (.JSON)'}
                </span>
              </button>
            </div>
          </div>

          {/* Seção 3: Restauração de Backup */}
          <div className="border-t border-zinc-200 pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                <Upload className="w-4 h-4 text-blue-700" />
                <span>Restaurar Backup do Sistema</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Requer arquivo .JSON</span>
            </div>

            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Carregue um arquivo <code className="text-zinc-800 font-mono font-semibold">.json</code> baixado anteriormente para restaurar instantaneamente todos os produtores e serviços cadastrados.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-2 px-3 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                  <span>Restaurando dados...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-blue-700" />
                  <span>Selecionar Arquivo de Backup (.JSON)</span>
                </>
              )}
            </button>
          </div>

          {/* Dica para o GitHub Pages */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[11px] text-amber-950 block">
                Dica para migração entre dispositivos ou GitHub Pages:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900/85">
                Basta exportar em <strong>.JSON</strong> aqui e clicar em <strong>"Selecionar Arquivo de Backup"</strong> em outro navegador ou no link do GitHub Pages para sincronizar todos os dados!
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
          <button
            type="button"
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
