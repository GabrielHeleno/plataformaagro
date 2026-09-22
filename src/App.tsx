import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { WaitingListView } from './components/WaitingListView';
import { ProducerSearchList } from './components/ProducerSearchList';
import { ProducerDetailModal } from './components/ProducerDetailModal';
import { ProducerFormModal } from './components/ProducerFormModal';
import { ServiceFormModal } from './components/ServiceFormModal';
import { DailyRemindersModal } from './components/DailyRemindersModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { SheetsSyncModal } from './components/SheetsSyncModal';
import { ProdutorRural, SolicitacaoServico, StatusServico } from './types';
import {
  getStoredProdutores,
  saveStoredProdutores,
  getStoredServicos,
  saveStoredServicos,
  loadFromIndexedDB,
  buscarDadosParaRecuperacao,
  verificarPendenciaProdutor,
  resetToDefaults,
  getHojeStr,
} from './utils/storage';
import {
  getStoredSheetsUrl,
  saveStoredSheetsUrl,
  getStoredAutoSync,
  fetchFromGoogleSheets,
  sendToGoogleSheets,
} from './utils/sheetsSync';
import {
  getNotificationPermission,
  PermissionStatus,
  dispararLembreteDiario,
} from './utils/notifications';
import { getDocumentFile, saveDocumentFile } from './utils/documentStorage';
import { AlertTriangle, Bell, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [produtores, setProdutores] = useState<ProdutorRural[]>(() => getStoredProdutores());
  const [servicos, setServicos] = useState<SolicitacaoServico[]>(() => getStoredServicos());

  const [activeTab, setActiveTab] = useState<'calendario' | 'fila-espera' | 'produtores' | 'novo-produtor'>('calendario');

  // Modais e visualizadores
  const [selectedProdutor, setSelectedProdutor] = useState<ProdutorRural | null>(null);
  const [producerFormOpen, setProducerFormOpen] = useState<boolean>(false);
  const [editingProdutor, setEditingProdutor] = useState<ProdutorRural | null>(null);

  const [serviceFormOpen, setServiceFormOpen] = useState<boolean>(false);
  const [editingServico, setEditingServico] = useState<SolicitacaoServico | null>(null);
  const [serviceFormFixedProdutorId, setServiceFormFixedProdutorId] = useState<string | undefined>(undefined);
  const [serviceFormDataInicial, setServiceFormDataInicial] = useState<string | undefined>(undefined);

  const [serviceDetailModalServico, setServiceDetailModalServico] = useState<SolicitacaoServico | null>(null);
  const [serviceDetailModalProdutor, setServiceDetailModalProdutor] = useState<ProdutorRural | undefined>(undefined);

  const [dailyRemindersOpen, setDailyRemindersOpen] = useState<boolean>(false);
  const [backupModalOpen, setBackupModalOpen] = useState<boolean>(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState<boolean>(false);
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => getStoredSheetsUrl());
  const [isSheetsSyncing, setIsSheetsSyncing] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<PermissionStatus>(() => getNotificationPermission());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isStorageInitialized, setIsStorageInitialized] = useState<boolean>(false);
  const [snapshotRecuperavelCount, setSnapshotRecuperavelCount] = useState<number | null>(null);

  // Inicialização assíncrona: recupera dados persistentes do IndexedDB primeiro (incluindo imagens completas)
  useEffect(() => {
    loadFromIndexedDB()
      .then(async (idbData) => {
        let prodsCarregados: ProdutorRural[] | undefined = idbData?.produtores;
        let servsCarregados: SolicitacaoServico[] | undefined = idbData?.servicos;

        // Se porventura a lista de produtores estiver vazia, tenta auto-recuperar do snapshot de segurança
        if (!prodsCarregados || prodsCarregados.length === 0) {
          const recuperados = await buscarDadosParaRecuperacao();
          if (recuperados && recuperados.produtores.length > 0) {
            prodsCarregados = recuperados.produtores;
            if (!servsCarregados || servsCarregados.length === 0) {
              servsCarregados = recuperados.servicos;
            }
          }
        }

        if (prodsCarregados && prodsCarregados.length > 0) {
          setProdutores(prodsCarregados);
        }
        if (servsCarregados && servsCarregados.length > 0) {
          setServicos(servsCarregados);
        }
      })
      .catch((err) => {
        console.warn('Aviso ao inicializar dados do IndexedDB:', err);
      })
      .finally(() => {
        setIsStorageInitialized(true);
      });
  }, []);

  // Monitora se há snapshot disponível para recuperação caso a lista esteja vazia
  useEffect(() => {
    if (isStorageInitialized && produtores.length === 0) {
      buscarDadosParaRecuperacao().then((res) => {
        if (res && res.produtores.length > 0) {
          setSnapshotRecuperavelCount(res.produtores.length);
        } else {
          setSnapshotRecuperavelCount(null);
        }
      });
    } else {
      setSnapshotRecuperavelCount(null);
    }
  }, [produtores.length, isStorageInitialized]);

  // Envio automático em segundo plano para o Google Sheets quando houver alterações locais
  const triggerSheetsPush = useCallback(
    async (novosProdutores: ProdutorRural[], novosServicos: SolicitacaoServico[]) => {
      const url = getStoredSheetsUrl();
      if (!url || !getStoredAutoSync()) return;

      // Trava de integridade máxima: NUNCA envia lista vazia de produtores para a planilha
      if (!novosProdutores || !Array.isArray(novosProdutores) || novosProdutores.length === 0) {
        console.warn('Proteção de segurança: bloqueada tentativa de sincronizar lista vazia de produtores com o Sheets.');
        return;
      }

      try {
        setIsSheetsSyncing(true);
        await sendToGoogleSheets(url, novosProdutores, novosServicos);
      } catch (err) {
        console.warn('Falha na sincronização com Google Sheets:', err);
      } finally {
        setIsSheetsSyncing(false);
      }
    },
    []
  );

  // Busca atualizações da planilha do Google Sheets (se alguém alterou no Sheets ou em outro aparelho)
  const pullFromSheets = useCallback(
    async (silent = false) => {
      const url = getStoredSheetsUrl();
      if (!url) return;
      try {
        setIsSheetsSyncing(true);
        const res = await fetchFromGoogleSheets(url);

        // Atualiza produtores SOMENTE se a planilha contiver produtores válidos
        // Trava crítica: Se a planilha estiver vazia, JAMAIS apaga os produtores do app!
        if (res.produtores && res.produtores.length > 0) {
          const prodsCompletos = await Promise.all(
            res.produtores.map(async (novoP) => {
              // Se a planilha já traz o link oficial do Google Drive (http/https), prioriza o link da nuvem
              if (novoP.documentoFotoUrl && novoP.documentoFotoUrl.startsWith('http')) {
                await saveDocumentFile(novoP.id, novoP.documentoFotoUrl);
                return novoP;
              }

              // Se a planilha veio sem foto ou com marcador, verifica se temos foto local preservada
              const localP = produtores.find((p) => p.id === novoP.id);
              if (
                localP &&
                localP.documentoFotoUrl &&
                !localP.documentoFotoUrl.startsWith('idb:') &&
                localP.documentoFotoUrl !== '[FOTO_ARMAZENADA_LOCAL]'
              ) {
                return { ...novoP, documentoFotoUrl: localP.documentoFotoUrl };
              }

              // Busca no repositório persistente IndexedDB
              const fotoLocal = await getDocumentFile(novoP.id);
              if (fotoLocal) {
                return { ...novoP, documentoFotoUrl: fotoLocal };
              }

              return novoP;
            })
          );
          setProdutores(prodsCompletos);
        }

        // Atualiza serviços se houver registros
        if (res.servicos && res.servicos.length > 0) {
          setServicos(res.servicos);
        }

        if (!silent && (res.produtores.length > 0 || res.servicos.length > 0)) {
          setToastMsg('Dados atualizados da planilha do Google Sheets!');
          setTimeout(() => setToastMsg(null), 3500);
        }
      } catch (err: any) {
        if (!silent) {
          setToastMsg(`Erro ao sincronizar com Google Sheets: ${err.message}`);
          setTimeout(() => setToastMsg(null), 4000);
        }
      } finally {
        setIsSheetsSyncing(false);
      }
    },
    []
  );

  // Sincronização inicial e periódica com Google Sheets
  useEffect(() => {
    const url = getStoredSheetsUrl();
    if (url && getStoredAutoSync()) {
      pullFromSheets(true);
    }

    // Polling a cada 40 segundos para detectar edições feitas diretamente no Google Sheets ou em outro aparelho
    const interval = setInterval(() => {
      const currentUrl = getStoredSheetsUrl();
      if (currentUrl && getStoredAutoSync() && !document.hidden) {
        pullFromSheets(true);
      }
    }, 40000);

    // Sincroniza imediatamente quando o usuário volta para a aba do sistema
    const handleFocus = () => {
      const currentUrl = getStoredSheetsUrl();
      if (currentUrl && getStoredAutoSync()) {
        pullFromSheets(true);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pullFromSheets]);

  // Sincroniza persistência com localStorage e IndexedDB SOMENTE após inicialização concluída
  // Isso impede que a renderização inicial sobrescreva dados reais do IndexedDB!
  useEffect(() => {
    if (!isStorageInitialized) return;
    saveStoredProdutores(produtores);
  }, [produtores, isStorageInitialized]);

  useEffect(() => {
    if (!isStorageInitialized) return;
    saveStoredServicos(servicos);
  }, [servicos, isStorageInitialized]);

  // Se o usuário clicar na aba "novo-produtor", abre o modal
  useEffect(() => {
    if (activeTab === 'novo-produtor') {
      setEditingProdutor(null);
      setProducerFormOpen(true);
      setActiveTab('produtores');
    }
  }, [activeTab]);

  // Dispara checagem inicial de lembretes para a data de hoje dinâmica
  useEffect(() => {
    const hojeStr = getHojeStr();
    const servicosHoje = servicos.filter(
      (s) => s.dataPrevista === hojeStr && s.status !== 'cancelada'
    );
    if (servicosHoje.length > 0 && pushStatus === 'granted') {
      dispararLembreteDiario(servicos, produtores, hojeStr);
    }
  }, [pushStatus]);

  // Contagem de serviços hoje
  const servicosHojeCount = useMemo(() => {
    const hojeStr = getHojeStr();
    return servicos.filter((s) => s.dataPrevista === hojeStr && s.status !== 'cancelada').length;
  }, [servicos]);

  // Contagem de produtores com pendências financeiras
  const pendenciasCount = useMemo(() => {
    return produtores.filter((p) => verificarPendenciaProdutor(p.id, servicos)).length;
  }, [produtores, servicos]);

  // Contagem de serviços na fila de espera (aguardando data)
  const filaCount = useMemo(() => {
    return servicos.filter(
      (s) => s.status === 'na fila' || s.status === 'em espera' || !s.dataPrevista || s.dataPrevista.trim() === ''
    ).length;
  }, [servicos]);

  // Próximo ID sugerido para novo produtor
  const proximoIdProdutor = useMemo(() => {
    const ids = produtores
      .map((p) => {
        const match = p.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `PR-${String(max + 1).padStart(3, '0')}`;
  }, [produtores]);

  // Próximo ID sugerido para novo serviço
  const proximoIdServico = useMemo(() => {
    const ids = servicos
      .map((s) => {
        const match = s.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 100;
      })
      .filter((n) => !isNaN(n));
    const max = ids.length > 0 ? Math.max(...ids) : 100;
    return `SRV-${max + 1}`;
  }, [servicos]);

  // Exibir toast temporário
  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Handlers para Produtores
  const handleSaveProdutor = (salvo: ProdutorRural) => {
    const index = produtores.findIndex((p) => p.id === salvo.id);
    let prodsAtualizados: ProdutorRural[];
    if (index >= 0) {
      prodsAtualizados = [...produtores];
      prodsAtualizados[index] = salvo;
    } else {
      prodsAtualizados = [salvo, ...produtores];
    }

    setProdutores(prodsAtualizados);

    // Se o produtor salvo estiver atualmente em visualização detalhada, atualiza ele
    if (selectedProdutor?.id === salvo.id) {
      setSelectedProdutor(salvo);
    }

    setProducerFormOpen(false);
    setEditingProdutor(null);
    mostrarToast(`Produtor "${salvo.nomeCompleto}" salvo com sucesso!`);
    
    // Sincroniza com o Google Sheets garantindo a lista calculada de forma síncrona
    triggerSheetsPush(prodsAtualizados, servicos);
  };

  const handleEditProdutor = (produtor: ProdutorRural) => {
    setEditingProdutor(produtor);
    setProducerFormOpen(true);
  };

  // Restauração de emergência a partir do Snapshot local de segurança
  const handleRestaurarSnapshotProdutores = async () => {
    try {
      const recuperados = await buscarDadosParaRecuperacao();
      if (recuperados && recuperados.produtores.length > 0) {
        setProdutores(recuperados.produtores);
        mostrarToast(`${recuperados.produtores.length} produtor(es) restaurados com sucesso!`);
        // Sincroniza de volta para a planilha do Google Sheets repovoando a aba Produtores
        const url = getStoredSheetsUrl();
        if (url) {
          await sendToGoogleSheets(url, recuperados.produtores, servicos);
        }
      } else {
        mostrarToast('Nenhum snapshot de produtores encontrado neste navegador.');
      }
    } catch (err) {
      console.error('Erro ao restaurar snapshot:', err);
      mostrarToast('Falha ao restaurar snapshot de produtores.');
    }
  };

  // Handlers para Serviços
  const handleSaveServico = (salvo: SolicitacaoServico) => {
    const index = servicos.findIndex((s) => s.id === salvo.id);
    let servsAtualizados: SolicitacaoServico[];
    if (index >= 0) {
      servsAtualizados = [...servicos];
      servsAtualizados[index] = salvo;
    } else {
      servsAtualizados = [salvo, ...servicos];
    }

    setServicos(servsAtualizados);

    setServiceFormOpen(false);
    setEditingServico(null);
    setServiceFormFixedProdutorId(undefined);
    setServiceFormDataInicial(undefined);
    mostrarToast(`Solicitação de serviço ${salvo.id} salva com sucesso!`);

    // Sincroniza com o Google Sheets com a lista síncrona calculada
    triggerSheetsPush(produtores, servsAtualizados);
  };

  const handleOpenAddServico = (produtorId?: string, dataPrevia?: string) => {
    setEditingServico(null);
    setServiceFormFixedProdutorId(produtorId);
    setServiceFormDataInicial(dataPrevia);
    setServiceFormOpen(true);
  };

  const handleEditServico = (servico: SolicitacaoServico) => {
    setEditingServico(servico);
    setServiceFormFixedProdutorId(servico.produtorId);
    setServiceFormDataInicial(servico.dataPrevista);
    setServiceFormOpen(true);
  };

  const handleUpdateServicoStatus = (
    servicoId: string,
    novoStatus: StatusServico,
    extras?: { tempoServico?: string; valor?: number; dataConclusao?: string }
  ) => {
    const servsAtualizados = servicos.map((s) => {
      if (s.id === servicoId) {
        return {
          ...s,
          status: novoStatus,
          tempoServico: extras?.tempoServico !== undefined ? extras.tempoServico : s.tempoServico,
          valor: extras?.valor !== undefined ? extras.valor : s.valor,
          dataConclusao:
            extras?.dataConclusao ||
            (novoStatus === 'realizada' ? (s.dataConclusao || s.dataPrevista) : s.dataConclusao),
        };
      }
      return s;
    });

    setServicos(servsAtualizados);

    setServiceDetailModalServico((curr) => {
      if (curr && curr.id === servicoId) {
        return {
          ...curr,
          status: novoStatus,
          tempoServico: extras?.tempoServico !== undefined ? extras.tempoServico : curr.tempoServico,
          valor: extras?.valor !== undefined ? extras.valor : curr.valor,
          dataConclusao:
            extras?.dataConclusao ||
            (novoStatus === 'realizada' ? (curr.dataConclusao || curr.dataPrevista) : curr.dataConclusao),
        };
      }
      return curr;
    });
    mostrarToast(`Status do serviço ${servicoId} atualizado para "${novoStatus}".`);

    // Sincroniza com o Google Sheets
    triggerSheetsPush(produtores, servsAtualizados);
  };

  const handleDeleteServico = (servicoId: string) => {
    const servsAtualizados = servicos.filter((s) => s.id !== servicoId);
    setServicos(servsAtualizados);
    mostrarToast(`Solicitação de serviço removida.`);

    // Sincroniza com o Google Sheets
    triggerSheetsPush(produtores, servsAtualizados);
  };

  const handleSelectServico = (servico: SolicitacaoServico, produtor?: ProdutorRural) => {
    const prod = produtor || produtores.find((p) => p.id === servico.produtorId);
    setServiceDetailModalServico(servico);
    setServiceDetailModalProdutor(prod);
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar a base de dados para os dados rurais de demonstração?')) {
      const reset = resetToDefaults();
      setProdutores(reset.produtores);
      setServicos(reset.servicos);
      setSelectedProdutor(null);
      mostrarToast('Dados de demonstração restaurados com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans">
      {/* Barra de Navegação Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        servicosHojeCount={servicosHojeCount}
        filaCount={filaCount}
        pendenciasCount={pendenciasCount}
        onOpenReminders={() => setDailyRemindersOpen(true)}
        onOpenNewService={() => handleOpenAddServico()}
        onOpenBackup={() => setBackupModalOpen(true)}
        onOpenSheetsSync={() => setSheetsModalOpen(true)}
        isSheetsConnected={Boolean(sheetsUrl && sheetsUrl.trim().length > 0)}
        isSheetsSyncing={isSheetsSyncing}
        pushStatus={pushStatus}
      />

      {/* Alerta de Recuperação de Emergência de Produtores */}
      {produtores.length === 0 && (
        <div className="bg-amber-50 border-b-2 border-amber-400 px-4 py-3 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-900">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-semibold text-amber-950">
                  {snapshotRecuperavelCount && snapshotRecuperavelCount > 0
                    ? `Atenção: A lista de produtores está vazia, mas encontramos ${snapshotRecuperavelCount} produtor(es) no backup de segurança local deste navegador!`
                    : 'Atenção: A lista de produtores está temporariamente vazia.'}
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Seus serviços continuam salvos. Você pode restaurar os produtores imediatamente ou importar pelo histórico de versões do Google Sheets.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {snapshotRecuperavelCount && snapshotRecuperavelCount > 0 && (
                <button
                  onClick={handleRestaurarSnapshotProdutores}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar {snapshotRecuperavelCount} Produtor(es)
                </button>
              )}
              <button
                onClick={() => setBackupModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-amber-900 bg-amber-200/70 hover:bg-amber-200 font-semibold px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors"
              >
                Central de Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Global de Notificações ou Pendências */}
      {pendenciasCount > 0 && activeTab === 'calendario' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Existem <strong>{pendenciasCount} produtor(es)</strong> com pendências financeiras (faturas sem quitação confirmada).
              </span>
            </div>
            <button
              onClick={() => setActiveTab('produtores')}
              className="text-red-700 hover:text-red-900 font-bold underline shrink-0 ml-2"
            >
              Consultar na busca →
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
        {activeTab === 'calendario' && (
          <CalendarView
            produtores={produtores}
            servicos={servicos}
            onSelectProdutor={(prod) => setSelectedProdutor(prod)}
            onSelectServico={handleSelectServico}
            onAddServico={(data) => handleOpenAddServico(undefined, data)}
            onOpenReminders={() => setDailyRemindersOpen(true)}
            onOpenFila={() => setActiveTab('fila-espera')}
          />
        )}

        {activeTab === 'fila-espera' && (
          <WaitingListView
            servicos={servicos}
            produtores={produtores}
            onEditServico={(serv) => {
              setEditingServico(serv);
              setServiceFormDataInicial(serv.dataPrevista || undefined);
              setServiceFormFixedProdutorId(serv.produtorId);
              setServiceFormOpen(true);
            }}
            onOpenServiceDetail={(serv, prod) => {
              setServiceDetailModalServico(serv);
              setServiceDetailModalProdutor(prod);
            }}
            onOpenProdutor={(prod) => setSelectedProdutor(prod)}
            onNewService={() => handleOpenAddServico()}
            onSaveServico={handleSaveServico}
            onDeleteServico={handleDeleteServico}
          />
        )}

        {activeTab === 'produtores' && (
          <ProducerSearchList
            produtores={produtores}
            servicos={servicos}
            onSelectProdutor={(prod) => setSelectedProdutor(prod)}
            onOpenNovoProdutor={() => {
              setEditingProdutor(null);
              setProducerFormOpen(true);
            }}
          />
        )}
      </main>

      {/* Rodapé Simples e Discreto */}
      <footer className="bg-white border-t border-zinc-200 py-4 px-4 sm:px-8 text-xs text-zinc-500 mt-auto mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${sheetsUrl ? 'text-emerald-500' : 'text-emerald-600'}`} />
            <span>
              {sheetsUrl
                ? 'Sincronização em tempo real ativa (Google Sheets conectado)'
                : 'Sistema Integrado de Gestão Rural · Dados salvos localmente'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetDefaults}
              className="hover:text-zinc-800 flex items-center gap-1 transition-colors"
              title="Restaurar dados iniciais de produtores e serviços de demonstração"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar dados de exemplo</span>
            </button>
            <span>v1.0</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Ficha Completa do Produtor (com aviso vermelho de pendências e os dois botões exigidos) */}
      {selectedProdutor && (
        <ProducerDetailModal
          produtor={selectedProdutor}
          servicos={servicos}
          onClose={() => setSelectedProdutor(null)}
          onEditProdutor={(p) => {
            handleEditProdutor(p);
          }}
          onAddServico={(produtorId) => {
            handleOpenAddServico(produtorId);
          }}
          onEditServico={handleEditServico}
          onUpdateServicoStatus={handleUpdateServicoStatus}
        />
      )}

      {/* MODAL 2: Formulário de Cadastro e Edição de Produtor Rural */}
      {producerFormOpen && (
        <ProducerFormModal
          produtorInicial={editingProdutor}
          onSave={handleSaveProdutor}
          onClose={() => {
            setProducerFormOpen(false);
            setEditingProdutor(null);
          }}
          proximoIdSugerido={proximoIdProdutor}
        />
      )}

      {/* MODAL 3: Formulário de Nova Solicitação de Serviço */}
      {serviceFormOpen && (
        <ServiceFormModal
          servicoInicial={editingServico}
          produtorIdFixo={serviceFormFixedProdutorId}
          dataInicial={serviceFormDataInicial}
          produtores={produtores}
          onSave={handleSaveServico}
          onClose={() => {
            setServiceFormOpen(false);
            setEditingServico(null);
            setServiceFormFixedProdutorId(undefined);
            setServiceFormDataInicial(undefined);
          }}
          proximoIdSugerido={proximoIdServico}
        />
      )}

      {/* MODAL 4: Visualizador Rápido de Agendamento do Calendário */}
      {serviceDetailModalServico && (
        <ServiceDetailModal
          servico={serviceDetailModalServico}
          produtor={serviceDetailModalProdutor}
          todosServicos={servicos}
          onClose={() => {
            setServiceDetailModalServico(null);
            setServiceDetailModalProdutor(undefined);
          }}
          onOpenProdutor={(p) => {
            setServiceDetailModalServico(null);
            setSelectedProdutor(p);
          }}
          onEditServico={(s) => {
            setServiceDetailModalServico(null);
            handleEditServico(s);
          }}
          onUpdateStatus={handleUpdateServicoStatus}
          onDeleteServico={handleDeleteServico}
        />
      )}

      {/* MODAL 5: Central de Lembretes Diários & Notificações Push */}
      {dailyRemindersOpen && (
        <DailyRemindersModal
          produtores={produtores}
          servicos={servicos}
          onClose={() => setDailyRemindersOpen(false)}
          onSelectProdutor={(p) => {
            setDailyRemindersOpen(false);
            setSelectedProdutor(p);
          }}
          onSelectServico={(srv, prod) => {
            setDailyRemindersOpen(false);
            handleSelectServico(srv, prod);
          }}
          pushStatus={pushStatus}
          onPushStatusChange={(st) => setPushStatus(st)}
        />
      )}

      {/* MODAL 6: Central de Backup e Segurança de Dados */}
      {backupModalOpen && (
        <BackupRestoreModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          produtores={produtores}
          servicos={servicos}
          onDataRestored={(novosProdutores, novosServicos) => {
            setProdutores(novosProdutores);
            setServicos(novosServicos);
            setSelectedProdutor(null);
            setServiceDetailModalServico(null);
            triggerSheetsPush(novosProdutores, novosServicos);
          }}
          mostrarToast={mostrarToast}
        />
      )}

      {/* MODAL 7: Sincronização em Nuvem em Tempo Real (Google Sheets) */}
      {sheetsModalOpen && (
        <SheetsSyncModal
          isOpen={sheetsModalOpen}
          onClose={() => setSheetsModalOpen(false)}
          produtores={produtores}
          servicos={servicos}
          onDataLoadedFromSheets={(novosProdutores, novosServicos) => {
            setProdutores(novosProdutores);
            setServicos(novosServicos);
            setSelectedProdutor(null);
            setServiceDetailModalServico(null);
          }}
          sheetsUrl={sheetsUrl}
          setSheetsUrl={setSheetsUrl}
          isSyncing={isSheetsSyncing}
          setIsSyncing={setIsSheetsSyncing}
        />
      )}

      {/* Toast de Confirmação */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-5 right-5 z-50 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-xl border border-zinc-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
