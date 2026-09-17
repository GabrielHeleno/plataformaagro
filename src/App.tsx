import React, { useState, useEffect, useMemo } from 'react';
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
import { ProdutorRural, SolicitacaoServico, StatusServico } from './types';
import {
  getStoredProdutores,
  saveStoredProdutores,
  getStoredServicos,
  saveStoredServicos,
  loadFromIndexedDB,
  verificarPendenciaProdutor,
  resetToDefaults,
  getHojeStr,
} from './utils/storage';
import {
  getNotificationPermission,
  PermissionStatus,
  dispararLembreteDiario,
} from './utils/notifications';
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
  const [pushStatus, setPushStatus] = useState<PermissionStatus>(() => getNotificationPermission());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inicialização assíncrona: recupera dados persistentes do IndexedDB (incluindo imagens completas)
  useEffect(() => {
    loadFromIndexedDB().then((idbData) => {
      if (idbData) {
        if (idbData.produtores && idbData.produtores.length > 0) {
          setProdutores(idbData.produtores);
        }
        if (idbData.servicos && idbData.servicos.length > 0) {
          setServicos(idbData.servicos);
        }
      }
    });
  }, []);

  // Sincroniza persistência com localStorage e IndexedDB
  useEffect(() => {
    saveStoredProdutores(produtores);
  }, [produtores]);

  useEffect(() => {
    saveStoredServicos(servicos);
  }, [servicos]);

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
    setProdutores((prev) => {
      const index = prev.findIndex((p) => p.id === salvo.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = salvo;
        return copy;
      }
      return [salvo, ...prev];
    });

    // Se o produtor salvo estiver atualmente em visualização detalhada, atualiza ele
    if (selectedProdutor?.id === salvo.id) {
      setSelectedProdutor(salvo);
    }

    setProducerFormOpen(false);
    setEditingProdutor(null);
    mostrarToast(`Produtor "${salvo.nomeCompleto}" salvo com sucesso!`);
  };

  const handleEditProdutor = (produtor: ProdutorRural) => {
    setEditingProdutor(produtor);
    setProducerFormOpen(true);
  };

  // Handlers para Serviços
  const handleSaveServico = (salvo: SolicitacaoServico) => {
    setServicos((prev) => {
      const index = prev.findIndex((s) => s.id === salvo.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = salvo;
        return copy;
      }
      return [salvo, ...prev];
    });

    setServiceFormOpen(false);
    setEditingServico(null);
    setServiceFormFixedProdutorId(undefined);
    setServiceFormDataInicial(undefined);
    mostrarToast(`Solicitação de serviço ${salvo.id} salva com sucesso!`);
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
    setServicos((prev) =>
      prev.map((s) => {
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
      })
    );
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
  };

  const handleDeleteServico = (servicoId: string) => {
    setServicos((prev) => prev.filter((s) => s.id !== servicoId));
    mostrarToast(`Solicitação de serviço removida.`);
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
        pushStatus={pushStatus}
      />

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
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistema Integrado de Gestão Rural · Dados salvos localmente</span>
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
          }}
          mostrarToast={mostrarToast}
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
