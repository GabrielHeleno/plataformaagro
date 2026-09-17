import React from 'react';
import { Calendar, Users, UserPlus, Bell, Plus, Tractor } from 'lucide-react';
import { PermissionStatus } from '../utils/notifications';

interface NavbarProps {
  activeTab: 'calendario' | 'produtores' | 'novo-produtor';
  setActiveTab: (tab: 'calendario' | 'produtores' | 'novo-produtor') => void;
  servicosHojeCount: number;
  pendenciasCount: number;
  onOpenReminders: () => void;
  onOpenNewService: () => void;
  pushStatus: PermissionStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  servicosHojeCount,
  pendenciasCount,
  onOpenReminders,
  onOpenNewService,
  pushStatus,
}) => {
  return (
    <>
      {/* Barra de Navegação Superior (Header Principal) */}
      <header className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur-md text-white shadow-md border-b border-emerald-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Logo & Marca - Minimalista e Clean */}
            <div
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0"
              onClick={() => setActiveTab('calendario')}
              title="AgroGestão - Início"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-800 border border-emerald-500/30 flex items-center justify-center text-emerald-100 shadow-sm">
                <Tractor className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-emerald-300" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  AgroGestão
                </span>
                <span className="hidden lg:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-300">
                  Rural
                </span>
              </div>
            </div>

            {/* Menu de Navegação - Focado em Ícones e Texto Conciso */}
            <nav className="flex items-center bg-emerald-950/50 p-1 rounded-xl border border-emerald-800/70 gap-0.5 sm:gap-1 shadow-inner">
              {/* Aba: Calendário */}
              <button
                id="nav-tab-calendario"
                onClick={() => setActiveTab('calendario')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'calendario'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500/50'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Calendário de Serviços"
                aria-label="Calendário de Serviços"
              >
                <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="hidden md:inline">Calendário</span>
              </button>

              {/* Aba: Produtores (com alerta visual de pendência compacto) */}
              <button
                id="nav-tab-produtores"
                onClick={() => setActiveTab('produtores')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                  activeTab === 'produtores'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500/50'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Produtores Rurais & Busca"
                aria-label="Produtores Rurais & Busca"
              >
                <div className="relative flex items-center">
                  <Users className="w-4 h-4 text-emerald-300 shrink-0" />
                  {pendenciasCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-extrabold text-white bg-red-600 rounded-full shadow"
                      title={`${pendenciasCount} produtor(es) com pendências`}
                    >
                      {pendenciasCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline">Produtores</span>
              </button>

              {/* Aba: Cadastrar Produtor */}
              <button
                id="nav-tab-novo-produtor"
                onClick={() => setActiveTab('novo-produtor')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'novo-produtor'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-500/50'
                    : 'text-emerald-200/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
                title="Cadastrar Novo Produtor Rural"
                aria-label="Cadastrar Novo Produtor Rural"
              >
                <UserPlus className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="hidden lg:inline">Novo Produtor</span>
              </button>
            </nav>

            {/* Ações Rápidas: Notificações & Novo Serviço */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Botão de Lembretes Diários */}
              <button
                id="btn-lembretes-diarios"
                onClick={onOpenReminders}
                className="relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-emerald-100 hover:bg-emerald-800/80 transition-all flex items-center gap-1.5 border border-emerald-700/60 bg-emerald-950/40 shadow-sm active:scale-95"
                title={`Lembretes Diários (${servicosHojeCount} para hoje)`}
                aria-label="Lembretes Diários"
              >
                <div className="relative flex items-center">
                  <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
                  {servicosHojeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-zinc-950 shadow">
                      {servicosHojeCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-xs font-semibold text-emerald-200">
                  Lembretes
                </span>
              </button>

              {/* Botão de Novo Serviço */}
              <button
                id="btn-novo-servico-topo"
                onClick={onOpenNewService}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-sm transition-all active:scale-95 border border-amber-400"
                title="Agendar Nova Solicitação de Serviço"
                aria-label="Agendar Novo Serviço"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Serviço</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Navegação Inferior para Dispositivos Móveis (Mobile Bottom Bar) */}
      <nav
        aria-label="Navegação Mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-lg border-t border-emerald-800/80 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] ${
            activeTab === 'calendario'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Ir para Calendário"
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('produtores')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative min-w-[56px] ${
            activeTab === 'produtores'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Ir para Produtores"
        >
          <div className="relative">
            <Users className="w-5 h-5 mb-0.5" />
            {pendenciasCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow">
                {pendenciasCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Produtores</span>
        </button>

        {/* Botão Central de Adicionar Serviço */}
        <button
          onClick={onOpenNewService}
          className="flex flex-col items-center justify-center -mt-4 p-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-full shadow-lg border-2 border-emerald-900 transition-transform active:scale-95"
          title="Agendar Serviço"
          aria-label="Agendar Serviço"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('novo-produtor')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] ${
            activeTab === 'novo-produtor'
              ? 'text-amber-300 font-bold'
              : 'text-emerald-300/70 hover:text-emerald-100'
          }`}
          aria-label="Cadastrar Produtor"
        >
          <UserPlus className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Cadastrar</span>
        </button>

        <button
          onClick={onOpenReminders}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative min-w-[56px] text-emerald-300/70 hover:text-emerald-100"
          aria-label="Abrir Lembretes Diários"
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            {servicosHojeCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-extrabold text-zinc-950 shadow">
                {servicosHojeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Lembretes</span>
        </button>
      </nav>
    </>
  );
};

