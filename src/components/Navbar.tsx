import React from 'react';
import { Calendar, Users, UserPlus, Bell, Plus, Tractor, Database, Clock } from 'lucide-react';
import { PermissionStatus } from '../utils/notifications';

interface NavbarProps {
  activeTab: 'calendario' | 'fila-espera' | 'produtores' | 'novo-produtor';
  setActiveTab: (tab: 'calendario' | 'fila-espera' | 'produtores' | 'novo-produtor') => void;
  servicosHojeCount: number;
  filaCount: number;
  pendenciasCount: number;
  onOpenReminders: () => void;
  onOpenNewService: () => void;
  onOpenBackup: () => void;
  pushStatus: PermissionStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  servicosHojeCount,
  filaCount,
  pendenciasCount,
  onOpenReminders,
  onOpenNewService,
  onOpenBackup,
}) => {
  return (
    <>
      {/* Barra de Navegação Superior (Header Principal) */}
      <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white shadow-md border-b border-emerald-800/80">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-3">
            
            {/* Logo & Marca */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none shrink-0"
              onClick={() => setActiveTab('calendario')}
              title="AgroGestão - Início"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 border border-emerald-500/30 flex items-center justify-center text-emerald-100 shadow-sm shrink-0">
                <Tractor className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              </div>
              <div className="hidden xs:flex sm:flex items-center gap-1">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  AgroGestão
                </span>
                <span className="hidden xl:inline-flex text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-300">
                  Rural
                </span>
              </div>
            </div>

            {/* Menu de Navegação - VISÍVEL TANTO EM MOBILE QUANTO DESKTOP (Ícones no mobile, com texto em telas maiores) */}
            <nav className="flex items-center bg-emerald-950/60 p-0.5 sm:p-1 rounded-xl border border-emerald-800/80 gap-0.5 shadow-inner">
              {/* Aba: Calendário */}
              <button
                id="nav-tab-calendario"
                onClick={() => setActiveTab('calendario')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'calendario'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500/60'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Calendário e Agendamentos"
                aria-label="Calendário"
              >
                <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="hidden md:inline">Calendário</span>
              </button>

              {/* Aba: Fila de Espera (Novo status "na fila / em espera") */}
              <button
                id="nav-tab-fila-espera"
                onClick={() => setActiveTab('fila-espera')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  activeTab === 'fila-espera'
                    ? 'bg-amber-600 text-white shadow-sm border border-amber-400/60'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Fila de Espera (serviços aguardando agendamento)"
                aria-label="Fila de Espera"
              >
                <div className="relative flex items-center">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                  {filaCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-[15px] h-3.5 px-0.5 text-[8px] font-black text-zinc-950 bg-amber-400 rounded-full shadow"
                      title={`${filaCount} serviço(s) na fila`}
                    >
                      {filaCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline">Fila de Espera</span>
              </button>

              {/* Aba: Produtores */}
              <button
                id="nav-tab-produtores"
                onClick={() => setActiveTab('produtores')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                  activeTab === 'produtores'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500/60'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Lista de Produtores Rurais"
                aria-label="Produtores"
              >
                <div className="relative flex items-center">
                  <Users className="w-4 h-4 text-emerald-300 shrink-0" />
                  {pendenciasCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-[15px] h-3.5 px-0.5 text-[8px] font-extrabold text-white bg-red-600 rounded-full shadow"
                      title={`${pendenciasCount} produtor(es) com pendências`}
                    >
                      {pendenciasCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline">Produtores</span>
              </button>

              {/* Aba: Novo Produtor */}
              <button
                id="nav-tab-novo-produtor"
                onClick={() => setActiveTab('novo-produtor')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'novo-produtor'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500/60'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Cadastrar Novo Produtor Rural"
                aria-label="Novo Produtor"
              >
                <UserPlus className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="hidden lg:inline">Novo Produtor</span>
              </button>
            </nav>

            {/* Ações Rápidas: Backup, Lembretes (Opcional no mobile) & Adicionar Serviço (Sem estourar a tela) */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Botão de Backup e Exportação (Apenas Ícone) */}
              <button
                id="btn-backup-dados"
                onClick={onOpenBackup}
                className="p-1.5 sm:p-2 rounded-xl text-emerald-100 hover:bg-emerald-800/80 transition-all flex items-center justify-center border border-emerald-700/60 bg-emerald-950/40 shadow-xs active:scale-95 shrink-0"
                title="Backup de Segurança e Exportação (JSON/CSV)"
                aria-label="Backup e Exportação"
              >
                <Database className="w-4 h-4 text-emerald-300 shrink-0" />
              </button>

              {/* Botão de Lembretes Diários - Visibilidade opcional no dispositivo móvel como instruído pelo usuário */}
              <button
                id="btn-lembretes-diarios"
                onClick={onOpenReminders}
                className="hidden sm:flex relative p-1.5 sm:p-2 rounded-xl text-emerald-100 hover:bg-emerald-800/80 transition-all items-center justify-center border border-emerald-700/60 bg-emerald-950/40 shadow-xs active:scale-95 shrink-0"
                title={`Lembretes Diários (${servicosHojeCount} para hoje)`}
                aria-label="Lembretes Diários"
              >
                <div className="relative flex items-center">
                  <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                  {servicosHojeCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-3.5 min-w-[15px] px-0.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-zinc-950 shadow">
                      {servicosHojeCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-xs font-semibold text-emerald-200 ml-1.5">
                  Lembretes
                </span>
              </button>

              {/* Botão de Ação Rápida: Adicionar Serviço - Com shrink-0 e dimensionamento seguro para mobile */}
              <button
                id="btn-novo-servico-topo"
                onClick={onOpenNewService}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-sm transition-all active:scale-95 border border-amber-400 shrink-0"
                title="Adicionar Solicitação de Serviço"
                aria-label="Adicionar Serviço"
              >
                <Plus className="w-4 h-4 stroke-[3] shrink-0" />
                <span className="text-xs font-extrabold">Serviço</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Barra de Navegação Inferior para Dispositivos Móveis (Mobile Bottom Bar) */}
      <nav
        aria-label="Navegação Mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-lg border-t border-emerald-800/80 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors min-w-[48px] ${
            activeTab === 'calendario'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Ir para Calendário"
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] tracking-tight">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('fila-espera')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors relative min-w-[48px] ${
            activeTab === 'fila-espera'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Ir para Fila de Espera"
        >
          <div className="relative">
            <Clock className="w-4 h-4 mb-0.5" />
            {filaCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-zinc-950 shadow">
                {filaCount}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight">Fila</span>
        </button>

        {/* Botão Central de Adicionar Serviço */}
        <button
          onClick={onOpenNewService}
          className="flex flex-col items-center justify-center -mt-3 p-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-full shadow-lg border-2 border-emerald-900 transition-transform active:scale-95 shrink-0"
          title="Adicionar Serviço"
          aria-label="Adicionar Serviço"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveTab('produtores')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors relative min-w-[48px] ${
            activeTab === 'produtores'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Ir para Produtores"
        >
          <div className="relative">
            <Users className="w-4 h-4 mb-0.5" />
            {pendenciasCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow">
                {pendenciasCount}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight">Produtores</span>
        </button>

        <button
          onClick={() => setActiveTab('novo-produtor')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors min-w-[48px] ${
            activeTab === 'novo-produtor'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Cadastrar Produtor"
        >
          <UserPlus className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] tracking-tight">Cadastrar</span>
        </button>

        <button
          onClick={onOpenReminders}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors relative min-w-[48px] text-emerald-300/70 hover:text-emerald-100"
          aria-label="Abrir Lembretes Diários"
        >
          <div className="relative">
            <Bell className="w-4 h-4 mb-0.5" />
            {servicosHojeCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-extrabold text-zinc-950 shadow">
                {servicosHojeCount}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight">Lembretes</span>
        </button>
      </nav>
    </>
  );
};
